import type { DocumentItem } from '../types'
import { formatDate, formatSum } from '../lib/documents'
import { StatusBadge } from './StatusBadge'
import { FileIcon, XIcon } from './Icons'

interface Props {
  doc: DocumentItem | null
  signing: boolean
  signError: string | null
  /** Текущий пользователь — владелец организации документа (может удалять) */
  canDelete: boolean
  fileBusy: boolean
  onRequestSign: () => void
  onOpenFile: () => void
  onRequestDelete: () => void
  onClose: () => void
}

/** Карточка документа: «Elevated» по DESIGN.md — верхняя линейка 2px, атрибуты строками с линейками */
export function DetailPanel({
  doc,
  signing,
  signError,
  canDelete,
  fileBusy,
  onRequestSign,
  onOpenFile,
  onRequestDelete,
  onClose,
}: Props) {
  if (!doc) {
    return (
      <div className="card-elevated hidden h-full min-h-72 flex-col justify-center p-6 lg:flex">
        <p className="label">Карточка документа</p>
        <p className="h3 mt-2">Выберите документ из списка</p>
        <p className="mt-2 text-meta">Карточка откроется здесь, без перехода на другую страницу</p>
      </div>
    )
  }

  const needsSign = doc.status === 'requires_signature'
  const rows: [string, string][] = [
    ['Сумма без НДС', formatSum(doc.sum)],
    ['Получен', formatDate(doc.receivedAt)],
    ['Получатель', doc.org],
    ['Контрагент', doc.counterparty],
  ]

  return (
    <section aria-label="Карточка документа" className="card-elevated flex h-full flex-col bg-paper">
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="caps truncate">
            {doc.kind} · {doc.org}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={doc.status} />
            <button
              onClick={onClose}
              aria-label="Закрыть карточку"
              className="p-1.5 text-meta hover:bg-paper-subtle hover:text-ink lg:hidden"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>
        <h2 className="h2 mt-3">{doc.title}</h2>
        <p className="mt-1 text-meta">{doc.counterparty}</p>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <dl className="border-t-2 border-ink text-sm">
          {rows.map(([k, v], i) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
              <dt className="caps">{k}</dt>
              <dd
                className={`truncate text-right ${i === 0 ? 'num text-base font-medium' : 'font-semibold'}`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>

        {/* Файл: PDF из хранилища (временная ссылка) либо отсутствие файла */}
        <div className="flex items-center gap-3 border border-rule p-3">
          <FileIcon size={22} strokeWidth={1.5} className={doc.filePath ? 'text-ink' : 'text-meta-light'} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{doc.filePath ? 'PDF-документ' : 'PDF не приложен'}</p>
            <p className="small text-meta">
              {doc.filePath ? 'Хранится в защищённом хранилище' : 'Файл можно приложить при добавлении'}
            </p>
          </div>
          {doc.filePath && (
            <button
              onClick={onOpenFile}
              disabled={fileBusy}
              className="btn-ghost underline underline-offset-4"
            >
              {fileBusy ? 'Ссылка…' : 'Открыть'}
            </button>
          )}
        </div>

        {signError && (
          <div
            role="alert"
            className="border-l-[3px] border-error bg-error-container p-3 text-sm text-on-error"
          >
            {signError}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {needsSign && (
            <>
              <button onClick={onRequestSign} disabled={signing} className="btn-primary h-11 w-full">
                {signing ? 'Подписываем…' : 'Утвердить и подписать'}
              </button>
              <p className="small text-center text-meta">
                Откроется подтверждение: документ, подписант, сертификат
              </p>
            </>
          )}
          {canDelete && doc.status !== 'signed' && (
            <button
              onClick={onRequestDelete}
              className="self-center text-xs font-semibold text-urgent underline-offset-4 hover:underline"
            >
              Удалить документ
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
