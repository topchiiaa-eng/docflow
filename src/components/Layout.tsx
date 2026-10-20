import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { isDemo } from '../api'
import { installReveal } from '../lib/reveal'
import { BuildingIcon, InboxIcon, JournalIcon, Logo, LogoutIcon, PenIcon } from './Icons'
import { ScrollProgress } from './ScrollProgress'

interface Props {
  userEmail: string | null
  displayName: string | null
  onLogout: (() => void) | null
}

const NAV = [
  { to: '/', label: 'Входящие', end: true, Icon: InboxIcon },
  { to: '/sign', label: 'На подпись', Icon: PenIcon },
  { to: '/journal', label: 'Журнал', Icon: JournalIcon },
  { to: '/organizations', label: 'Организации', Icon: BuildingIcon },
]

/** Дата выпуска «номера» — как в шапке газеты */
const today = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(
  new Date(),
)

/**
 * Каркас по DESIGN.md (Broadsheet): слева сайдбар с правой линейкой (≥lg),
 * на мобильных — шапка с 2px линейкой и нижняя панель разделов.
 */
export function Layout({ userEmail, displayName, onLogout }: Props) {
  useEffect(() => installReveal(document.body), [])

  const initials = (displayName ?? userEmail ?? 'Д')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 border-l-[3px] py-2.5 pl-4 pr-3 text-[0.9375rem] transition-colors ${
      isActive
        ? 'border-ink font-bold text-ink'
        : 'border-transparent text-meta hover:bg-paper-muted hover:text-ink'
    }`

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <ScrollProgress />

      {/* Сайдбар (десктоп) */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-rule lg:bg-paper">
        <div className="border-b-2 border-ink px-5 pb-4 pt-6">
          <Logo />
          <p className="label mt-3 text-meta-light">{today}</p>
          {isDemo && <p className="small mt-1 text-meta-light">демо-режим · мок-провайдер</p>}
        </div>
        <nav aria-label="Разделы" className="flex flex-col py-3 pr-4">
          {NAV.map(({ to, label, end, Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>
        {userEmail && (
          <div className="mt-auto border-t border-rule p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center bg-ink font-serif text-xs font-bold text-paper">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                {displayName && <p className="truncate text-sm font-semibold">{displayName}</p>}
                <p className="small truncate text-meta">{userEmail}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  aria-label="Выйти"
                  title="Выйти"
                  className="p-2 text-meta hover:bg-paper-subtle hover:text-ink"
                >
                  <LogoutIcon size={18} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Шапка (мобильные и планшеты) */}
        <header className="flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-3 lg:hidden">
          <Logo />
          {userEmail && onLogout && (
            <button onClick={onLogout} className="flex items-center gap-2 text-xs font-semibold text-meta">
              <span className="hidden max-w-[160px] truncate sm:inline">{userEmail}</span>
              <span className="grid h-8 w-8 place-items-center bg-ink font-serif text-xs font-bold text-paper">
                {initials}
              </span>
            </button>
          )}
        </header>

        <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 pb-24 pt-6 lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>

        {/* Нижняя навигация (мобильные) */}
        <nav
          aria-label="Разделы"
          className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-rule bg-paper lg:hidden"
        >
          {NAV.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 border-t-2 py-2 text-[10px] font-semibold uppercase tracking-[0.05em] ${
                  isActive ? '-mt-px border-ink text-ink' : 'border-transparent text-meta'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
