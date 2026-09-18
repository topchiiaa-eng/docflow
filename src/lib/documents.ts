import type { DocFilter, DocumentItem } from '../types'

/** Чистая логика ленты: без React и побочных эффектов (правило 3 CLAUDE.md) */

export function filterDocuments(docs: DocumentItem[], f: DocFilter): DocumentItem[] {
  const q = f.query.trim().toLowerCase()
  return docs.filter(
    (d) =>
      (f.org === 'all' || d.org === f.org) &&
      (f.status === 'all' || d.status === f.status) &&
      (!q || d.counterparty.toLowerCase().includes(q) || d.title.toLowerCase().includes(q)),
  )
}

/** 89800 → «89 800 ₽»; null → «—» */
export function formatSum(sum: number | null): string {
  if (sum === null) return '—'
  return sum.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'
}

export function kpi(docs: DocumentItem[]) {
  return {
    unreadToday: docs.filter((d) => d.unread).length,
    requireSignature: docs.filter((d) => d.status === 'requires_signature').length,
    weekSum: docs.reduce((acc, d) => acc + (d.sum ?? 0), 0),
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  )
}
