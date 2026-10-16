import type { DocumentItem } from '../types'
import { formatSum, kpi } from '../lib/documents'
import { InboxIcon, PenIcon, RubleIcon } from './Icons'

/** Сводка «на сейчас» — закрывает первый вопрос пользователя «что ждёт подписи?» без единого клика */
export function KpiTiles({ docs }: { docs: DocumentItem[] }) {
  const k = kpi(docs)
  const tiles = [
    {
      value: k.unreadToday,
      label: 'новых документов',
      Icon: InboxIcon,
      tone: 'bg-brand-50 text-brand-700',
      ring: '',
    },
    {
      value: k.requireSignature,
      label: 'требуют подписи',
      Icon: PenIcon,
      tone: 'bg-orange-50 text-orange-700',
      ring: k.requireSignature ? 'ring-1 ring-orange-200' : '',
    },
    {
      value: formatSum(k.weekSum),
      label: 'сумма входящих',
      Icon: RubleIcon,
      tone: 'bg-slate-100 text-slate-700',
      ring: '',
    },
  ]
  return (
    <section aria-label="Сводка" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((t) => (
        <div key={t.label} className={`card flex items-center gap-4 p-4 ${t.ring}`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${t.tone}`}>
            <t.Icon size={20} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-2xl font-extrabold tracking-tight">{t.value}</div>
            <div className="text-xs font-medium text-slate-500">{t.label}</div>
          </div>
        </div>
      ))}
    </section>
  )
}
