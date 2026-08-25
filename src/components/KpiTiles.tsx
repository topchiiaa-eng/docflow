import type { DocumentItem } from '../types'
import { formatSum, kpi } from '../lib/documents'

export function KpiTiles({ docs }: { docs: DocumentItem[] }) {
  const k = kpi(docs)
  const tile = 'rounded-2xl border bg-white p-4 shadow-sm'
  return (
    <section aria-label="Сводка" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className={tile}>
        <div className="text-2xl font-extrabold">{k.unreadToday}</div>
        <div className="text-sm text-slate-500">новых документов</div>
      </div>
      <div className={`${tile} border-orange-200`}>
        <div className="text-2xl font-extrabold text-orange-600">{k.requireSignature}</div>
        <div className="text-sm text-slate-500">требуют подписи</div>
      </div>
      <div className={tile}>
        <div className="text-2xl font-extrabold">{formatSum(k.weekSum)}</div>
        <div className="text-sm text-slate-500">сумма входящих</div>
      </div>
    </section>
  )
}
