import { describe, expect, it } from 'vitest'
import { FIXTURES } from '../mocks/fixtures'
import { filterDocuments, formatSum, kpi } from './documents'

describe('filterDocuments', () => {
  it('фильтрует по организации и статусу одновременно', () => {
    const res = filterDocuments(FIXTURES, { org: 'Компания А', status: 'requires_signature', query: '' })
    expect(res).toHaveLength(1)
    expect(res[0].counterparty).toBe('ООО «ГетБлоггер»')
  })

  it('ищет по подстроке без учёта регистра — по контрагенту и номеру', () => {
    expect(filterDocuments(FIXTURES, { org: 'all', status: 'all', query: 'гетблог' })).toHaveLength(1)
    expect(filterDocuments(FIXTURES, { org: 'all', status: 'all', query: '31958300' })).toHaveLength(1)
  })

  it('возвращает пустой список, если ничего не подходит (негативный сценарий)', () => {
    expect(filterDocuments(FIXTURES, { org: 'Компания А', status: 'all', query: 'несуществующее' })).toEqual([])
  })
})

describe('formatSum', () => {
  it('форматирует сумму с разделителем тысяч и знаком ₽', () => {
    expect(formatSum(89800)).toMatch(/89.800.₽/)
  })

  it('для отсутствующей суммы возвращает прочерк', () => {
    expect(formatSum(null)).toBe('—')
  })
})

describe('kpi', () => {
  it('считает непрочитанные и требующие подписи', () => {
    const k = kpi(FIXTURES)
    expect(k.unreadToday).toBe(3)
    expect(k.requireSignature).toBe(3)
  })
})
