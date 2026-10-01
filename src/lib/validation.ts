import type { NewDocumentInput } from '../types'

/** Клиентская валидация форм — зеркало check-constraints БД (миграция 4). Чистые функции. */

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export const LIMITS = {
  orgName: { min: 2, max: 80 },
  title: { min: 3, max: 120 },
  counterparty: { min: 2, max: 120 },
  fileBytes: 10 * 1024 * 1024,
} as const

export function validateOrgName(name: string): string | null {
  const n = name.trim()
  if (n.length < LIMITS.orgName.min) return `Название — не короче ${LIMITS.orgName.min} символов`
  if (n.length > LIMITS.orgName.max) return `Название — не длиннее ${LIMITS.orgName.max} символов`
  return null
}

export function validateEmail(email: string): string | null {
  const e = email.trim()
  if (!e) return 'Укажите email'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'Некорректный email'
  return null
}

/** Сумма: пусто → null; «89 800,50» → 89800.5; отрицательная/не число → ошибка */
export function parseSum(raw: string): { value: number | null; error: string | null } {
  const s = raw.replace(/\s/g, '').replace(',', '.')
  if (!s) return { value: null, error: null }
  const n = Number(s)
  if (!Number.isFinite(n)) return { value: null, error: 'Сумма должна быть числом' }
  if (n < 0) return { value: null, error: 'Сумма не может быть отрицательной' }
  if (n > 1e12) return { value: null, error: 'Слишком большая сумма' }
  return { value: Math.round(n * 100) / 100, error: null }
}

export function validateDocument(input: NewDocumentInput): FieldErrors<keyof NewDocumentInput> {
  const errors: FieldErrors<keyof NewDocumentInput> = {}
  if (!input.orgId) errors.orgId = 'Выберите организацию'
  const title = input.title.trim()
  if (title.length < LIMITS.title.min || title.length > LIMITS.title.max) {
    errors.title = `Название документа — от ${LIMITS.title.min} до ${LIMITS.title.max} символов`
  }
  const cp = input.counterparty.trim()
  if (cp.length < LIMITS.counterparty.min || cp.length > LIMITS.counterparty.max) {
    errors.counterparty = `Контрагент — от ${LIMITS.counterparty.min} до ${LIMITS.counterparty.max} символов`
  }
  const sum = parseSum(input.sum)
  if (sum.error) errors.sum = sum.error
  if (input.file) {
    if (input.file.type !== 'application/pdf') errors.file = 'Можно загрузить только PDF'
    else if (input.file.size > LIMITS.fileBytes) errors.file = 'Файл больше 10 МБ'
  }
  return errors
}
