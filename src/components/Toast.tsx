import { useEffect } from 'react'
import { XIcon } from './Icons'

export interface ToastData {
  id: number
  kind: 'success' | 'error'
  text: string
}

/** Уведомления о результате действия (DESIGN.md → Toasts): чёрная плашка, цветная левая линейка */
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
          className={`pointer-events-auto flex items-center gap-3 border-l-[3px] bg-ink py-3 pl-4 pr-3 text-sm font-semibold text-paper ${
            t.kind === 'success' ? 'border-success' : 'border-error'
          }`}
        >
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
