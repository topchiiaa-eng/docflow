import type { DocumentItem } from '../types'
import { formatDate, formatSum } from '../lib/documents'
import { StatusBadge } from './StatusBadge'

interface Props {
  docs: DocumentItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onResetFilters: () => void
}

export function DocumentList({ docs, selectedId, onSelect, onResetFilters }: Props) {
  if (docs.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <p className="text-slate-600">Ничего не найдено</p>
        <button
          onClick={onResetFilters}
          className="mt-3 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Сбросить фильтры
        </button>
      </div>
    )
  }

  return (
    <ul aria-label="Список документов" className="flex flex-col gap-2">
      {docs.map((d) => (
        <li key={d.id}>
          <button
            onClick={() => onSelect(d.id)}
            aria-current={selectedId === d.id}
            className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-emerald-400 ${
              selectedId === d.id ? 'border-emerald-600 ring-1 ring-emerald-600' : ''
            } ${d.unread ? 'border-l-4 border-l-emerald-600' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {d.title} · {d.counterparty}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {d.org} · {formatDate(d.receivedAt)}
                </div>
                <div className="mt-2">
                  <StatusBadge status={d.status} />
                </div>
              </div>
              <div className="shrink-0 text-sm font-bold whitespace-nowrap">{formatSum(d.sum)}</div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
