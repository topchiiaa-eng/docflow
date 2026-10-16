import { useEffect, useMemo, useState } from 'react'
import type { DocFilter, DocumentItem, EdoProvider, NewDocumentInput, Organization } from '../types'
import { log } from '../lib/logger'
import { track } from '../lib/analytics'
import { filterDocuments } from '../lib/documents'
import { KpiTiles } from '../components/KpiTiles'
import { FiltersBar, type ViewMode } from '../components/FiltersBar'
import { Toasts, type ToastData } from '../components/Toast'
import { DocumentList } from '../components/DocumentList'
import { DetailPanel } from '../components/DetailPanel'
import { SignDialog } from '../components/SignDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NewDocumentDialog } from '../components/NewDocumentDialog'
import { ErrorView, LoadingView } from '../components/StateViews'

const EMPTY_FILTER: DocFilter = { org: 'all', status: 'all', query: '' }
// Стабильная ссылка для «нет данных»: новый [] на каждый рендер сбрасывал бы useMemo
const NO_DOCS: DocumentItem[] = []

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; docs: DocumentItem[] }

interface Props {
  provider: EdoProvider
  /** inbox — вся лента; sign — только очередь «требуется подпись» */
  mode?: 'inbox' | 'sign'
}

/** Экраны «Входящие» и «На подпись»: лента + карточка (master-detail), подписание, добавление, удаление */
export function InboxPage({ provider, mode = 'inbox' }: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [filter, setFilter] = useState<DocFilter>(EMPTY_FILTER)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('docflow.view') as ViewMode) || 'cards'
    } catch {
      return 'cards'
    }
  })
  const [toasts, setToasts] = useState<ToastData[]>([])
  const toast = (kind: ToastData['kind'], text: string) =>
    setToasts((t) => [...t, { id: Date.now() + Math.random(), kind, text }])
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))
  const changeView = (v: ViewMode) => {
    setView(v)
    try {
      localStorage.setItem('docflow.view', v)
    } catch {
      /* приватный режим — выбор не сохраняем */
    }
  }

  // Загрузка привязана к счётчику попыток: «Повторить» переводит экран в loading
  // в обработчике клика и инкрементирует attempt; сам эффект меняет состояние
  // только асинхронно и игнорирует устаревшие ответы (защита от гонки).
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    Promise.all([provider.listIncoming(), provider.listOrganizations()])
      .then(([docs, organizations]) => {
        if (cancelled) return
        setState({ kind: 'ready', docs })
        setOrgs(organizations)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        log.error('documents.load_failed', { message: e instanceof Error ? e.message : String(e) })
        track('load_error')
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Неизвестная ошибка' })
      })
    return () => {
      cancelled = true
    }
  }, [provider, attempt])

  const retry = () => {
    setState({ kind: 'loading' })
    setAttempt((a) => a + 1)
  }

  const docs = state.kind === 'ready' ? state.docs : NO_DOCS
  const orgCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of docs) m.set(d.org, (m.get(d.org) ?? 0) + 1)
    return [...m].map(([name, count]) => ({ name, count }))
  }, [docs])
  const effectiveFilter = useMemo(
    () => (mode === 'sign' ? { ...filter, status: 'requires_signature' as const } : filter),
    [mode, filter],
  )
  const visible = useMemo(() => filterDocuments(docs, effectiveFilter), [docs, effectiveFilter])
  const selected = docs.find((d) => d.id === selectedId) ?? null
  const canDelete = !!selected && (orgs.find((o) => o.id === selected.orgId)?.isOwner ?? false)

  const patchDoc = (id: string, patch: Partial<DocumentItem>) =>
    setState((s) =>
      s.kind === 'ready'
        ? { kind: 'ready', docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }
        : s,
    )

  const openDoc = (id: string) => {
    setSelectedId(id)
    setSignError(null)
    // открытие карточки помечает документ прочитанным (US-3) — локально и на сервере
    patchDoc(id, { unread: false })
    track('document_open')
    provider
      .markRead?.(id)
      .catch((e: unknown) => log.warn('document.mark_read_failed', { id, message: String(e) }))
  }

  // Подписание — только после подтверждения в диалоге (правило 8 CLAUDE.md)
  const confirmSign = async () => {
    if (!selected) return
    setConfirming(false)
    setSigning(true)
    setSignError(null)
    track('sign_confirm')
    try {
      await provider.sign(selected.id)
      log.info('document.signed', { id: selected.id })
      track('sign_success')
      patchDoc(selected.id, { status: 'signed' })
      toast('success', `Подписан: ${selected.title}`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось подписать документ'
      log.warn('document.sign_denied', { id: selected.id, message })
      track('sign_denied')
      setSignError(message)
    } finally {
      setSigning(false)
    }
  }

  const addDocument = async (input: NewDocumentInput) => {
    setAddBusy(true)
    setAddError(null)
    try {
      const doc = await provider.createDocument(input)
      setState((s) => (s.kind === 'ready' ? { kind: 'ready', docs: [doc, ...s.docs] } : s))
      setAdding(false)
      setSelectedId(doc.id)
      toast('success', input.file ? 'Документ добавлен, PDF загружен' : 'Документ добавлен')
      track('document_create')
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Не удалось добавить документ')
    } finally {
      setAddBusy(false)
    }
  }

  const deleteDocument = async () => {
    if (!selected) return
    setDeleteBusy(true)
    try {
      await provider.deleteDocument(selected.id)
      setState((s) =>
        s.kind === 'ready' ? { kind: 'ready', docs: s.docs.filter((d) => d.id !== selected.id) } : s,
      )
      setSelectedId(null)
      setDeleting(false)
      log.info('document.deleted', { id: selected.id })
      toast('success', 'Документ удалён')
    } catch (e) {
      setDeleting(false)
      setSignError(e instanceof Error ? e.message : 'Не удалось удалить документ')
    } finally {
      setDeleteBusy(false)
    }
  }

  const openFile = async () => {
    if (!selected?.filePath) return
    setFileBusy(true)
    try {
      const url = await provider.getFileUrl(selected.filePath)
      window.open(url, '_blank', 'noopener')
    } catch (e) {
      setSignError(e instanceof Error ? e.message : 'Не удалось получить файл')
    } finally {
      setFileBusy(false)
    }
  }

  if (state.kind === 'loading') return <LoadingView />
  if (state.kind === 'error') return <ErrorView message={state.message} onRetry={retry} />

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === 'sign' ? 'На подпись' : 'Входящие'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {mode === 'sign'
              ? 'Документы, ожидающие вашего решения, по всем организациям'
              : 'Единая лента входящих по всем организациям'}
          </p>
        </div>
        {mode === 'inbox' && orgs.length > 0 && (
          <button onClick={() => setAdding(true)} className="btn-primary">
            + Добавить документ
          </button>
        )}
      </div>

      {mode === 'inbox' && <KpiTiles docs={docs} />}
      <FiltersBar
        filter={effectiveFilter}
        orgs={orgCounts}
        total={docs.length}
        hideStatus={mode === 'sign'}
        view={view}
        onViewChange={changeView}
        onChange={(f) => {
          if (f.query !== filter.query) track('search')
          else track('filter_change')
          setFilter(f)
        }}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <DocumentList
          docs={visible}
          selectedId={selectedId}
          view={view}
          onSelect={openDoc}
          onResetFilters={() => setFilter(EMPTY_FILTER)}
          emptyText={mode === 'sign' ? 'Документов, ожидающих подписи, нет' : undefined}
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
              canDelete={canDelete}
              fileBusy={fileBusy}
              onRequestSign={() => {
                track('sign_dialog_open')
                setConfirming(true)
              }}
              onOpenFile={() => void openFile()}
              onRequestDelete={() => setDeleting(true)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>
      </div>

      <Toasts items={toasts} onDismiss={dismissToast} />
      {confirming && selected && (
        <SignDialog
          doc={selected}
          onConfirm={() => void confirmSign()}
          onCancel={() => setConfirming(false)}
        />
      )}
      {adding && (
        <NewDocumentDialog
          orgs={orgs}
          busy={addBusy}
          error={addError}
          onSubmit={(input) => void addDocument(input)}
          onCancel={() => setAdding(false)}
        />
      )}
      {deleting && selected && (
        <ConfirmDialog
          title="Удалить документ?"
          text={`«${selected.title}» от ${selected.counterparty} будет удалён вместе с файлом. Это действие необратимо.`}
          confirmLabel="Удалить"
          danger
          busy={deleteBusy}
          onConfirm={() => void deleteDocument()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </>
  )
}
