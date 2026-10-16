import type { DocKind, DocumentItem } from '../types'
import { formatDate, formatSum } from '../lib/documents'
import { StatusBadge } from './StatusBadge'
import { EmptyView } from './StateViews'
import type { ViewMode } from './FiltersBar'

interface Props {
  docs: DocumentItem[]
  selectedId: string | null
  view?: ViewMode
  onSelect: (id: string) => void
  onResetFilters: () => void
  emptyText?: string
}

/** Цветовое кодирование типа документа — быстрее считывается, чем текст */
const KIND_STYLE: Record<DocKind, string> = {
  УПД: 'bg-brand-50 text-brand-700',
  Акт: 'bg-indigo-50 text-indigo-700',
  Счёт: 'bg-amber-50 text-amber-700',
  Договор: 'bg-slate-100 text-slate-700',
}

function KindChip({ kind }: { kind: DocKind }) {
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold ${KIND_STYLE[kind]}`}
      aria-hidden="true"
    >
      {kind}
    </span>
  )
}

export function DocumentList({
  docs,
  selectedId,
  view = 'cards',
  onSelect,
  onResetFilters,
  emptyText,
}: Props) {
  if (docs.length === 0) {
    return (
      <EmptyView
        title={emptyText ?? 'Ничего не найдено'}
        text={emptyText ? undefined : 'Попробуйте изменить фильтры или поисковый запрос.'}
        action={emptyText ? undefined : 'Сбросить фильтры'}
        onAction={onResetFilters}
      />
    )
  }

  if (view === 'table') {
    return (
      <div className="card overflow-x-auto">
        <table aria-label="Список документов" className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Дата</th>
              <th className="px-4 py-2.5 font-semibold">Организация</th>
              <th className="px-4 py-2.5 font-semibold">Контрагент</th>
              <th className="px-4 py-2.5 font-semibold">Документ</th>
              <th className="px-4 py-2.5 text-right font-semibold">Сумма</th>
              <th className="px-4 py-2.5 font-semibold">Статус</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr
                key={d.id}
                onClick={() => onSelect(d.id)}
                className={`cursor-pointer border-t border-slate-100 transition hover:bg-brand-50/40 ${
                  selectedId === d.id ? 'bg-brand-50' : ''
                } ${d.unread ? 'font-semibold' : ''}`}
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{formatDate(d.receivedAt)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{d.org}</td>
                <td className="px-4 py-2.5">{d.counterparty}</td>
                <td className="whitespace-nowrap px-4 py-2.5">{d.title}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatSum(d.sum)}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <ul aria-label="Список документов" className="flex flex-col gap-2">
      {docs.map((d) => {
        const selected = selectedId === d.id
        return (
          <li key={d.id}>
            <button
              onClick={() => onSelect(d.id)}
              aria-current={selected}
              className={`card flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-px hover:shadow-md ${
                selected ? 'border-brand-500 ring-2 ring-brand-100' : ''
              }`}
            >
              <KindChip kind={d.kind} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {d.unread && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Непрочитан" />
                  )}
                  <span
                    className={`line-clamp-2 text-sm leading-snug ${d.unread ? 'font-bold' : 'font-semibold'}`}
                  >
                    {d.title} · {d.counterparty}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                  <span>{d.org}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDate(d.receivedAt)}</span>
                  <span className="sm:hidden">
                    <StatusBadge status={d.status} />
                  </span>
                </div>
              </div>
              <div className="hidden shrink-0 sm:block">
                <StatusBadge status={d.status} />
              </div>
              <div className="w-24 shrink-0 text-right text-sm font-bold tabular-nums">
                {formatSum(d.sum)}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
