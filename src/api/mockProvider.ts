import type { DocumentItem, EdoProvider, JournalEntry, Member, MemberRole, Organization } from '../types'
import { FIXTURES, ORG_FIXTURES } from '../mocks/fixtures'
import { parseSum } from '../lib/validation'

/**
 * Мок-адаптер провайдера (ТЗ «ДокПоток» v1.3, F-7) — полная in-memory реализация
 * EdoProvider, чтобы приложение, тесты и CI работали без бэкенда.
 * Спецслучаи для демонстрации обработки ошибок:
 *  - ?fail=1 в адресе страницы — listIncoming падает (демо error-state);
 *  - документ doc-fail — sign всегда возвращает ошибку провайдера;
 *  - в «Компании В» пользователь — оператор: подписание и удаление отклоняются ролью.
 */
export function createMockProvider(latencyMs = 500): EdoProvider {
  const docs: DocumentItem[] = structuredClone(FIXTURES)
  const orgs: Organization[] = structuredClone(ORG_FIXTURES)
  const members = new Map<string, Member[]>(
    orgs.map((o) => [
      o.id,
      [
        { userId: 'me', email: 'demo@docflow.local', role: o.role },
        ...(o.isOwner
          ? [{ userId: 'u2', email: 'buh@docflow.local', role: 'accountant' as MemberRole }]
          : []),
      ],
    ]),
  )
  const journal: JournalEntry[] = []
  const files = new Map<string, string>()
  let journalId = 1

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const orgOf = (id: string) => orgs.find((o) => o.id === id)
  const record = (d: DocumentItem, success: boolean, detail: string | null) =>
    journal.unshift({
      id: journalId++,
      attemptedAt: new Date().toISOString(),
      success,
      detail,
      documentTitle: d.title,
      counterparty: d.counterparty,
      org: d.org,
    })

  return {
    async listIncoming() {
      await wait(latencyMs)
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fail')) {
        throw new Error('ЭДО-провайдер недоступен (демо-режим ?fail=1)')
      }
      return structuredClone(docs)
    },

    async sign(documentId) {
      await wait(latencyMs)
      const doc = docs.find((d) => d.id === documentId)
      if (!doc) throw new Error('Документ не найден')
      if (orgOf(doc.orgId)?.role !== 'signer') {
        record(doc, false, 'отказ: роль без права подписи')
        throw new Error('Подписание доступно только роли «Подписант»')
      }
      if (doc.id === 'doc-fail') {
        record(doc, false, 'отказ: сертификат недоступен')
        throw new Error('Провайдер отклонил подписание: сертификат ящика недоступен')
      }
      doc.status = 'signed'
      doc.unread = false
      record(doc, true, null)
    },

    async createDocument(input) {
      await wait(latencyMs)
      const org = orgOf(input.orgId)
      if (!org) throw new Error('Организация не найдена')
      const id = `doc-${Date.now()}`
      const filePath = input.file ? `${org.id}/${id}.pdf` : null
      if (input.file && filePath) files.set(filePath, URL.createObjectURL(input.file))
      const doc: DocumentItem = {
        id,
        orgId: org.id,
        org: org.name,
        counterparty: input.counterparty.trim(),
        title: input.title.trim(),
        kind: input.kind,
        sum: parseSum(input.sum).value,
        receivedAt: new Date().toISOString(),
        status: input.requiresSignature ? 'requires_signature' : 'info',
        unread: true,
        filePath,
      }
      docs.unshift(doc)
      return structuredClone(doc)
    },

    async deleteDocument(documentId) {
      await wait(latencyMs)
      const i = docs.findIndex((d) => d.id === documentId)
      if (i < 0) throw new Error('Документ не найден')
      if (!orgOf(docs[i].orgId)?.isOwner)
        throw new Error('Удалять документы может только владелец организации')
      if (docs[i].status === 'signed') throw new Error('Подписанный документ удалить нельзя')
      docs.splice(i, 1)
    },

    async getFileUrl(filePath) {
      const url = files.get(filePath)
      if (!url) throw new Error('Файл не найден')
      return url
    },

    async listOrganizations() {
      await wait(latencyMs / 2)
      return structuredClone(orgs)
    },

    async createOrganization(name) {
      await wait(latencyMs / 2)
      const org: Organization = { id: `org-${Date.now()}`, name: name.trim(), isOwner: true, role: 'signer' }
      orgs.push(org)
      members.set(org.id, [{ userId: 'me', email: 'demo@docflow.local', role: 'signer' }])
      return structuredClone(org)
    },

    async renameOrganization(id, name) {
      await wait(latencyMs / 2)
      const org = orgOf(id)
      if (!org?.isOwner) throw new Error('Переименовать может только владелец')
      org.name = name.trim()
      for (const d of docs) if (d.orgId === id) d.org = org.name
    },

    async deleteOrganization(id) {
      await wait(latencyMs / 2)
      const i = orgs.findIndex((o) => o.id === id)
      if (i < 0 || !orgs[i].isOwner) throw new Error('Удалить может только владелец')
      orgs.splice(i, 1)
      for (let j = docs.length - 1; j >= 0; j--) if (docs[j].orgId === id) docs.splice(j, 1)
    },

    async listMembers(orgId) {
      await wait(latencyMs / 2)
      return structuredClone(members.get(orgId) ?? [])
    },

    async addMember(orgId, email, role) {
      await wait(latencyMs / 2)
      if (!orgOf(orgId)?.isOwner) throw new Error('Добавлять участников может только владелец организации')
      if (!email.endsWith('@docflow.local')) {
        throw new Error('Пользователь с таким email не зарегистрирован в ДокПотоке (демо: *@docflow.local)')
      }
      const list = members.get(orgId) ?? []
      const existing = list.find((m) => m.email === email)
      const m: Member = existing ? { ...existing, role } : { userId: `u-${Date.now()}`, email, role }
      members.set(orgId, [...list.filter((x) => x.email !== email), m])
      return m
    },

    async removeMember(orgId, userId) {
      await wait(latencyMs / 2)
      if (userId === 'me') throw new Error('Нельзя удалить себя из организации')
      members.set(
        orgId,
        (members.get(orgId) ?? []).filter((m) => m.userId !== userId),
      )
    },

    async listJournal() {
      await wait(latencyMs / 2)
      return structuredClone(journal)
    },
  }
}
