import type { DocumentItem } from '../types'
import { formatSum } from '../lib/documents'

interface Props {
  doc: DocumentItem
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Диалог явного подтверждения подписания (ТЗ F-5, правило 8 CLAUDE.md):
 * единственный путь к вызову provider.sign().
 */
export function SignDialog({ doc, onConfirm, onCancel }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Подтверждение подписания"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold">Подписать документ?</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Документ</dt>
            <dd className="font-semibold text-right">{doc.title}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Контрагент</dt>
            <dd className="font-semibold text-right">{doc.counterparty}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Сумма (без НДС)</dt>
            <dd className="font-semibold">{formatSum(doc.sum)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Подписант</dt>
            <dd className="font-semibold text-right">{doc.org}, сертификат ящика</dd>
          </div>
        </dl>
        <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          Подпись юридически значима и выполняется на стороне провайдера. Отменить её нельзя.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  )
}
