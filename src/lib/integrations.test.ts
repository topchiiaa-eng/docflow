import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { log } from './logger'
import { _resetAnalytics, initAnalytics, track } from './analytics'
import { parseOAuthError } from './auth'

describe('logger (структурированные логи, Шаг 7)', () => {
  beforeEach(() => log._reset())
  afterEach(() => vi.restoreAllMocks())

  it('пишет одну JSON-строку с ts/level/event и контекстом', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const rec = log.info('document.signed', { id: 'x' })
    expect(rec.level).toBe('info')
    expect(rec.event).toBe('document.signed')
    expect(rec.id).toBe('x')
    const line = spy.mock.calls[0][0] as string
    expect(() => JSON.parse(line)).not.toThrow()
    expect(JSON.parse(line).ts).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('warn/error уходят в sink, info — нет (централизованное хранение только проблем)', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const sink = vi.fn()
    log.addSink(sink)
    log.info('a')
    log.error('b', { message: 'boom' })
    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink.mock.calls[0][0]).toMatchObject({ level: 'error', event: 'b', message: 'boom' })
  })

  it('падающий sink не ломает логирование (негативный сценарий)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    log.addSink(() => {
      throw new Error('sink down')
    })
    expect(() => log.error('c')).not.toThrow()
  })
})

describe('analytics (Яндекс.Метрика, Шаг 4)', () => {
  beforeEach(() => _resetAnalytics())

  it('без счётчика — no-op, ничего не ломается', () => {
    expect(initAnalytics(undefined)).toBe(false)
    expect(track('document_open')).toBe(false)
  })

  it('со счётчиком — инициализирует ym и отправляет reachGoal', () => {
    expect(initAnalytics('12345678')).toBe(true)
    const calls: unknown[][] = []
    window.ym = (...args: unknown[]) => {
      calls.push(args)
    }
    expect(track('sign_success', { org: 'A' })).toBe(true)
    expect(calls[0]).toEqual([12345678, 'reachGoal', 'sign_success', { org: 'A' }])
  })

  it('нечисловой id счётчика отклоняется (негативный сценарий)', () => {
    expect(initAnalytics('not-a-number')).toBe(false)
  })
})

describe('parseOAuthError (Шаг 3, обработка ошибок OAuth)', () => {
  it('нет ошибки в hash → null', () => {
    expect(parseOAuthError('#access_token=abc&type=bearer')).toBeNull()
    expect(parseOAuthError('')).toBeNull()
  })

  it('отмена пользователем → понятный русский текст', () => {
    expect(parseOAuthError('#error=access_denied&error_description=User+denied')).toBe(
      'Вход через Google отменён',
    )
  })

  it('неизвестная ошибка → общий текст без деталей провайдера (негативный сценарий)', () => {
    expect(parseOAuthError('#error=server_error&error_code=unexpected_failure&error_description=x')).toBe(
      'Не удалось войти через внешнего провайдера',
    )
  })
})
