'use client'

import { useState, useTransition } from 'react'
import { saveAnamneseResponse } from '@/app/actions/anamnese'
import { CheckCircle2, Save } from 'lucide-react'

type FieldType = 'text' | 'textarea' | 'boolean' | 'select' | 'number'

export interface AnamneseField {
  id: string
  field_key: string
  label: string
  field_type: FieldType
  options: string[] | null
  required: boolean
  category: string
  tenant_id: string | null
}

interface Props {
  studentId: string
  fields: AnamneseField[]
  categories: { key: string; label: string }[]
  initialResponses: Record<string, unknown>
  completedAt: string | null
}

export function AnamneseForm({
  studentId,
  fields,
  categories,
  initialResponses,
  completedAt,
}: Props) {
  const [responses, setResponses] = useState<Record<string, unknown>>(initialResponses)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function setValue(key: string, val: unknown) {
    setResponses((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleSave(complete: boolean) {
    startTransition(async () => {
      const res = await saveAnamneseResponse(studentId, responses, complete)
      if (!res?.error) setSaved(true)
    })
  }

  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const catFields = fields.filter((f) => f.category === cat.key)
        if (catFields.length === 0) return null
        return (
          <section key={cat.key} className="space-y-4">
            <h2 className="font-body font-semibold text-xs uppercase tracking-widest text-text-secondary border-b border-surface-border pb-2">
              {cat.label}
            </h2>
            <div className="space-y-4">
              {catFields.map((field) => (
                <FieldInput
                  key={field.id}
                  field={field}
                  value={responses[field.field_key]}
                  onChange={(v) => setValue(field.field_key, v)}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* Botões */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => handleSave(false)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-surface-border text-sm font-body font-medium text-text-primary hover:border-brand-lime/30 hover:text-brand-lime transition-all disabled:opacity-50"
        >
          <Save size={15} />
          {isPending ? 'Salvando…' : 'Salvar rascunho'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isPending || !!completedAt}
          className="flex items-center gap-2 bg-brand-lime text-background font-body font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 size={15} />
          {completedAt ? 'Já finalizada' : isPending ? 'Salvando…' : 'Finalizar anamnese'}
        </button>

        {saved && (
          <span className="self-center text-sm text-status-success flex items-center gap-1">
            <CheckCircle2 size={13} /> Salvo!
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Componente de campo individual ──────────────────────────────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: AnamneseField
  value: unknown
  onChange: (v: unknown) => void
}) {
  const base =
    'w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 transition-colors'

  return (
    <div className="space-y-1">
      <label className="text-sm text-text-primary font-body">
        {field.label}
        {field.required && <span className="text-status-error ml-0.5">*</span>}
        {field.tenant_id && (
          <span className="ml-2 text-xs text-brand-lime/70 border border-brand-lime/20 rounded px-1">
            personalizado
          </span>
        )}
      </label>

      {field.field_type === 'boolean' && (
        <div className="flex gap-3">
          {['Sim', 'Não'].map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={field.field_key}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-brand-lime"
              />
              <span className="text-sm text-text-primary">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.field_type === 'select' && field.options && (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">Selecione…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}

      {field.field_type === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={base}
          placeholder={field.label}
        />
      )}

      {field.field_type === 'number' && (
        <input
          type="number"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          className={base}
          placeholder="0"
        />
      )}

      {field.field_type === 'textarea' && (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${base} resize-none`}
          placeholder={field.label}
        />
      )}
    </div>
  )
}
