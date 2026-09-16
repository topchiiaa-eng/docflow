import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../api'

interface RenderProps {
  userEmail: string | null
  onLogout: (() => void) | null
}

/**
 * Обёртка аутентификации (ТЗ, F-1 / Шаг 5 ДЗ):
 * без настроенного Supabase — демо-режим без входа;
 * с Supabase — вход/регистрация, дети рендерятся только при активной сессии.
 */
export function AuthGate({ children }: { children: (p: RenderProps) => ReactNode }) {
  if (!supabase) return <>{children({ userEmail: null, onLogout: null })}</>
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    )
  }

  if (!session) return <LoginForm sb={sb} />

  return (
    <>
      {children({
        userEmail: session.user.email ?? null,
        onLogout: () => void sb.auth.signOut(),
      })}
    </>
  )
}

function LoginForm({ sb }: { sb: SupabaseClient }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await sb.auth.signUp({ email, password })
        if (error) throw error
        // при включённом подтверждении email сессии сразу нет
        if (!data.session) setNotice('Проверьте почту: мы отправили ссылку для подтверждения.')
      }
    } catch (err) {
      console.error('auth failed:', err)
      setError(err instanceof Error ? translateAuthError(err.message) : 'Не удалось выполнить вход')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-extrabold">
          Док<span className="text-emerald-600">Поток</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'signin' ? 'Вход в единую входящую ЭДО' : 'Регистрация: вы получите демо-набор из 3 организаций'}
        </p>

        <label className="mt-4 block text-xs font-semibold text-slate-600" htmlFor="email">Email</label>
        <input id="email" type="email" required autoComplete="email" className={input}
               value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="mt-3 block text-xs font-semibold text-slate-600" htmlFor="password">Пароль</label>
        <input id="password" type="password" required minLength={6} autoComplete="current-password" className={input}
               value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && (
          <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <button type="submit" disabled={busy}
                className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
          {busy ? 'Секунду…' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <button type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setNotice(null) }}
                className="mt-3 w-full text-center text-sm text-emerald-700 hover:underline">
          {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </form>
    </div>
  )
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Неверный email или пароль'
  if (/already registered/i.test(message)) return 'Такой пользователь уже зарегистрирован'
  if (/at least 6 characters/i.test(message)) return 'Пароль должен быть не короче 6 символов'
  return message
}
