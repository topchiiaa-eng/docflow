import { useState, type FormEvent } from 'react'
import { DOC_KINDS, type DocKind, type NewDocumentInput, type Organization } from '../types'
import { validateDocument, type FieldErrors } from '../lib/validation'

interface Props {
  orgs: Organization[]
  busy: boolean
  error: string | null
  onSubmit: (input: NewDocumentInput) => void
  onCancel: () => void
}

const label = 'label mt-4 mb-1'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-xs text-urgent">
      {message}
    </p>
  )
}

/** Форма ручного добавления документа с клиентской валидацией и загрузкой PDF */
export function NewDocumentDialog({ orgs, busy, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<NewDocumentInput>({
    orgId: orgs[0]?.id ?? '',
    counterparty: '',
    title: '',
    kind: 'УПД',
    sum: '',
    requiresSignature: true,
    file: null,
  })
  const [errors, setErrors] = useState<FieldErrors<keyof NewDocumentInput>>({})
  const input = (k: keyof NewDocumentInput) => `input ${errors[k] ? 'input-error' : ''}`

  const set = <K extends keyof NewDocumentInput>(k: K, v: NewDocumentInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validateDocument(form)
    setErrors(errs)
    if (Object.keys(errs).length === 0) onSubmit(form)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Новый документ"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        className="card-elevated max-h-full w-full max-w-md overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        noValidate
      >
        <p className="label">Вне ЭДО</p>
        <h3 className="h2 mt-1">Добавить документ</h3>
        <p className="small mt-2 text-meta">
          Для документов, пришедших вне ЭДО (бумага, email). Можно приложить PDF до 10 МБ.
        </p>

        <label className={label} htmlFor="nd-org">
          Организация-получатель
        </label>
        <select
          id="nd-org"
          className={input('orgId')}
          value={form.orgId}
          onChange={(e) => set('orgId', e.target.value)}
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.orgId} />

        <label className={label} htmlFor="nd-cp">
          Контрагент
        </label>
        <input
          id="nd-cp"
          className={input('counterparty')}
          value={form.counterparty}
          placeholder="ООО «Ромашка»"
          onChange={(e) => set('counterparty', e.target.value)}
        />
        <FieldError message={errors.counterparty} />

        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label className={label} htmlFor="nd-title">
              Название / номер
            </label>
            <input
              id="nd-title"
              className={input('title')}
              value={form.title}
              placeholder="УПД № 123"
              onChange={(e) => set('title', e.target.value)}
            />
            <FieldError message={errors.title} />
          </div>
          <div>
            <label className={label} htmlFor="nd-kind">
              Тип
            </label>
            <select
              id="nd-kind"
              className="input"
              value={form.kind}
              onChange={(e) => set('kind', e.target.value as DocKind)}
            >
              {DOC_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        <label className={label} htmlFor="nd-sum">
          Сумма без НДС, ₽ (необязательно)
        </label>
        <input
          id="nd-sum"
          className={`${input('sum')} num`}
          inputMode="decimal"
          value={form.sum}
          placeholder="89 800"
          onChange={(e) => set('sum', e.target.value)}
        />
        <FieldError message={errors.sum} />

        <label className={label} htmlFor="nd-file">
          Файл PDF (необязательно)
        </label>
        <div className="flex items-center gap-3">
          <label htmlFor="nd-file" className="btn-secondary h-9 cursor-pointer px-3 text-xs">
            Выбрать PDF
          </label>
          <span className="small truncate text-meta">{form.file ? form.file.name : 'Файл не выбран'}</span>
          <input
            id="nd-file"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => set('file', e.target.files?.[0] ?? null)}
          />
        </div>
        <FieldError message={errors.file} />

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.requiresSignature}
            onChange={(e) => set('requiresSignature', e.target.checked)}
          />
          Требует подписи
        </label>

        {error && (
          <div
            role="alert"
            className="mt-4 border-l-[3px] border-error bg-error-container p-3 text-sm text-on-error"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary flex-1">
            Отмена
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? 'Сохраняем…' : 'Добавить'}
          </button>
        </div>
      </form>
    </div>
  )
}
