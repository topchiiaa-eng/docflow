import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { ROLE_LABELS, type EdoProvider, type Member, type MemberRole, type Organization } from '../types'
import { validateEmail, validateOrgName } from '../lib/validation'
import { log } from '../lib/logger'
import { track } from '../lib/analytics'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorView, LoadingView } from '../components/StateViews'
import { PageHeader } from '../components/PageHeader'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; orgs: Organization[] }

const input = 'input'

/** Экран «Организации»: создание, переименование, удаление; участники и роли (владелец) */
export function OrganizationsPage({ provider }: { provider: EdoProvider }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [newName, setNewName] = useState('')
  const [newError, setNewError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<Organization | null>(null)

  useEffect(() => {
    let cancelled = false
    provider
      .listOrganizations()
      .then((orgs) => {
        if (!cancelled) setState({ kind: 'ready', orgs })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        log.error('organizations.load_failed', { message: String(e) })
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Неизвестная ошибка' })
      })
    return () => {
      cancelled = true
    }
  }, [provider, attempt])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const err = validateOrgName(newName)
    if (err) return setNewError(err)
    setBusy(true)
    setNewError(null)
    try {
      const org = await provider.createOrganization(newName)
      setState((s) => (s.kind === 'ready' ? { kind: 'ready', orgs: [...s.orgs, org] } : s))
      setNewName('')
      track('org_create')
    } catch (e) {
      setNewError(e instanceof Error ? e.message : 'Не удалось создать организацию')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await provider.deleteOrganization(deleting.id)
      setState((s) =>
        s.kind === 'ready' ? { kind: 'ready', orgs: s.orgs.filter((o) => o.id !== deleting.id) } : s,
      )
      setDeleting(null)
    } catch (e) {
      setNewError(e instanceof Error ? e.message : 'Не удалось удалить организацию')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

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

  return (
    <>
      <PageHeader
        title="Организации"
        subtitle="Юрлица, их участники и роли. Владелец управляет составом команды"
      />

      <form onSubmit={(e) => void create(e)} className="reveal flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="org-name">
            Название новой организации
          </label>
          <input
            id="org-name"
            className={`${input} w-full`}
            placeholder="Название новой организации (например, ООО «Ромашка»)"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              setNewError(null)
            }}
          />
          {newError && (
            <p role="alert" className="mt-1 text-xs text-urgent">
              {newError}
            </p>
          )}
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          + Создать
        </button>
      </form>

      {state.orgs.length === 0 ? (
        <div className="border-y border-rule px-6 py-14 text-center">
          <p className="label">Пусто</p>
          <p className="h2 mt-2">Организаций пока нет</p>
          <p className="mt-2 text-meta">Создайте первую — вы станете её владельцем и подписантом.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {state.orgs.map((org, i) => (
            <OrgCard
              key={org.id}
              index={i}
              org={org}
              provider={provider}
              onRenamed={(name) =>
                setState((s) =>
                  s.kind === 'ready'
                    ? { kind: 'ready', orgs: s.orgs.map((o) => (o.id === org.id ? { ...o, name } : o)) }
                    : s,
                )
              }
              onRequestDelete={() => setDeleting(org)}
            />
          ))}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Удалить организацию?"
          text={`«${deleting.name}» и все её документы, участники и файлы будут удалены. Это действие необратимо.`}
          confirmLabel="Удалить"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  )
}

function OrgCard({
  index,
  org,
  provider,
  onRenamed,
  onRequestDelete,
}: {
  index: number
  org: Organization
  provider: EdoProvider
  onRenamed: (name: string) => void
  onRequestDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(org.name)
  const [members, setMembers] = useState<Member[] | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('operator')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadMembers = async () => {
    try {
      setMembers(await provider.listMembers(org.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить участников')
    }
  }

  const rename = async () => {
    const err = validateOrgName(name)
    if (err) return setError(err)
    setBusy(true)
    setError(null)
    try {
      await provider.renameOrganization(org.id, name)
      onRenamed(name.trim())
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось переименовать')
    } finally {
      setBusy(false)
    }
  }

  const addMember = async (e: FormEvent) => {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) return setError(err)
    setBusy(true)
    setError(null)
    try {
      const m = await provider.addMember(org.id, email, role)
      setMembers((list) => [...(list ?? []).filter((x) => x.userId !== m.userId), m])
      setEmail('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить участника')
    } finally {
      setBusy(false)
    }
  }

  const removeMember = async (m: Member) => {
    setBusy(true)
    setError(null)
    try {
      await provider.removeMember(org.id, m.userId)
      setMembers((list) => (list ?? []).filter((x) => x.userId !== m.userId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить участника')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-label={org.name}
      className="card-elevated reveal flex flex-col gap-3 p-4"
      style={{ '--reveal-i': index } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <div className="flex flex-1 gap-2">
            <input
              className={`${input} flex-1`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Новое название"
            />
            <button onClick={() => void rename()} disabled={busy} className="btn-primary px-3">
              Сохранить
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setName(org.name)
              }}
              className="btn-secondary px-3"
            >
              Отмена
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="h3">{org.name}</h2>
              <p className="small mt-0.5 text-meta">
                Ваша роль: {ROLE_LABELS[org.role]}
                {org.isOwner ? ' · владелец' : ''}
              </p>
            </div>
            {org.isOwner && (
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold underline-offset-4 hover:underline"
                >
                  Переименовать
                </button>
                <span className="text-meta-light">·</span>
                <button
                  onClick={onRequestDelete}
                  className="text-xs font-semibold text-urgent underline-offset-4 hover:underline"
                >
                  Удалить
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {members === null ? (
        <button
          onClick={() => void loadMembers()}
          className="self-start text-xs font-semibold underline underline-offset-4"
        >
          Показать участников
        </button>
      ) : (
        <ul aria-label={`Участники ${org.name}`} className="border-t border-rule">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-2 border-b border-rule py-2 text-sm"
            >
              <span className="truncate">{m.email}</span>
              <span className="flex items-center gap-2">
                <span className="chip bg-paper-subtle text-meta">{ROLE_LABELS[m.role]}</span>
                {org.isOwner && (
                  <button
                    onClick={() => void removeMember(m)}
                    disabled={busy}
                    aria-label={`Удалить ${m.email}`}
                    className="px-1 text-xs text-urgent hover:underline"
                  >
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {org.isOwner && members !== null && (
        <form onSubmit={(e) => void addMember(e)} className="flex flex-wrap gap-2">
          <input
            type="email"
            aria-label="Email участника"
            className={`${input} min-w-0 flex-1`}
            placeholder="email зарегистрированного пользователя"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            aria-label="Роль"
            className="input w-auto! shrink-0"
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
          >
            {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="btn-secondary">
            Добавить
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}
    </section>
  )
}
