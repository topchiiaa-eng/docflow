export type DocStatus = 'requires_signature' | 'signed' | 'info'
export type DocKind = 'УПД' | 'Акт' | 'Счёт' | 'Договор'
export type MemberRole = 'operator' | 'signer' | 'accountant'

export const DOC_KINDS: DocKind[] = ['УПД', 'Акт', 'Счёт', 'Договор']
export const ROLE_LABELS: Record<MemberRole, string> = {
  signer: 'Подписант',
  operator: 'Оператор',
  accountant: 'Бухгалтер',
}

export interface DocumentItem {
  id: string
  orgId: string
  org: string
  counterparty: string
  /** Тип и номер, например «УПД № 260810/54» */
  title: string
  kind: DocKind
  /** Сумма без НДС, ₽; у части документов суммы нет */
  sum: number | null
  receivedAt: string // ISO
  status: DocStatus
  unread: boolean
  /** Путь PDF в хранилище (<org_id>/<doc_id>.pdf) или null */
  filePath: string | null
}

export interface DocFilter {
  org: string | 'all'
  status: DocStatus | 'all'
  query: string
}

export interface Organization {
  id: string
  name: string
  /** Текущий пользователь — создатель (может редактировать, удалять, управлять участниками) */
  isOwner: boolean
  /** Роль текущего пользователя в организации */
  role: MemberRole
}

export interface Member {
  userId: string
  email: string
  role: MemberRole
}

export interface JournalEntry {
  id: number
  attemptedAt: string
  success: boolean
  detail: string | null
  documentTitle: string
  counterparty: string
  org: string
}

/** Данные формы «Добавить документ» (до валидации) */
export interface NewDocumentInput {
  orgId: string
  counterparty: string
  title: string
  kind: DocKind
  sum: string
  requiresSignature: boolean
  file: File | null
}

/** Интерфейс провайдера данных (EdoProvider из ТЗ, расширен CRUD проектной работы) */
export interface EdoProvider {
  // документы
  listIncoming(): Promise<DocumentItem[]>
  sign(documentId: string): Promise<void>
  markRead?(documentId: string): Promise<void>
  createDocument(input: NewDocumentInput): Promise<DocumentItem>
  deleteDocument(documentId: string): Promise<void>
  /** Временная ссылка на PDF (null — файла нет) */
  getFileUrl(filePath: string): Promise<string>
  // организации и участники
  listOrganizations(): Promise<Organization[]>
  createOrganization(name: string): Promise<Organization>
  renameOrganization(id: string, name: string): Promise<void>
  deleteOrganization(id: string): Promise<void>
  listMembers(orgId: string): Promise<Member[]>
  addMember(orgId: string, email: string, role: MemberRole): Promise<Member>
  removeMember(orgId: string, userId: string): Promise<void>
  // журнал
  listJournal(): Promise<JournalEntry[]>
}
