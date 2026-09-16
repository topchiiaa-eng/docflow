import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DocFilter, DocumentItem, EdoProvider } from './types'
import { provider as appProvider, isDemo } from './api'
import { filterDocuments } from './lib/documents'
import { KpiTiles } from './components/KpiTiles'
import { FiltersBar } from './components/FiltersBar'
import { DocumentList } from './components/DocumentList'
import { DetailPanel } from './components/DetailPanel'
import { SignDialog } from './components/SignDialog'
import { ErrorView, LoadingView } from './components/StateViews'

const EMPTY_FILTER: DocFilter = { org: 'all', status: 'all', query: '' }

// Единственный экземпляр на модуль (из src/api): дефолт, создающий провайдер
// в параметрах компонента, порождал бы НОВЫЙ объект на каждый рендер и через
// useCallback([provider]) зацикливал загрузку (баг, найденный по логам консоли).
const defaultProvider = appProvider

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; docs: DocumentItem[] }

interface AppProps {
  provider?: EdoProvider
  userEmail?: string | null
  onLogout?: (() => void) | null
}

export default function App({ provider = defaultProvider, userEmail = null, onLogout = null }: AppProps) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [filter, setFilter] = useState<DocFilter>(EMPTY_FILTER)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const docs = await provider.listIncoming()
      setState({ kind: 'ready', docs })
    } catch (e) {
      console.error('listIncoming failed:', e)
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Неизвестная ошибка' })
    }
  }, [provider])

  useEffect(() => {
    void load()
  }, [load])

  const docs = state.kind === 'ready' ? state.docs : []
  const orgs = useMemo(() => [...new Set(docs.map((d) => d.org))], [docs])
  const visible = useMemo(() => filterDocuments(docs, filter), [docs, filter])
  const selected = docs.find((d) => d.id === selectedId) ?? null

  const openDoc = (id: string) => {
    setSelectedId(id)
    setSignError(null)
    // открытие карточки помечает документ прочитанным (US-3) — локально и на сервере
    setState((s) =>
      s.kind === 'ready'
        ? { kind: 'ready', docs: s.docs.map((d) => (d.id === id ? { ...d, unread: false } : d)) }
        : s,
    )
    provider.markRead?.(id).catch((e: unknown) => console.error('markRead failed:', e))
  }

  // Подписание — только после подтверждения в диалоге (правило 8 CLAUDE.md)
  const confirmSign = async () => {
    if (!selected) return
    setConfirming(false)
    setSigning(true)
    setSignError(null)
    try {
      await provider.sign(selected.id)
      setState((s) =>
        s.kind === 'ready'
          ? {
              kind: 'ready',
              docs: s.docs.map((d) => (d.id === selected.id ? { ...d, status: 'signed' as const } : d)),
            }
          : s,
      )
    } catch (e) {
      console.error('sign failed:', e)
      setSignError(e instanceof Error ? e.message : 'Не удалось подписать документ')
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="text-lg font-extrabold">
            Док<span className="text-emerald-600">Поток</span>
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            {isDemo ? 'единая входящая ЭДО · демо-режим (мок-провайдер)' : 'единая входящая ЭДО'}
          </span>
          {userEmail && (
            <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:inline">{userEmail}</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-slate-300 px-2.5 py-1 font-semibold hover:bg-slate-50"
                >
                  Выйти
                </button>
              )}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5">
        {state.kind === 'loading' && <LoadingView />}
        {state.kind === 'error' && <ErrorView message={state.message} onRetry={load} />}

        {state.kind === 'ready' && (
          <>
            <KpiTiles docs={docs} />
            <FiltersBar filter={filter} orgs={orgs} onChange={setFilter} />

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_380px]">
              <DocumentList
                docs={visible}
                selectedId={selectedId}
                onSelect={openDoc}
                onResetFilters={() => setFilter(EMPTY_FILTER)}
              />

              {/* Десктоп: панель справа; мобильные/планшет: выезжающая поверх (ТЗ, совместимость) */}
              <div
                className={
                  selected
                    ? 'fixed inset-0 z-40 bg-slate-900/30 p-3 pt-14 lg:static lg:z-auto lg:bg-transparent lg:p-0 lg:pt-0'
                    : 'hidden lg:block'
                }
                onClick={() => setSelectedId(null)}
              >
                <div className="mx-auto h-full max-w-md lg:max-w-none" onClick={(e) => e.stopPropagation()}>
                  <DetailPanel
                    doc={selected}
                    signing={signing}
                    signError={signError}
                    onRequestSign={() => setConfirming(true)}
                    onClose={() => setSelectedId(null)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {confirming && selected && (
        <SignDialog doc={selected} onConfirm={() => void confirmSign()} onCancel={() => setConfirming(false)} />
      )}
    </div>
  )
}
