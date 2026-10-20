import type { DocFilter, DocStatus } from '../types'
import { GridIcon, ListIcon, SearchIcon } from './Icons'

export type ViewMode = 'cards' | 'table'

interface Props {
  filter: DocFilter
  orgs: { name: string; count: number }[]
  total: number
  /** На экране «На подпись» статус зафиксирован — селект не нужен */
  hideStatus?: boolean
  view: ViewMode
  onViewChange: (v: ViewMode) => void
  onChange: (f: DocFilter) => void
}

/** Фильтры ленты: чипсы организаций, поиск, статус, переключатель вида (US-10) */
export function FiltersBar({ filter, orgs, total, hideStatus, view, onViewChange, onChange }: Props) {
  const chip = (active: boolean) =>
    `chip h-8 border transition-colors ${
      active ? 'border-ink bg-ink text-paper' : 'border-rule-input bg-transparent text-ink hover:border-ink'
    }`

  return (
    <div className="reveal flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Организация">
        <button
          className={chip(filter.org === 'all')}
          onClick={() => onChange({ ...filter, org: 'all' })}
          aria-pressed={filter.org === 'all'}
        >
          Все организации <span className={filter.org === 'all' ? 'opacity-70' : 'text-meta'}>{total}</span>
        </button>
        {orgs.map((o) => (
          <button
            key={o.name}
            className={chip(filter.org === o.name)}
            onClick={() => onChange({ ...filter, org: o.name })}
            aria-pressed={filter.org === o.name}
          >
            {o.name} <span className={filter.org === o.name ? 'opacity-70' : 'text-meta'}>{o.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 sm:min-w-64">
          <span className="sr-only">Поиск</span>
          <SearchIcon
            size={16}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-meta"
          />
          <input
            type="search"
            aria-label="Поиск"
            placeholder="Контрагент или номер документа…"
            className="input pl-9!"
            value={filter.query}
            onChange={(e) => onChange({ ...filter, query: e.target.value })}
          />
        </label>

        {!hideStatus && (
          <>
            <label className="sr-only" htmlFor="f-status">
              Статус
            </label>
            <select
              id="f-status"
              className="input w-auto! shrink-0"
              value={filter.status}
              onChange={(e) => onChange({ ...filter, status: e.target.value as DocStatus | 'all' })}
            >
              <option value="all">Все статусы</option>
              <option value="requires_signature">Требуется подпись</option>
              <option value="signed">Подписан</option>
              <option value="info">Не требует подписи</option>
            </select>
          </>
        )}

        <div role="group" aria-label="Вид" className="ml-auto inline-flex shrink-0 border border-rule-input">
          {(
            [
              ['cards', GridIcon, 'Карточки'],
              ['table', ListIcon, 'Таблица'],
            ] as const
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => onViewChange(mode)}
              aria-pressed={view === mode}
              aria-label={label}
              title={label}
              className={`grid h-[38px] w-10 place-items-center transition-colors ${
                view === mode ? 'bg-ink text-paper' : 'text-meta hover:bg-paper-subtle hover:text-ink'
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
