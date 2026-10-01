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

const input =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none'
const label = 'mt-3 block text-xs font-semibold text-slate-600'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-xs text-red-600">
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        noValidate
      >
        <h3 className="text-base font-bold">Добавить документ</h3>
        <p className="mt-1 text-xs text-slate-500">
          Для документов, пришедших вне ЭДО (бумага, email). Можно приложить PDF до 10 МБ.
        </p>

        <label className={label} htmlFor="nd-org">
          Организация-получатель
        </label>
        <select
          id="nd-org"
          className={input}
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
          className={input}
          value={form.counterparty}
          placeholder="ООО «Ромашка»"
          onChange={(e) => set('counterparty', e.target.value)}
        />
        <FieldError message={errors.counterparty} />

        <div className="grid grid-cols-[1fr_120px] gap-2">
          <div>
            <label className={label} htmlFor="nd-title">
              Название / номер
            </label>
            <input
              id="nd-title"
              className={input}
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
              className={input}
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
          className={input}
          inputMode="decimal"
          value={form.sum}
          placeholder="89 800"
          onChange={(e) => set('sum', e.target.value)}
        />
        <FieldError message={errors.sum} />

        <label className={label} htmlFor="nd-file">
          Файл PDF (необязательно)
        </label>
        <input
          id="nd-file"
          type="file"
          accept="application/pdf"
          className="block w-full text-sm"
          onChange={(e) => set('file', e.target.files?.[0] ?? null)}
        />
        <FieldError message={errors.file} />

        <label className="mt-3 flex items-center gap-2 text-sm">
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
            className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? 'Сохраняем…' : 'Добавить'}
          </button>
        </div>
      </form>
    </div>
  )
}
