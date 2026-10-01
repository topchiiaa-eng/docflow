import { useEffect, useState, type FormEvent } from 'react'
import { ROLE_LABELS, type EdoProvider, type Member, type MemberRole, type Organization } from '../types'
import { validateEmail, validateOrgName } from '../lib/validation'
import { log } from '../lib/logger'
import { track } from '../lib/analytics'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorView, LoadingView } from '../components/StateViews'

type LoadState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; orgs: Organization[] }

const input =
  'rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none'
const btn = 'rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60'

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
      <h1 className="text-lg font-bold">Организации</h1>

      <form
        onSubmit={(e) => void create(e)}
        className="flex flex-wrap items-start gap-2 rounded-2xl border bg-white p-4"
      >
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
            <p role="alert" className="mt-1 text-xs text-red-600">
              {newError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          + Создать
        </button>
      </form>

      {state.orgs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-600">
          Организаций пока нет — создайте первую, и вы станете её владельцем и подписантом.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {state.orgs.map((org) => (
            <OrgCard
              key={org.id}
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
  org,
  provider,
  onRenamed,
  onRequestDelete,
}: {
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
    <section aria-label={org.name} className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <div className="flex flex-1 gap-2">
            <input
              className={`${input} flex-1`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Новое название"
            />
            <button
              onClick={() => void rename()}
              disabled={busy}
              className={`${btn} bg-emerald-600 text-white`}
            >
              Сохранить
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setName(org.name)
              }}
              className={`${btn} border border-slate-300`}
            >
              Отмена
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-base font-bold">{org.name}</h2>
              <p className="text-xs text-slate-500">
                Ваша роль: {ROLE_LABELS[org.role]}
                {org.isOwner ? ' · владелец' : ''}
              </p>
            </div>
            {org.isOwner && (
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Переименовать
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={onRequestDelete}
                  className="text-xs font-semibold text-red-600 hover:underline"
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
          className="self-start text-xs font-semibold text-emerald-700 hover:underline"
        >
          Показать участников
        </button>
      ) : (
        <ul
          aria-label={`Участники ${org.name}`}
          className="divide-y divide-slate-100 rounded-xl border border-slate-100"
        >
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="truncate">{m.email}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {ROLE_LABELS[m.role]}
                </span>
                {org.isOwner && (
                  <button
                    onClick={() => void removeMember(m)}
                    disabled={busy}
                    aria-label={`Удалить ${m.email}`}
                    className="text-xs text-red-600 hover:underline"
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
            className={input}
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
          >
            {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className={`${btn} border border-emerald-600 text-emerald-700 hover:bg-emerald-50`}
          >
            Добавить
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </section>
  )
}
