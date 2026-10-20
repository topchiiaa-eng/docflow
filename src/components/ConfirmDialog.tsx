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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className={`w-full max-w-sm border-t-2 bg-paper p-6 ${danger ? 'border-error' : 'border-ink'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`label ${danger ? 'text-urgent' : ''}`}>{danger ? 'Необратимо' : 'Подтверждение'}</p>
        <h3 className="h3 mt-1">{title}</h3>
        <p className="mt-2 text-sm text-meta">{text}</p>
        <div className="mt-6 flex gap-2">
          <button onClick={onCancel} disabled={busy} className="btn-secondary flex-1">
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {busy ? 'Секунду…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
