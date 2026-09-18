import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseProvider } from './supabaseProvider'

/** Фейковый клиент: проверяем маппинг и обработку ответов без сети */
function fakeClient(opts: {
  rows?: unknown[]
  rpcData?: unknown
  rpcError?: { code?: string; message: string } | null
  listError?: { code: string; message: string } | null
}) {
  const query = {
    select: () => query,
    order: async () => ({ data: opts.listError ? null : (opts.rows ?? []), error: opts.listError ?? null }),
    update: () => ({ eq: async () => ({ error: null }) }),
  }
  return {
    from: () => query,
    rpc: async () => ({ data: opts.rpcData ?? null, error: opts.rpcError ?? null }),
  } as unknown as SupabaseClient
}

describe('supabaseProvider', () => {
  it('маппит строки PostgREST в DocumentItem (организация из join, сумма → число)', async () => {
    const p = createSupabaseProvider(
      fakeClient({
        rows: [
          {
            id: '1',
            counterparty: 'ООО «Тест»',
            title: 'УПД № 1',
            kind: 'УПД',
            sum: '100.00',
            received_at: '2026-09-16T10:00:00Z',
            status: 'info',
            unread: true,
            organizations: { name: 'Компания А' },
          },
        ],
      }),
    )
    const [doc] = await p.listIncoming()
    expect(doc.org).toBe('Компания А')
    expect(doc.sum).toBe(100)
    expect(doc.receivedAt).toBe('2026-09-16T10:00:00Z')
  })

  it('sign: {ok:true} → успех без исключения', async () => {
    const p = createSupabaseProvider(fakeClient({ rpcData: { ok: true, document: {} } }))
    await expect(p.sign('x')).resolves.toBeUndefined()
  })

  it('sign: бизнес-отказ {ok:false} превращается в ошибку с текстом от сервера (негативный)', async () => {
    const p = createSupabaseProvider(
      fakeClient({ rpcData: { ok: false, error: 'Подписание доступно только роли «Подписант»' } }),
    )
    await expect(p.sign('x')).rejects.toThrow('только роли')
  })

  it('sign: транспортная ошибка PostgREST → общий русский текст, оригинал только в лог (аудит F-05)', async () => {
    const p = createSupabaseProvider(fakeClient({ rpcError: { code: 'PGRST301', message: 'JWT expired' } }))
    await expect(p.sign('x')).rejects.toThrow('Сессия истекла')
  })

  it('list: permission denied не раскрывает имена таблиц пользователю (негативный)', async () => {
    const p = createSupabaseProvider(
      fakeClient({ listError: { code: '42501', message: 'permission denied for table documents' } }),
    )
    await expect(p.listIncoming()).rejects.toThrow('Недостаточно прав')
    await expect(p.listIncoming()).rejects.not.toThrow(/table documents/)
  })
})
