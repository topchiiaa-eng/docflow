import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../api'
import { log } from '../lib/logger'
import { track } from '../lib/analytics'
import { parseOAuthError } from '../lib/auth'
import { CheckIcon, Logo } from './Icons'

interface RenderProps {
  userEmail: string | null
  /** Имя из профиля OAuth-провайдера (Google), если есть */
  displayName: string | null
  onLogout: (() => void) | null
}

/**
 * Обёртка аутентификации (ТЗ, F-1 / Шаг 5 ДЗ):
 * без настроенного Supabase — демо-режим без входа;
 * с Supabase — вход/регистрация, дети рендерятся только при активной сессии.
 */
export function AuthGate({ children }: { children: (p: RenderProps) => ReactNode }) {
  if (!supabase) return <>{children({ userEmail: null, displayName: null, onLogout: null })}</>
  return <SupabaseGate sb={supabase}>{children}</SupabaseGate>
}

function SupabaseGate({ sb, children }: { sb: SupabaseClient; children: (p: RenderProps) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    void sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [sb])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (!session) return <LoginForm sb={sb} />

  return (
    <>
      {children({
        userEmail: session.user.email ?? null,
        displayName: (session.user.user_metadata?.full_name as string | undefined) ?? null,
        onLogout: () => {
          track('logout')
          void sb.auth.signOut()
        },
      })}
    </>
  )
}

/** Куда провайдер OAuth возвращает пользователя: константа, а не параметр из URL (open redirect) */
const OAUTH_REDIRECT = typeof window === 'undefined' ? '' : window.location.origin + import.meta.env.BASE_URL

function LoginForm({ sb }: { sb: SupabaseClient }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(() => {
    // Возврат после неудачного OAuth: показать причину и убрать её из адреса
    const oauthError = typeof window === 'undefined' ? null : parseOAuthError(window.location.hash)
    if (oauthError) {
      log.warn('auth.oauth_failed', { hash: window.location.hash.slice(0, 120) })
      window.history.replaceState(null, '', window.location.pathname)
    }
    return oauthError
  })
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const signInWithGoogle = async () => {
    setError(null)
    setBusy(true)
    track('login_google')
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: OAUTH_REDIRECT },
    })
    if (error) {
      log.warn('auth.oauth_start_failed', { message: error.message })
      setError('Не удалось начать вход через Google')
      setBusy(false)
    }
    // при успехе браузер уходит на страницу Google — busy сбрасывать не нужно
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        track('login_password')
      } else {
        const { data, error } = await sb.auth.signUp({ email, password })
        if (error) throw error
        track('signup')
        // при включённом подтверждении email сессии сразу нет
        if (!data.session) setNotice('Проверьте почту: мы отправили ссылку для подтверждения.')
      }
    } catch (err) {
      log.warn('auth.failed', { mode, message: err instanceof Error ? err.message : String(err) })
      setError(err instanceof Error ? translateAuthError(err.message) : 'Не удалось выполнить вход')
    } finally {
      setBusy(false)
    }
  }

  const input = 'input'

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Левая панель: ценность продукта (десктоп) */}
      <aside className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <Logo className="[&_span:last-child]:text-white" />
        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            Все входящие ЭДО-документы ваших компаний — в одной ленте
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            {[
              'Одна проверка утром вместо обхода ящиков каждого юрлица',
              'Очередь «на подпись» — ничего не теряется между организациями',
              'Подписание только после явного подтверждения, с журналом попыток',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
                  <CheckIcon size={12} strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">
          Демо: регистрация создаёт 3 организации и 6 документов автоматически
        </p>
      </aside>

      <div className="flex items-center justify-center bg-slate-50 p-4 sm:p-8">
        <form onSubmit={(e) => void submit(e)} className="card w-full max-w-sm p-6 sm:p-8">
          <h1 className="lg:hidden">
            <Logo />
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'signin'
              ? 'Вход в единую входящую ЭДО'
              : 'Регистрация: вы получите демо-набор из 3 организаций'}
          </p>

          <label className="label mt-4" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label mt-3" htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className={input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-2.5 text-sm text-brand-700"
            >
              {notice}
            </div>
          )}

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={busy}
            className="btn-secondary mt-5 w-full"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"
              />
              <path
                fill="#FBBC05"
                d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            Войти через Google
          </button>
          <div className="my-3 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            или по email
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Секунду…' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setNotice(null)
            }}
            className="mt-3 w-full text-center text-sm font-semibold text-brand-700 hover:underline"
          >
            {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Неверный email или пароль'
  if (/already registered/i.test(message)) return 'Такой пользователь уже зарегистрирован'
  if (/at least \d+ characters/i.test(message)) return 'Пароль должен быть не короче 8 символов'
  // остальное — общий текст: оригинал уже в логе (аудит F-05)
  return 'Не удалось выполнить вход, проверьте данные'
}
