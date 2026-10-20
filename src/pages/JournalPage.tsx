import { useEffect, useState } from 'react'
import type { EdoProvider, JournalEntry } from '../types'
import { formatDate } from '../lib/documents'
import { log } from '../lib/logger'
import { ErrorView, LoadingView } from '../components/StateViews'
import { PageHeader } from '../components/PageHeader'

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
      <PageHeader
        title="Журнал подписаний"
        subtitle="Кто, что и когда подписал — и какие попытки были отклонены"
      >
        <label className="flex items-center gap-2 text-sm text-meta">
          <input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} />
          Только отказы ({failed})
        </label>
      </PageHeader>

      {entries.length === 0 ? (
        <div className="border-y border-rule px-6 py-14 text-center">
          <p className="label">Пусто</p>
          <p className="h2 mt-2">{onlyFailed ? 'Отказов не было' : 'Журнал пуст'}</p>
          {!onlyFailed && <p className="mt-2 text-meta">Подпишите первый документ на экране «На подпись»</p>}
        </div>
      ) : (
        <div className="reveal overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="caps border-b-2 border-ink text-left">
              <tr>
                <th className="py-2.5 pr-4 font-semibold">Когда</th>
                <th className="px-4 py-2.5 font-semibold">Документ</th>
                <th className="px-4 py-2.5 font-semibold">Контрагент</th>
                <th className="px-4 py-2.5 font-semibold">Организация</th>
                <th className="py-2.5 pl-4 font-semibold">Результат</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-rule">
                  <td className="num whitespace-nowrap py-3 pr-4 text-meta">{formatDate(e.attemptedAt)}</td>
                  <td className="px-4 py-3 font-semibold">{e.documentTitle}</td>
                  <td className="px-4 py-3">{e.counterparty}</td>
                  <td className="px-4 py-3 text-meta">{e.org}</td>
                  <td className="py-3 pl-4">
                    {e.success ? (
                      <span className="chip bg-success-container text-on-success">Подписан</span>
                    ) : (
                      <span
                        title={e.detail ?? ''}
                        className="chip bg-error-container normal-case tracking-normal text-on-error"
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
