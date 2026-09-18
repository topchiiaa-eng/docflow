/**
 * Аналитика — Яндекс.Метрика (ДЗ-6, Шаг 4).
 * Счётчик задаётся VITE_YM_ID; без него все вызовы — no-op (демо, тесты, CI).
 * События продукта (goal-цели в Метрике) перечислены в AnalyticsEvent —
 * это единая точка правды для настройки целей в интерфейсе Метрики.
 */
export type AnalyticsEvent =
  | 'login_password'
  | 'login_google'
  | 'signup'
  | 'logout'
  | 'document_open'
  | 'filter_change'
  | 'search'
  | 'sign_dialog_open'
  | 'sign_confirm'
  | 'sign_success'
  | 'sign_denied'
  | 'load_error'

type YmFn = (id: number, method: string, ...args: unknown[]) => void

declare global {
  interface Window {
    ym?: YmFn
  }
}

let counterId: number | null = null

/** Вставляет тег Метрики; безопасно вызывать повторно и без счётчика */
export function initAnalytics(id: string | undefined = import.meta.env.VITE_YM_ID as string | undefined) {
  const parsed = Number(id)
  if (!id || !Number.isFinite(parsed) || typeof document === 'undefined') return false
  if (counterId === parsed) return true
  counterId = parsed

  // Стандартный сниппет Метрики, без document.write и без inline-обработчиков (CSP-friendly)
  window.ym =
    window.ym ??
    (function (this: unknown, ...args: unknown[]) {
      ;((window.ym as unknown as { a: unknown[] }).a ??= []).push(args)
    } as unknown as YmFn)
  ;(window.ym as unknown as { l: number }).l = Date.now()

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://mc.yandex.ru/metrika/tag.js'
  document.head.appendChild(script)

  window.ym(parsed, 'init', { clickmap: false, trackLinks: true, accurateTrackBounce: true, webvisor: false })
  return true
}

/** Отправка события-цели; параметры не должны содержать персональных данных */
export function track(event: AnalyticsEvent, params: Record<string, string | number | boolean> = {}) {
  if (counterId === null || typeof window === 'undefined' || !window.ym) return false
  window.ym(counterId, 'reachGoal', event, params)
  return true
}

/** Для тестов */
export function _resetAnalytics() {
  counterId = null
  if (typeof window !== 'undefined') delete window.ym
}
