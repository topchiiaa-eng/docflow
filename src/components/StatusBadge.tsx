import type { DocStatus } from '../types'

/** Status chips по DESIGN.md: uppercase 11px, без скругления, цвет + текст */
const STYLES: Record<DocStatus, { label: string; cls: string }> = {
  requires_signature: { label: 'Требуется подпись', cls: 'bg-warning-container text-on-warning' },
  signed: { label: 'Подписан', cls: 'bg-success-container text-on-success' },
  info: { label: 'Не требует подписи', cls: 'bg-paper-subtle text-meta' },
}

export function StatusBadge({ status }: { status: DocStatus }) {
  const s = STYLES[status]
  return <span className={`chip ${s.cls}`}>{s.label}</span>
}
