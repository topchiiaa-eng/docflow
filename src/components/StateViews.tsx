import { AlertIcon } from './Icons'

/** Скелетон экрана вместо спиннера: показывает структуру, которая вот-вот появится */
export function LoadingView() {
  return (
    <div role="status" aria-label="Загрузка" className="flex flex-col gap-5">
      <span className="sr-only">Загружаем документы…</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-7 w-16" />
            <div className="skeleton mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-9 w-32" />
        <div className="skeleton h-9 w-28" />
        <div className="skeleton h-9 flex-1" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card flex items-center gap-4 p-4">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton mt-2 h-3 w-1/3" />
              </div>
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="card hidden h-72 lg:block" />
      </div>
    </div>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="card mx-auto flex max-w-lg flex-col items-center p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertIcon size={24} />
      </span>
      <p className="mt-4 text-base font-bold">Не удалось загрузить документы</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      <button onClick={onRetry} className="btn-primary mt-5">
        Повторить
      </button>
    </div>
  )
}

/** Пустое состояние с действием — вместо пустого экрана (правило 6 CLAUDE.md) */
export function EmptyView({
  title,
  text,
  action,
  onAction,
}: {
  title: string
  text?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <svg width="88" height="64" viewBox="0 0 88 64" fill="none" aria-hidden="true">
        <rect x="10" y="14" width="68" height="44" rx="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="2" />
        <path d="M10 30h20l5 7h18l5-7h20" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="26" y="4" width="36" height="22" rx="4" fill="#fff" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M32 11h24M32 17h16" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="mt-4 text-base font-bold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && onAction && (
        <button onClick={onAction} className="btn-secondary mt-5">
          {action}
        </button>
      )}
    </div>
  )
}
