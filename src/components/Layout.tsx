import { NavLink, Outlet } from 'react-router-dom'
import { isDemo } from '../api'
import { BuildingIcon, InboxIcon, JournalIcon, Logo, LogoutIcon, PenIcon } from './Icons'

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

/**
 * Каркас по концепции «Дашборд» (ДЗ-3): слева сайдбар с навигацией (≥lg),
 * на мобильных — компактная шапка и нижняя панель вкладок.
 */
export function Layout({ userEmail, displayName, onLogout }: Props) {
  const initials = (displayName ?? userEmail ?? 'Д')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
    }`

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Сайдбар (десктоп) */}
      <aside className="hidden lg:flex lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        <div className="px-5 py-5">
          <Logo />
          {isDemo && <p className="mt-1 text-[11px] text-slate-400">демо-режим · мок-провайдер</p>}
        </div>
        <nav aria-label="Разделы" className="flex flex-col gap-1 px-3">
          {NAV.map(({ to, label, end, Icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        {userEmail && (
          <div className="mt-auto border-t border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                {displayName && <p className="truncate text-sm font-semibold">{displayName}</p>}
                <p className="truncate text-xs text-slate-500">{userEmail}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  aria-label="Выйти"
                  title="Выйти"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink"
                >
                  <LogoutIcon size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Шапка (мобильные и планшеты) */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          {userEmail && onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600"
            >
              <span className="hidden max-w-[160px] truncate sm:inline">{userEmail}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {initials}
              </span>
            </button>
          )}
        </header>

        <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-5 px-4 pb-24 pt-5 lg:px-8 lg:pb-8 lg:pt-7">
          <Outlet />
        </main>

        {/* Нижняя навигация (мобильные) */}
        <nav
          aria-label="Разделы"
          className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
        >
          {NAV.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 text-[11px] font-semibold ${isActive ? 'text-brand-600' : 'text-slate-500'}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
