export type DocStatus = 'requires_signature' | 'signed' | 'info'

export interface DocumentItem {
  id: string
  org: string
  counterparty: string
  /** Тип и номер, например «УПД № 260810/54» */
  title: string
  kind: 'УПД' | 'Акт' | 'Счёт' | 'Договор'
  /** Сумма без НДС, ₽; у части документов суммы нет */
  sum: number | null
  receivedAt: string // ISO
  status: DocStatus
  unread: boolean
}

export interface DocFilter {
  org: string | 'all'
  status: DocStatus | 'all'
  query: string
}

/** Интерфейс провайдера ЭДО (подмножество EdoProvider из ТЗ, F-7) */
export interface EdoProvider {
  listIncoming(): Promise<DocumentItem[]>
  sign(documentId: string): Promise<void>
}
