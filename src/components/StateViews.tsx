/** Скелетон экрана вместо спиннера: показывает структуру, которая вот-вот появится */
export function LoadingView() {
  return (
    <div role="status" aria-label="Загрузка" className="flex flex-col gap-6">
      <span className="sr-only">Загружаем документы…</span>
      <div className="border-b-2 border-ink pb-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton mt-2 h-4 w-72" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-rule border-b border-rule">
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-6 py-4 first:pl-0">
            <div className="skeleton h-10 w-16" />
            <div className="skeleton mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-8 w-36" />
        <div className="skeleton h-8 w-28" />
        <div className="skeleton h-8 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="border-t border-rule">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-rule py-4 pl-3">
              <div className="skeleton h-3 w-10" />
              <div className="flex-1">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton mt-2 h-3 w-1/3" />
              </div>
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="hidden border-t-2 border-ink lg:block">
          <div className="skeleton mt-4 h-3 w-24" />
          <div className="skeleton mt-3 h-6 w-3/4" />
          <div className="skeleton mt-6 h-24 w-full" />
        </div>
      </div>
    </div>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="card-elevated mx-auto w-full max-w-lg p-8">
      <p className="label text-urgent">Ошибка загрузки</p>
      <p className="h2 mt-2">Не удалось загрузить документы</p>
      <p className="mt-2 text-meta">{message}</p>
      <button onClick={onRetry} className="btn-primary mt-6">
        Повторить
      </button>
    </div>
  )
}

/** Пустое состояние с действием — вместо пустого экрана (правило 6 CLAUDE.md). Без иллюстраций (DESIGN.md, Don't #11) */
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
    <div className="border-y border-rule px-6 py-14 text-center">
      <p className="label">Пусто</p>
      <p className="h2 mt-2">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-sm text-meta">{text}</p>}
      {action && onAction && (
        <button onClick={onAction} className="btn-secondary mt-6">
          {action}
        </button>
      )}
    </div>
  )
}
