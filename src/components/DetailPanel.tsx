import type { DocumentItem } from '../types'
import { formatDate, formatSum } from '../lib/documents'
import { StatusBadge } from './StatusBadge'
import { FileIcon, PenIcon, XIcon } from './Icons'

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
      <div className="card hidden h-full min-h-72 flex-col items-center justify-center p-8 text-center lg:flex">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <FileIcon size={22} />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-600">Выберите документ из списка</p>
        <p className="mt-1 text-xs text-slate-400">
          Карточка откроется здесь, без перехода на другую страницу
        </p>
      </div>
    )
  }

  const needsSign = doc.status === 'requires_signature'

  return (
    <section aria-label="Карточка документа" className="card flex h-full flex-col overflow-hidden">
      {/* Шапка карточки: статус задаёт цвет */}
      <div
        className={`flex items-start justify-between gap-3 px-5 pt-5 pb-4 ${needsSign ? 'bg-orange-50/60' : 'bg-slate-50/60'}`}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {doc.kind} · {doc.org}
          </p>
          <h2 className="mt-1 truncate text-lg font-extrabold tracking-tight">{doc.title}</h2>
          <p className="truncate text-sm text-slate-600">{doc.counterparty}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={doc.status} />
          <button
            onClick={onClose}
            aria-label="Закрыть карточку"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-ink lg:hidden"
          >
            <XIcon size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Сумма без НДС</dt>
            <dd className="text-base font-bold tabular-nums">{formatSum(doc.sum)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Получен</dt>
            <dd className="font-semibold">{formatDate(doc.receivedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Получатель</dt>
            <dd className="font-semibold">{doc.org}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Контрагент</dt>
            <dd className="truncate font-semibold">{doc.counterparty}</dd>
          </div>
        </dl>

        {/* Файл: PDF из хранилища (временная ссылка) либо отсутствие файла */}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${doc.filePath ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}
          >
            <FileIcon size={20} />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{doc.filePath ? 'PDF-документ' : 'PDF не приложен'}</p>
            <p className="text-xs text-slate-500">
              {doc.filePath ? 'Хранится в защищённом хранилище' : 'Файл можно приложить при добавлении'}
            </p>
          </div>
          {doc.filePath && (
            <button onClick={onOpenFile} disabled={fileBusy} className="btn-secondary px-3 py-2 text-xs">
              {fileBusy ? 'Ссылка…' : 'Открыть'}
            </button>
          )}
        </div>

        {signError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {signError}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {needsSign && (
            <>
              <button onClick={onRequestSign} disabled={signing} className="btn-primary w-full py-3">
                <PenIcon size={16} />
                {signing ? 'Подписываем…' : 'Утвердить и подписать'}
              </button>
              <p className="text-center text-xs text-slate-400">
                Откроется подтверждение: документ, подписант, сертификат
              </p>
            </>
          )}
          {canDelete && doc.status !== 'signed' && (
            <button
              onClick={onRequestDelete}
              className="self-center text-xs font-semibold text-red-600 hover:underline"
            >
              Удалить документ
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
