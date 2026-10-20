import type { CSSProperties } from 'react'
import type { DocumentItem } from '../types'
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

const revealStyle = (i: number) => ({ '--reveal-i': Math.min(i, 8) }) as CSSProperties

/**
 * Лента документов как ведомость (DESIGN.md → Lists): строки с линейками,
 * категория — метка uppercase, непрочитанное — чёрный квадрат, выбранное — левая линейка 3px.
 */
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
      <div className="reveal overflow-x-auto">
        <table aria-label="Список документов" className="w-full text-[0.8125rem]">
          <thead className="caps border-b-2 border-ink text-left">
            <tr>
              <th className="py-2 pr-3 font-semibold">Дата</th>
              <th className="hidden px-3 py-2 font-semibold xl:table-cell">Организация</th>
              <th className="px-3 py-2 font-semibold">Контрагент</th>
              <th className="px-3 py-2 font-semibold">Документ</th>
              <th className="px-3 py-2 text-right font-semibold">Сумма</th>
              <th className="py-2 pl-3 font-semibold">Статус</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr
                key={d.id}
                onClick={() => onSelect(d.id)}
                className={`cursor-pointer border-b border-rule align-top transition-colors hover:bg-paper-muted ${
                  selectedId === d.id ? 'bg-paper-muted' : ''
                } ${d.unread ? 'font-bold' : ''}`}
              >
                <td className="num whitespace-nowrap py-2.5 pr-3 text-[0.8125rem] text-meta">
                  {formatDate(d.receivedAt)}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2.5 text-meta xl:table-cell">{d.org}</td>
                <td className="px-3 py-2.5">{d.counterparty}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{d.title}</td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-right text-[0.8125rem]">
                  {formatSum(d.sum)}
                </td>
                <td className="py-2 pl-3">
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
    <ul aria-label="Список документов" className="border-t border-rule">
      {docs.map((d, i) => {
        const selected = selectedId === d.id
        return (
          <li key={d.id} className="reveal" style={revealStyle(i)}>
            <button
              onClick={() => onSelect(d.id)}
              aria-current={selected}
              className={`flex w-full items-start gap-4 border-b border-rule border-l-[3px] py-3.5 pl-3 pr-2 text-left transition-colors hover:bg-paper-muted ${
                selected ? 'border-l-ink bg-paper-muted' : 'border-l-transparent'
              }`}
            >
              <span className="caps w-12 shrink-0 pt-1 sm:w-16" aria-hidden="true">
                {d.kind}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-2">
                  {d.unread && (
                    <span
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-ink"
                      aria-label="Непрочитан"
                      role="img"
                    />
                  )}
                  <span
                    className={`line-clamp-2 font-serif text-base leading-snug sm:text-[1.0625rem] ${d.unread ? 'font-bold' : 'font-normal'}`}
                  >
                    {d.title} · {d.counterparty}
                  </span>
                </span>
                <span className="small mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta">
                  <span>{d.org}</span>
                  <span aria-hidden="true">·</span>
                  <span className="num text-[0.8125rem]">{formatDate(d.receivedAt)}</span>
                  <StatusBadge status={d.status} />
                  <span className="num text-[0.8125rem] font-medium text-ink sm:hidden">
                    {formatSum(d.sum)}
                  </span>
                </span>
              </span>
              <span className="num hidden w-28 shrink-0 pt-0.5 text-right font-medium sm:block">
                {formatSum(d.sum)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
