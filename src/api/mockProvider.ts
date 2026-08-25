import type { DocumentItem, EdoProvider } from '../types'
import { FIXTURES } from '../mocks/fixtures'

/**
 * Мок-адаптер провайдера ЭДО (ТЗ «ДокПоток» v1.3, F-7).
 * Имитирует сетевую задержку; спецслучаи для демонстрации обработки ошибок:
 *  - ?fail=1 в адресе страницы — listIncoming падает (демо error-state);
 *  - документ doc-fail — sign всегда возвращает ошибку провайдера.
 */
export function createMockProvider(latencyMs = 500): EdoProvider {
  // копия фикстур: подписание мутирует состояние в рамках сессии
  const docs: DocumentItem[] = structuredClone(FIXTURES)

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

  return {
    async listIncoming() {
      await wait(latencyMs)
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fail')) {
        throw new Error('ЭДО-провайдер недоступен (демо-режим ?fail=1)')
      }
      return structuredClone(docs)
    },

    async sign(documentId: string) {
      await wait(latencyMs)
      const doc = docs.find((d) => d.id === documentId)
      if (!doc) throw new Error('Документ не найден')
      if (doc.id === 'doc-fail') {
        throw new Error('Провайдер отклонил подписание: сертификат ящика недоступен')
      }
      doc.status = 'signed'
    },
  }
}
