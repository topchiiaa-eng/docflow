import { describe, expect, it } from 'vitest'
import { parseSum, validateDocument, validateEmail, validateOrgName } from './validation'
import type { NewDocumentInput } from '../types'

const valid: NewDocumentInput = {
  orgId: 'org-1',
  counterparty: 'ООО «Ромашка»',
  title: 'УПД № 1',
  kind: 'УПД',
  sum: '89 800,50',
  requiresSignature: true,
  file: null,
}

describe('validateOrgName', () => {
  it('принимает нормальное название и обрезает пробелы', () => {
    expect(validateOrgName('  ООО «Ромашка» ')).toBeNull()
  })
  it('отклоняет слишком короткое и слишком длинное (негативные)', () => {
    expect(validateOrgName('А')).toMatch(/не короче/)
    expect(validateOrgName('x'.repeat(81))).toMatch(/не длиннее/)
  })
})

describe('validateEmail', () => {
  it('принимает корректный адрес', () => expect(validateEmail('user@example.com')).toBeNull())
  it('отклоняет пустой и некорректный (негативные)', () => {
    expect(validateEmail('')).toBe('Укажите email')
    expect(validateEmail('не email')).toBe('Некорректный email')
  })
})

describe('parseSum', () => {
  it('понимает пробелы-разделители и запятую, округляет до копеек', () => {
    expect(parseSum('89 800,505')).toEqual({ value: 89800.51, error: null })
  })
  it('пустая строка — сумма отсутствует (не ошибка)', () => {
    expect(parseSum('')).toEqual({ value: null, error: null })
  })
  it('отрицательные и нечисловые — ошибка (негативные)', () => {
    expect(parseSum('-5').error).toMatch(/отрицательной/)
    expect(parseSum('abc').error).toMatch(/числом/)
  })
})

describe('validateDocument', () => {
  it('валидная форма — без ошибок', () => {
    expect(validateDocument(valid)).toEqual({})
  })
  it('собирает ошибки по всем полям сразу (негативный)', () => {
    const errors = validateDocument({ ...valid, orgId: '', title: 'x', counterparty: '', sum: '-1' })
    expect(Object.keys(errors).sort()).toEqual(['counterparty', 'orgId', 'sum', 'title'])
  })
  it('файл: только PDF и не больше 10 МБ (негативный)', () => {
    const png = new File(['x'], 'a.png', { type: 'image/png' })
    expect(validateDocument({ ...valid, file: png }).file).toBe('Можно загрузить только PDF')
    const big = new File([new Uint8Array(1)], 'b.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    expect(validateDocument({ ...valid, file: big }).file).toBe('Файл больше 10 МБ')
  })
})
