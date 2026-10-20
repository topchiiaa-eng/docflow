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
  const rows: [string, string][] = [
    ['Документ', doc.title],
    ['Контрагент', doc.counterparty],
    ['Сумма (без НДС)', formatSum(doc.sum)],
    ['Подписант', `${doc.org}, сертификат ящика`],
  ]
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Подтверждение подписания"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div className="card-elevated w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <p className="label">Подписание</p>
        <h3 className="h2 mt-1">Подписать документ?</h3>
        <dl className="mt-5 border-t border-rule text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-rule py-2">
              <dt className="text-meta">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-l-[3px] border-warning bg-warning-container p-3 text-xs text-on-warning">
          Подпись юридически значима и выполняется на стороне провайдера. Отменить её нельзя.
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Отмена
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1">
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  )
}
