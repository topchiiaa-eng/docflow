import { useEffect } from 'react'
import { CheckIcon, AlertIcon, XIcon } from './Icons'

export interface ToastData {
  id: number
  kind: 'success' | 'error'
  text: string
}

/** Ненавязчивые уведомления о результате действия (подписано, добавлено, ошибка) */
export function Toasts({ items, onDismiss }: { items: ToastData[]; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (!items.length) return
    const t = setTimeout(() => onDismiss(items[0].id), 4000)
    return () => clearTimeout(t)
  }, [items, onDismiss])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            t.kind === 'success' ? 'bg-ink' : 'bg-red-600'
          }`}
        >
          <span
            className={`grid h-6 w-6 place-items-center rounded-full ${t.kind === 'success' ? 'bg-brand-500' : 'bg-white/20'}`}
          >
            {t.kind === 'success' ? <CheckIcon size={14} strokeWidth={2.5} /> : <AlertIcon size={14} />}
          </span>
          {t.text}
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Закрыть уведомление"
            className="ml-1 opacity-70 hover:opacity-100"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
