import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { createMockProvider } from '../api/mockProvider'

beforeEach(() => {
  window.location.hash = '#/'
})

describe('Навигация между экранами', () => {
  it('переходит на «Журнал» и «Организации» через меню', async () => {
    const user = userEvent.setup()
    render(<App provider={createMockProvider(0)} />)
    await screen.findByText(/ГетБлоггер/)

    await user.click(screen.getByRole('link', { name: 'Журнал' }))
    expect(await screen.findByRole('heading', { name: 'Журнал подписаний' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Организации' }))
    expect(await screen.findByRole('heading', { name: 'Организации' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Компания А' })).toBeInTheDocument()
  })

  it('«На подпись» показывает только документы, требующие подписи', async () => {
    const user = userEvent.setup()
    render(<App provider={createMockProvider(0)} />)
    await screen.findByText(/ГетБлоггер/)
    await user.click(screen.getByRole('link', { name: 'На подпись' }))
    await screen.findByRole('heading', { name: 'На подпись' })
    expect(screen.queryByText(/Аренда-Сервис/)).not.toBeInTheDocument() // подписан — не в очереди
    expect(screen.getByText(/ВебсайтСофт/)).toBeInTheDocument()
  })
})

describe('Организации (CRUD)', () => {
  it('создаёт организацию и показывает её владельцем-подписантом', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/organizations'
    render(<App provider={createMockProvider(0)} />)
    await screen.findByRole('heading', { name: 'Организации' })

    await user.type(screen.getByRole('textbox', { name: 'Название новой организации' }), 'ООО «Ромашка»')
    await user.click(screen.getByRole('button', { name: '+ Создать' }))
    const card = await screen.findByRole('region', { name: 'ООО «Ромашка»' })
    expect(within(card).getByText(/Подписант · владелец/)).toBeInTheDocument()
  })

  it('не создаёт организацию с коротким названием (валидация, негативный)', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/organizations'
    render(<App provider={createMockProvider(0)} />)
    await screen.findByRole('heading', { name: 'Организации' })
    await user.type(screen.getByRole('textbox', { name: 'Название новой организации' }), 'А')
    await user.click(screen.getByRole('button', { name: '+ Создать' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('не короче 2 символов')
  })

  it('добавляет участника по email и отклоняет незарегистрированного (негативный)', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/organizations'
    render(<App provider={createMockProvider(0)} />)
    const card = await screen.findByRole('region', { name: 'Компания А' })
    await user.click(within(card).getByRole('button', { name: 'Показать участников' }))
    await within(card).findByText('demo@docflow.local')

    await user.type(within(card).getByRole('textbox', { name: 'Email участника' }), 'new@docflow.local')
    await user.click(within(card).getByRole('button', { name: 'Добавить' }))
    expect(await within(card).findByText('new@docflow.local')).toBeInTheDocument()

    await user.type(within(card).getByRole('textbox', { name: 'Email участника' }), 'nobody@other.ru')
    await user.click(within(card).getByRole('button', { name: 'Добавить' }))
    expect(await within(card).findByRole('alert')).toHaveTextContent('не зарегистрирован')
  })
})

describe('Документы: добавление и журнал', () => {
  it('добавляет документ через форму; валидация блокирует пустые поля', async () => {
    const user = userEvent.setup()
    render(<App provider={createMockProvider(0)} />)
    await screen.findByText(/ГетБлоггер/)
    await user.click(screen.getByRole('button', { name: '+ Добавить документ' }))
    const dialog = screen.getByRole('dialog', { name: 'Новый документ' })

    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))
    expect(within(dialog).getAllByRole('alert').length).toBeGreaterThanOrEqual(2)

    await user.type(within(dialog).getByLabelText('Контрагент'), 'ООО «Ромашка»')
    await user.type(within(dialog).getByLabelText('Название / номер'), 'Акт № 7')
    await user.type(within(dialog).getByLabelText(/Сумма/), '1 500')
    await user.click(within(dialog).getByRole('button', { name: 'Добавить' }))

    expect(await screen.findByText(/Акт № 7 · ООО «Ромашка»/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('после подписания запись появляется в журнале', async () => {
    const user = userEvent.setup()
    render(<App provider={createMockProvider(0)} />)
    await user.click(await screen.findByText(/ГетБлоггер/))
    await user.click(screen.getByRole('button', { name: /Утвердить и подписать/ }))
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }))
    await screen.findAllByText('Подписан')

    await user.click(screen.getByRole('link', { name: 'Журнал' }))
    await screen.findByRole('heading', { name: 'Журнал подписаний' })
    const row = screen.getByText('УПД № 260810/54').closest('tr')!
    expect(within(row).getByText('Подписан')).toBeInTheDocument()
  })
})
