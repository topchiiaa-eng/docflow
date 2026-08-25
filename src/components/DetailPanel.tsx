import type { DocumentItem } from '../types'
import { formatDate, formatSum } from '../lib/documents'
import { StatusBadge } from './StatusBadge'

interface Props {
  doc: DocumentItem | null
  signing: boolean
  signError: string | null
  onRequestSign: () => void
  onClose: () => void
}

export function DetailPanel({ doc, signing, signError, onRequestSign, onClose }: Props) {
  if (!doc) {
    return (
      <div className="hidden h-full items-center justify-center rounded-2xl border bg-white p-8 text-sm text-slate-400 lg:flex">
        Выберите документ из списка
      </div>
    )
  }

  const row = 'flex justify-between gap-4 border-b border-slate-100 py-2 text-sm'

  return (
    <section aria-label="Карточка документа" className="flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-base font-bold">{doc.title}</h2>
        <button
          onClick={onClose}
          aria-label="Закрыть карточку"
          className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          ✕
        </button>
      </div>

      {/* PDF-превью: в демо-режиме мок-провайдер файлов не отдаёт (ТЗ, F-7) */}
      <div className="mb-4 flex h-40 flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs text-slate-500">
        <span className="text-2xl">📄</span>
        Превью PDF (демо-режим)
      </div>

      <div className={row}><span className="text-slate-500">Контрагент</span><b className="text-right">{doc.counterparty}</b></div>
      <div className={row}><span className="text-slate-500">Получатель</span><b>{doc.org}</b></div>
      <div className={row}><span className="text-slate-500">Сумма (без НДС)</span><b>{formatSum(doc.sum)}</b></div>
      <div className={row}><span className="text-slate-500">Получен</span><b>{formatDate(doc.receivedAt)}</b></div>
      <div className={row}><span className="text-slate-500">Статус</span><StatusBadge status={doc.status} /></div>

      {doc.status === 'requires_signature' && (
        <div className="mt-auto pt-4">
          <button
            onClick={onRequestSign}
            disabled={signing}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {signing ? 'Подписываем…' : '✅ Утвердить и подписать'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Откроется подтверждение: документ, подписант, сертификат
          </p>
        </div>
      )}

      {signError && (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {signError}
        </div>
      )}
    </section>
  )
}
