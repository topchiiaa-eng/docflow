import type { DocumentItem } from '../types'
import { formatSum, kpi } from '../lib/documents'

/**
 * Сводка «на сейчас» — три цифры-факта в ряд, разделённые вертикальными линейками
 * (как таблица курсов в газете). Красный — только у счётчика, требующего действия.
 */
export function KpiTiles({ docs }: { docs: DocumentItem[] }) {
  const k = kpi(docs)
  const figures = [
    { value: k.unreadToday, label: 'новых документов', urgent: false },
    { value: k.requireSignature, label: 'требуют подписи', urgent: k.requireSignature > 0 },
    { value: formatSum(k.weekSum), label: 'сумма входящих', urgent: false },
  ]
  return (
    <section
      aria-label="Сводка"
      className="reveal grid grid-cols-2 border-b border-rule sm:grid-cols-3 sm:divide-x sm:divide-rule"
    >
      {figures.map((f, i) => (
        <div
          key={f.label}
          className={`min-w-0 py-4 sm:px-6 sm:first:pl-0 ${
            i === 0
              ? 'border-r border-rule pr-3'
              : i === 1
                ? 'pl-3'
                : 'col-span-2 border-t border-rule sm:col-span-1 sm:border-t-0'
          }`}
        >
          <div className={`figure truncate text-[2rem] sm:text-[2.5rem] ${f.urgent ? 'text-urgent' : ''}`}>
            {f.value}
          </div>
          <div className="caps mt-2">{f.label}</div>
        </div>
      ))}
    </section>
  )
}
