'use client'

import { useState } from 'react'
import { saveAnamnese } from '@/actions/anamnese'
import { CheckCircle, Loader2, AlertTriangle, Pencil, Check, X } from 'lucide-react'

interface AnamneseField {
  id: string
  field_key: string
  field_type: string
  label: string
  options: string[] | null
  required: boolean
  category: string
}

const CATEGORIES: Record<string, { label: string; order: number }> = {
  saude:       { label: 'Saúde e Histórico Médico',      order: 1 },
  historico:   { label: 'Histórico de Atividade Física', order: 2 },
  objetivos:   { label: 'Objetivos',                     order: 3 },
  habitos:     { label: 'Hábitos de Vida',               order: 4 },
  alimentacao: { label: 'Alimentação',                   order: 5 },
}

interface Props {
  fields: AnamneseField[]
  initialValues: Record<string, string>
  existingId: string | null
  completedAt: string | null
}

export function AnamneseForm({ fields, initialValues, existingId, completedAt }: Props) {
  const [values, setValues]         = useState<Record<string, string>>(initialValues)
  const [currentId, setCurrentId]   = useState<string | null>(existingId)
  const [isCompleted, setIsCompleted] = useState(!!completedAt)
  const [savedAt, setSavedAt]       = useState<string | null>(completedAt)
  const [banner, setBanner]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, setIsPending] = useState(false)

  const setValue = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (complete: boolean) => {
    setIsPending(true)
    setBanner(null)
    try {
      const res = await saveAnamnese({ values, complete, existingId: currentId })
      if (res.error) {
        setBanner({ type: 'error', msg: res.error })
        return
      }
      if (res.newId) setCurrentId(res.newId)
      if (complete) {
        setIsCompleted(true)
        setSavedAt(new Date().toISOString())
      }
      setBanner({
        type: 'success',
        msg: complete ? 'Anamnese enviada! Seu personal já pode visualizá-la.' : 'Rascunho salvo.',
      })
    } catch (err) {
      console.error('[saveAnamnese]', err)
      setBanner({ type: 'error', msg: 'Erro ao salvar. Verifique sua conexão e tente novamente.' })
    } finally {
      setIsPending(false)
    }
  }

  const grouped = Object.entries(CATEGORIES)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([cat, meta]) => ({
      key: cat,
      label: meta.label,
      fields: fields.filter((f) => f.category === cat),
    }))
    .filter((g) => g.fields.length > 0)

  return (
    <div className="space-y-5">

      {/* Banner */}
      {banner && (
        <div className={`flex items-center gap-3 rounded-xl p-4 border ${
          banner.type === 'success'
            ? 'bg-status-success/10 border-status-success/20 text-status-success'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {banner.type === 'success'
            ? <CheckCircle size={15} className="flex-shrink-0" />
            : <AlertTriangle size={15} className="flex-shrink-0" />}
          <p className="text-sm font-medium">{banner.msg}</p>
        </div>
      )}

      {/* Category sections */}
      {grouped.map((group) => (
        <div
          key={group.key}
          className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4"
        >
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            {group.label}
          </p>
          <div className="space-y-4">
            {group.fields.map((field) => (
              <FieldRow
                key={field.field_key}
                field={field}
                value={values[field.field_key] ?? ''}
                onChange={(v) => setValue(field.field_key, v)}
                disabled={isCompleted}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      {isCompleted ? (
        <div className="text-center space-y-2 pt-2">
          <p className="text-xs text-text-secondary">
            Anamnese enviada
            {savedAt && <> em {new Date(savedAt).toLocaleDateString('pt-BR')}</>}.
          </p>
          <button
            onClick={() => { setIsCompleted(false); setBanner(null) }}
            className="inline-flex items-center gap-1.5 text-xs text-brand-lime hover:underline"
          >
            <Pencil size={11} />
            Editar respostas
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => void handleSubmit(false)}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl border border-surface-border text-sm font-display font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-text-secondary/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Salvar rascunho
          </button>
          <button
            onClick={() => void handleSubmit(true)}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Enviar anamnese →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Field renderer ─────────────────────────────────────────────────────────────

function FieldRow({
  field,
  value,
  onChange,
  disabled,
}: {
  field: AnamneseField
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const base =
    'bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body w-full disabled:opacity-50 disabled:cursor-not-allowed'

  const label = (
    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
      {field.label}
      {field.required && <span className="text-red-400">*</span>}
    </label>
  )

  if (field.field_type === 'boolean') {
    return (
      <div className="space-y-2">
        {label}
        <div className="flex gap-3">
          {(['sim', 'nao'] as const).map((opt) => {
            const isSelected = value === opt
            const isSim = opt === 'sim'
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => onChange(isSelected ? '' : opt)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                  isSelected
                    ? isSim
                      ? 'bg-brand-lime border-brand-lime text-black'
                      : 'bg-red-500 border-red-500 text-white'
                    : 'border-surface-border text-text-secondary hover:border-text-secondary/50 hover:text-text-primary disabled:opacity-50'
                }`}
              >
                {isSelected
                  ? isSim
                    ? <Check size={14} strokeWidth={3} />
                    : <X size={14} strokeWidth={3} />
                  : null}
                {isSim ? 'Sim' : 'Não'}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (field.field_type === 'select') {
    return (
      <div className="space-y-2">
        {label}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={base}
        >
          <option value="">Selecionar...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (field.field_type === 'textarea') {
    return (
      <div className="space-y-2">
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Descreva aqui..."
          className={`${base} resize-none`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Sua resposta..."
        className={base}
      />
    </div>
  )
}
