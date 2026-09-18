import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js'
import type { DocumentItem, EdoProvider } from '../types'
import { log } from '../lib/logger'

/**
 * Пользователю — общий текст на русском, разработчику — оригинал в лог
 * (аудит F-05: сообщения PostgREST раскрывали имена таблиц и HINT'ы).
 */
function userMessage(op: string, error: PostgrestError): Error {
  log.error(`supabase.${op}_failed`, { code: error.code, message: error.message })
  const byCode: Record<string, string> = {
    '42501': 'Недостаточно прав для этой операции',
    PGRST301: 'Сессия истекла — войдите заново',
    PGRST116: 'Данные не найдены',
  }
  if (byCode[error.code]) return new Error(byCode[error.code])
  if (/JWT|token/i.test(error.message)) return new Error('Сессия истекла — войдите заново')
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
  counterparty: string
  title: string
  kind: DocumentItem['kind']
  sum: number | null
  received_at: string
  status: DocumentItem['status']
  unread: boolean
  organizations: { name: string } | null
}

/** Реализация EdoProvider поверх Supabase (PostgREST + RPC), RLS на стороне БД */
export function createSupabaseProvider(sb: SupabaseClient): EdoProvider {
  return {
    async listIncoming() {
      const { data, error } = await sb
        .from('documents')
        .select('id, counterparty, title, kind, sum, received_at, status, unread, organizations(name)')
        .order('received_at', { ascending: false })
      if (error) throw userMessage('list', error)
      return (data as unknown as DocumentRow[]).map((r) => ({
        id: r.id,
        org: r.organizations?.name ?? '—',
        counterparty: r.counterparty,
        title: r.title,
        kind: r.kind,
        sum: r.sum === null ? null : Number(r.sum),
        receivedAt: r.received_at,
        status: r.status,
        unread: r.unread,
      }))
    },

    async sign(documentId) {
      // единственный путь подписания — RPC с проверкой роли на стороне БД.
      // Бизнес-отказы приходят как {ok:false, error} (а не исключением),
      // чтобы запись об отказе в журнале sign_attempts не откатывалась.
      const { data, error } = await sb.rpc('sign_document', { doc_id: documentId })
      if (error) throw userMessage('sign', error)
      const result = data as { ok: boolean; error?: string }
      if (!result.ok) throw new Error(result.error ?? 'Не удалось подписать документ')
    },

    async markRead(documentId) {
      const { error } = await sb.from('documents').update({ unread: false }).eq('id', documentId)
      if (error) log.warn('supabase.mark_read_failed', { code: error.code, message: error.message })
    },
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
