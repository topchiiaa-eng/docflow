export function LoadingView() {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="flex flex-col items-center gap-3 rounded-2xl border bg-white p-16"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      <p className="text-sm text-slate-500">Загружаем документы…</p>
    </div>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
      <p className="font-semibold text-red-700">Не удалось загрузить документы</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
      >
        Повторить
      </button>
    </div>
  )
}
