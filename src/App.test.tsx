import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { FIXTURES } from './mocks/fixtures'
import type { DocumentItem, EdoProvider } from './types'

/** Тестовый провайдер: без задержек, с управляемыми отказами */
function testProvider(opts: { failList?: boolean; failSignIds?: string[] } = {}): EdoProvider {
  const docs: DocumentItem[] = structuredClone(FIXTURES)
  return {
    async listIncoming() {
      if (opts.failList) throw new Error('провайдер недоступен')
      return structuredClone(docs)
    },
    async sign(id: string) {
      if (opts.failSignIds?.includes(id)) throw new Error('сертификат ящика недоступен')
      const d = docs.find((x) => x.id === id)
      if (d) d.status = 'signed'
    },
  }
}

describe('Лента документов (US-2)', () => {
  it('после загрузки показывает документы всех организаций', async () => {
    render(<App provider={testProvider()} />)
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()

    expect(await screen.findByText(/ГетБлоггер/)).toBeInTheDocument()
    expect(screen.getByText(/ВебсайтСофт/)).toBeInTheDocument()
    expect(screen.getByText(/СКБ Контур/)).toBeInTheDocument()
    // KPI: 3 требуют подписи
    expect(screen.getByText('требуют подписи').previousElementSibling).toHaveTextContent('3')
  })

  it('при отказе провайдера показывает ошибку с кнопкой «Повторить» (негативный сценарий)', async () => {
    render(<App provider={testProvider({ failList: true })} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить документы')
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('поиск сужает список, а сброс фильтров возвращает всё', async () => {
    const user = userEvent.setup()
    render(<App provider={testProvider()} />)
    await screen.findByText(/ГетБлоггер/)

    await user.type(screen.getByRole('searchbox', { name: 'Поиск' }), 'клауд')
    expect(screen.getByText(/Клауд Хостинг/)).toBeInTheDocument()
    expect(screen.queryByText(/ГетБлоггер/)).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Поиск' }))
    await user.type(screen.getByRole('searchbox', { name: 'Поиск' }), 'такого-нет')
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    expect(screen.getByText(/ГетБлоггер/)).toBeInTheDocument()
  })
})

describe('Подписание с подтверждением (US-4)', () => {
  it('подписывает только после подтверждения в диалоге', async () => {
    const user = userEvent.setup()
    render(<App provider={testProvider()} />)
    await user.click(await screen.findByText(/ГетБлоггер/))

    await user.click(screen.getByRole('button', { name: /Утвердить и подписать/ }))
    const dialog = screen.getByRole('dialog', { name: 'Подтверждение подписания' })
    expect(dialog).toHaveTextContent('ГетБлоггер')

    await user.click(screen.getByRole('button', { name: 'Подтвердить' }))
    await waitFor(() => {
      expect(screen.getAllByText('Подписан').length).toBeGreaterThanOrEqual(3)
    })
  })

  it('«Отмена» в диалоге не меняет статус документа (негативный сценарий)', async () => {
    const user = userEvent.setup()
    render(<App provider={testProvider()} />)
    await user.click(await screen.findByText(/ГетБлоггер/))
    await user.click(screen.getByRole('button', { name: /Утвердить и подписать/ }))
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // кнопка подписания всё ещё на месте — статус не изменился
    expect(screen.getByRole('button', { name: /Утвердить и подписать/ })).toBeInTheDocument()
  })

  it('ошибка провайдера при подписании показывается, статус не меняется (негативный сценарий)', async () => {
    const user = userEvent.setup()
    render(<App provider={testProvider({ failSignIds: ['doc-1'] })} />)
    await user.click(await screen.findByText(/ГетБлоггер/))
    await user.click(screen.getByRole('button', { name: /Утвердить и подписать/ }))
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('сертификат ящика недоступен')
    expect(screen.getByRole('button', { name: /Утвердить и подписать/ })).toBeInTheDocument()
  })
})
