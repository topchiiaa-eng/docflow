import type { DocFilter, DocStatus } from '../types'

interface Props {
  filter: DocFilter
  orgs: string[]
  onChange: (f: DocFilter) => void
}

const input =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none'

export function FiltersBar({ filter, orgs, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="f-org">Организация</label>
      <select
        id="f-org"
        className={input}
        value={filter.org}
        onChange={(e) => onChange({ ...filter, org: e.target.value })}
      >
        <option value="all">Все организации</option>
        {orgs.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="f-status">Статус</label>
      <select
        id="f-status"
        className={input}
        value={filter.status}
        onChange={(e) => onChange({ ...filter, status: e.target.value as DocStatus | 'all' })}
      >
        <option value="all">Все статусы</option>
        <option value="requires_signature">Требуется подпись</option>
        <option value="signed">Подписан</option>
        <option value="info">Не требует подписи</option>
      </select>

      <input
        type="search"
        aria-label="Поиск"
        placeholder="Поиск: контрагент или номер…"
        className={`${input} min-w-0 flex-1 sm:min-w-56`}
        value={filter.query}
        onChange={(e) => onChange({ ...filter, query: e.target.value })}
      />
    </div>
  )
}
