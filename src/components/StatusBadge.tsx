import type { DocStatus } from '../types'

const STYLES: Record<DocStatus, { label: string; cls: string }> = {
  requires_signature: { label: 'Требуется подпись', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  signed: { label: 'Подписан', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  info: { label: 'Не требует подписи', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export function StatusBadge({ status }: { status: DocStatus }) {
  const s = STYLES[status]
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${s.cls}`}
    >
      {s.label}
    </span>
  )
}
