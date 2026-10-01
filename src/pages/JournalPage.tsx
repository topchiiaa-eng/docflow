import { useEffect, useState } from 'react'
import type { EdoProvider, JournalEntry } from '../types'
import { formatDate } from '../lib/documents'
import { log } from '../lib/logger'
import { ErrorView, LoadingView } from '../components/StateViews'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; entries: JournalEntry[] }

/** Экран «Журнал подписаний»: append-only журнал sign_attempts — успехи и отказы */
export function JournalPage({ provider }: { provider: EdoProvider }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [onlyFailed, setOnlyFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    provider
      .listJournal()
      .then((entries) => {
        if (!cancelled) setState({ kind: 'ready', entries })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        log.error('journal.load_failed', { message: String(e) })
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Неизвестная ошибка' })
      })
    return () => {
      cancelled = true
    }
  }, [provider, attempt])

  if (state.kind === 'loading') return <LoadingView />
  if (state.kind === 'error')
    return (
      <ErrorView
        message={state.message}
        onRetry={() => {
          setState({ kind: 'loading' })
          setAttempt((a) => a + 1)
        }}
      />
    )

  const entries = onlyFailed ? state.entries.filter((e) => !e.success) : state.entries
  const failed = state.entries.filter((e) => !e.success).length

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">Журнал подписаний</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} />
          Только отказы ({failed})
        </label>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-600">
          {onlyFailed ? 'Отказов не было' : 'Журнал пуст — подпишите первый документ на экране «На подпись»'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Когда</th>
                <th className="px-4 py-2.5">Документ</th>
                <th className="px-4 py-2.5">Контрагент</th>
                <th className="px-4 py-2.5">Организация</th>
                <th className="px-4 py-2.5">Результат</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                    {formatDate(e.attemptedAt)}
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{e.documentTitle}</td>
                  <td className="px-4 py-2.5">{e.counterparty}</td>
                  <td className="px-4 py-2.5 text-slate-500">{e.org}</td>
                  <td className="px-4 py-2.5">
                    {e.success ? (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Подписан
                      </span>
                    ) : (
                      <span
                        title={e.detail ?? ''}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
                      >
                        Отказ{e.detail ? `: ${e.detail.replace(/^отказ:\s*/, '')}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
