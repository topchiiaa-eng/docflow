import { NavLink, Outlet } from 'react-router-dom'
import { isDemo } from '../api'

interface Props {
  userEmail: string | null
  displayName: string | null
  onLogout: (() => void) | null
}

const NAV = [
  { to: '/', label: 'Входящие', end: true },
  { to: '/sign', label: 'На подпись' },
  { to: '/journal', label: 'Журнал' },
  { to: '/organizations', label: 'Организации' },
]

/** Каркас приложения: шапка с навигацией по экранам и блоком пользователя */
export function Layout({ userEmail, displayName, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <span className="text-lg font-extrabold">
            Док<span className="text-emerald-600">Поток</span>
          </span>
          {isDemo && (
            <span className="hidden text-xs text-slate-400 md:inline">демо-режим (мок-провайдер)</span>
          )}

          <nav aria-label="Разделы" className="order-last flex w-full gap-1 sm:order-none sm:w-auto sm:ml-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          {userEmail && (
            <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:inline">
                {displayName ? `${displayName} · ` : ''}
                {userEmail}
              </span>
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
        <Outlet />
      </main>
    </div>
  )
}
