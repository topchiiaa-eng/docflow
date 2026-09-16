import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DocumentItem, EdoProvider } from '../types'

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
      if (error) throw new Error(error.message)
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
      // единственный путь подписания — RPC с проверкой роли на стороне БД
      const { error } = await sb.rpc('sign_document', { doc_id: documentId })
      if (error) throw new Error(error.message)
    },

    async markRead(documentId) {
      const { error } = await sb.from('documents').update({ unread: false }).eq('id', documentId)
      if (error) console.error('markRead failed:', error.message)
    },
  }
}
