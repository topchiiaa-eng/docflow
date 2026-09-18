/**
 * Структурированное логирование (ДЗ-6, Шаг 7).
 * Каждая запись — одна JSON-строка: {ts, level, event, ...context}.
 * Уровни: debug (только dev) / info / warn / error.
 * Централизованное хранение: записи уровня warn/error дополнительно отправляются
 * в sink (по умолчанию — таблица client_logs в Supabase, см. src/api/index.ts).
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogRecord {
  ts: string
  level: LogLevel
  event: string
  [key: string]: unknown
}

export type LogSink = (record: LogRecord) => void | Promise<void>

const sinks: LogSink[] = []
const isDev = import.meta.env.DEV

function emit(level: LogLevel, event: string, context: Record<string, unknown> = {}): LogRecord {
  const record: LogRecord = { ts: new Date().toISOString(), level, event, ...context }
  if (level !== 'debug' || isDev) {
    const line = JSON.stringify(record)
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.info(line)
  }
  if (level === 'warn' || level === 'error') {
    for (const sink of sinks) {
      // sink не должен ронять приложение и не должен логировать сам себя
      try {
        void Promise.resolve(sink(record)).catch(() => undefined)
      } catch {
        /* игнорируем */
      }
    }
  }
  return record
}

export const log = {
  debug: (event: string, ctx?: Record<string, unknown>) => emit('debug', event, ctx),
  info: (event: string, ctx?: Record<string, unknown>) => emit('info', event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => emit('warn', event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => emit('error', event, ctx),
  /** Подключить внешнее хранилище логов (Supabase, Sentry и т.п.) */
  addSink: (sink: LogSink) => {
    sinks.push(sink)
  },
  /** Для тестов */
  _reset: () => {
    sinks.length = 0
  },
}
