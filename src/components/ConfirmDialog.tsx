interface Props {
  title: string
  text: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Универсальное подтверждение необратимых действий (удаление организации/документа/участника) */
export function ConfirmDialog({
  title,
  text,
  confirmLabel = 'Подтвердить',
  danger,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onCancel}
    >
      <div className="card w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{text}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} disabled={busy} className="btn-secondary flex-1">
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {busy ? 'Секунду…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
