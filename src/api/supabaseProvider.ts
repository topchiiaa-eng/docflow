import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js'
import type { DocumentItem, EdoProvider, JournalEntry, Member, MemberRole, Organization } from '../types'
import { log } from '../lib/logger'
import { parseSum } from '../lib/validation'

/**
 * Пользователю — общий текст на русском, разработчику — оригинал в лог
 * (аудит F-05: сообщения PostgREST раскрывали имена таблиц и HINT'ы).
 */
function userMessage(op: string, error: PostgrestError | { code?: string; message: string }): Error {
  log.error(`supabase.${op}_failed`, { code: error.code, message: error.message })
  const byCode: Record<string, string> = {
    '42501': 'Недостаточно прав для этой операции',
    '23514': 'Данные не прошли проверку на сервере',
    '23503': 'Нельзя удалить: есть связанные записи',
    PGRST301: 'Сессия истекла — войдите заново',
    PGRST116: 'Данные не найдены',
  }
  if (error.code && byCode[error.code]) return new Error(byCode[error.code])
  if (/JWT|token/i.test(error.message)) return new Error('Сессия истекла — войдите заново')
  if (/row-level security/i.test(error.message)) return new Error('Недостаточно прав для этой операции')
  return new Error('Сервис временно недоступен, попробуйте ещё раз')
}

/** Клиент создаётся только если заданы переменные окружения (см. .env.example) */
export function createSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !key) return null
  return createClient(url, key)
}

interface DocumentRow {
  id: string
  org_id: string
  counterparty: string
  title: string
  kind: DocumentItem['kind']
  sum: number | string | null
  received_at: string
  status: DocumentItem['status']
  unread: boolean
  file_path: string | null
  organizations: { name: string } | null
}

const DOC_SELECT =
  'id, org_id, counterparty, title, kind, sum, received_at, status, unread, file_path, organizations(name)'

function toDocument(r: DocumentRow): DocumentItem {
  return {
    id: r.id,
    orgId: r.org_id,
    org: r.organizations?.name ?? '—',
    counterparty: r.counterparty,
    title: r.title,
    kind: r.kind,
    sum: r.sum === null ? null : Number(r.sum),
    receivedAt: r.received_at,
    status: r.status,
    unread: r.unread,
    filePath: r.file_path,
  }
}

type RpcResult<T> = ({ ok: true } & T) | { ok: false; error: string }

/** Реализация EdoProvider поверх Supabase (PostgREST + RPC + Storage), RLS на стороне БД */
export function createSupabaseProvider(sb: SupabaseClient): EdoProvider {
  const userId = async () => {
    const { data } = await sb.auth.getSession()
    const id = data.session?.user.id
    if (!id) throw new Error('Сессия истекла — войдите заново')
    return id
  }

  return {
    async listIncoming() {
      const { data, error } = await sb
        .from('documents')
        .select(DOC_SELECT)
        .order('received_at', { ascending: false })
      if (error) throw userMessage('list', error)
      return (data as unknown as DocumentRow[]).map(toDocument)
    },

    async sign(documentId) {
      // единственный путь подписания — RPC с проверкой роли на стороне БД.
      // Бизнес-отказы приходят как {ok:false, error} (а не исключением),
      // чтобы запись об отказе в журнале sign_attempts не откатывалась.
      const { data, error } = await sb.rpc('sign_document', { doc_id: documentId })
      if (error) throw userMessage('sign', error)
      const result = data as RpcResult<object>
      if (!result.ok) throw new Error(result.error ?? 'Не удалось подписать документ')
    },

    async markRead(documentId) {
      const { error } = await sb.from('documents').update({ unread: false }).eq('id', documentId)
      if (error) log.warn('supabase.mark_read_failed', { code: error.code, message: error.message })
    },

    async createDocument(input) {
      const uid = await userId()
      const { data, error } = await sb
        .from('documents')
        .insert({
          org_id: input.orgId,
          counterparty: input.counterparty.trim(),
          title: input.title.trim(),
          kind: input.kind,
          sum: parseSum(input.sum).value,
          status: input.requiresSignature ? 'requires_signature' : 'info',
          created_by: uid,
        })
        .select(DOC_SELECT)
        .single()
      if (error) throw userMessage('create_document', error)
      let row = data as unknown as DocumentRow

      // Файл грузится после создания строки: путь <org_id>/<doc_id>.pdf проверяется политикой Storage
      if (input.file) {
        const path = `${row.org_id}/${row.id}.pdf`
        const up = await sb.storage
          .from('documents')
          .upload(path, input.file, { contentType: 'application/pdf' })
        if (up.error) {
          log.error('supabase.upload_failed', { message: up.error.message })
          throw new Error('Документ создан, но файл загрузить не удалось — попробуйте прикрепить его позже')
        }
        const upd = await sb
          .from('documents')
          .update({ file_path: path })
          .eq('id', row.id)
          .select(DOC_SELECT)
          .single()
        if (upd.error) throw userMessage('attach_file', upd.error)
        row = upd.data as unknown as DocumentRow
      }
      log.info('document.created', { id: row.id, hasFile: !!input.file })
      return toDocument(row)
    },

    async deleteDocument(documentId) {
      const { data, error } = await sb.from('documents').delete().eq('id', documentId).select('id, file_path')
      if (error) throw userMessage('delete_document', error)
      // RLS без ошибки, но 0 строк = нет права (не владелец / документ подписан)
      if (!data?.length) throw new Error('Удалять можно только неподписанные документы своей организации')
      const path = (data[0] as { file_path: string | null }).file_path
      if (path) {
        const rm = await sb.storage.from('documents').remove([path])
        if (rm.error) log.warn('supabase.file_remove_failed', { path, message: rm.error.message })
      }
    },

    async getFileUrl(filePath) {
      const { data, error } = await sb.storage.from('documents').createSignedUrl(filePath, 60)
      if (error) throw userMessage('file_url', { message: error.message })
      return data.signedUrl
    },

    async listOrganizations() {
      const uid = await userId()
      const [orgs, memberships] = await Promise.all([
        sb.from('organizations').select('id, name, created_by').order('name'),
        sb.from('org_members').select('org_id, role').eq('user_id', uid),
      ])
      if (orgs.error) throw userMessage('list_orgs', orgs.error)
      if (memberships.error) throw userMessage('list_memberships', memberships.error)
      const roles = new Map(
        (memberships.data as { org_id: string; role: MemberRole }[]).map((m) => [m.org_id, m.role]),
      )
      return (orgs.data as { id: string; name: string; created_by: string | null }[]).map((o) => ({
        id: o.id,
        name: o.name,
        isOwner: o.created_by === uid,
        role: roles.get(o.id) ?? 'operator',
      }))
    },

    async createOrganization(name) {
      const uid = await userId()
      const { data, error } = await sb
        .from('organizations')
        .insert({ name: name.trim(), created_by: uid })
        .select('id, name')
        .single()
      if (error) throw userMessage('create_org', error)
      log.info('organization.created', { id: data.id })
      return { id: data.id, name: data.name, isOwner: true, role: 'signer' }
    },

    async renameOrganization(id, name) {
      const { data, error } = await sb
        .from('organizations')
        .update({ name: name.trim() })
        .eq('id', id)
        .select('id')
      if (error) throw userMessage('rename_org', error)
      if (!data?.length) throw new Error('Переименовать организацию может только её владелец')
    },

    async deleteOrganization(id) {
      const { data, error } = await sb.from('organizations').delete().eq('id', id).select('id')
      if (error) throw userMessage('delete_org', error)
      if (!data?.length) throw new Error('Удалить организацию может только её владелец')
      log.info('organization.deleted', { id })
    },

    async listMembers(orgId) {
      const { data, error } = await sb.rpc('list_members', { org: orgId })
      if (error) throw userMessage('list_members', error)
      return (data as { user_id: string; email: string; role: MemberRole }[]).map((m) => ({
        userId: m.user_id,
        email: m.email,
        role: m.role,
      }))
    },

    async addMember(orgId, email, role) {
      const { data, error } = await sb.rpc('add_member_by_email', {
        org: orgId,
        member_email: email.trim(),
        member_role: role,
      })
      if (error) throw userMessage('add_member', error)
      const result = data as RpcResult<{ member: { user_id: string; email: string; role: MemberRole } }>
      if (!result.ok) throw new Error(result.error)
      return { userId: result.member.user_id, email: result.member.email, role: result.member.role }
    },

    async removeMember(orgId, memberUserId) {
      const { data, error } = await sb
        .from('org_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', memberUserId)
        .select('user_id')
      if (error) throw userMessage('remove_member', error)
      if (!data?.length) throw new Error('Удалять участников может только владелец (и нельзя удалить себя)')
    },

    async listJournal() {
      const { data, error } = await sb
        .from('sign_attempts')
        .select('id, attempted_at, success, detail, documents(title, counterparty, organizations(name))')
        .order('id', { ascending: false })
        .limit(200)
      if (error) throw userMessage('journal', error)
      type Row = {
        id: number
        attempted_at: string
        success: boolean
        detail: string | null
        documents: { title: string; counterparty: string; organizations: { name: string } | null } | null
      }
      return (data as unknown as Row[]).map((r) => ({
        id: r.id,
        attemptedAt: r.attempted_at,
        success: r.success,
        detail: r.detail,
        documentTitle: r.documents?.title ?? '—',
        counterparty: r.documents?.counterparty ?? '—',
        org: r.documents?.organizations?.name ?? '—',
      }))
    },
  } satisfies EdoProvider & {
    listJournal(): Promise<JournalEntry[]>
    listMembers(o: string): Promise<Member[]>
    listOrganizations(): Promise<Organization[]>
  }
}

/** Sink для логгера: warn/error уходят в таблицу client_logs (миграция 3), только для вошедших */
export function createSupabaseLogSink(sb: SupabaseClient) {
  return async (record: { level: string; event: string; [k: string]: unknown }) => {
    const { data } = await sb.auth.getSession()
    const userId = data.session?.user.id
    if (!userId) return
    const { ts: _ts, level, event, ...context } = record
    await sb.from('client_logs').insert({
      level,
      event,
      context,
      user_id: userId,
      ua: typeof navigator === 'undefined' ? null : navigator.userAgent.slice(0, 200),
    })
  }
}
