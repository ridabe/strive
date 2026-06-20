'use client'

import { useState, useTransition } from 'react'
import { createAssessment } from '@/app/actions/assessments'
import { deleteAssessment } from '@/app/actions/assessments'
import { Plus, X, Save, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface Assessment {
  id: string
  assessed_at: string
  weight: number | null
  height: number | null
  body_fat: number | null
  arm: number | null
  chest: number | null
  waist: number | null
  hip: number | null
  thigh: number | null
  notes: string | null
}

const GENERAL_FIELDS = [
  { name: 'weight',   label: 'Peso (kg)',      step: '0.1' },
  { name: 'height',   label: 'Altura (cm)',    step: '0.1' },
  { name: 'body_fat', label: '% Gordura',      step: '0.1' },
] as const

const CIRCUM_FIELDS = [
  { name: 'arm',   label: 'Braço'    },
  { name: 'chest', label: 'Peitoral' },
  { name: 'waist', label: 'Cintura'  },
  { name: 'hip',   label: 'Quadril'  },
  { name: 'thigh', label: 'Coxa'     },
] as const

// ─── Formulário de nova avaliação ─────────────────────────────────────────────
export function NewAssessmentForm({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await createAssessment(studentId, fd)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-body font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={15} />
        Nova Avaliação
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-brand-lime/30 rounded-xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-body font-semibold text-sm text-text-primary">
          Nova Avaliação Física
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Data */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">Data da Avaliação</label>
        <input
          type="date"
          name="assessed_at"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
          className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
        />
      </div>

      {/* Medidas gerais */}
      <div>
        <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-3 pb-2 border-b border-surface-border">
          Medidas Gerais
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GENERAL_FIELDS.map((f) => (
            <div key={f.name}>
              <label className="text-xs text-text-secondary block mb-1">{f.label}</label>
              <input
                type="number"
                name={f.name}
                step={f.step}
                min="0"
                placeholder="—"
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 placeholder:text-text-secondary/40"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Circunferências */}
      <div>
        <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-3 pb-2 border-b border-surface-border">
          Circunferências (cm)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CIRCUM_FIELDS.map((f) => (
            <div key={f.name}>
              <label className="text-xs text-text-secondary block mb-1">{f.label}</label>
              <input
                type="number"
                name={f.name}
                step="0.1"
                min="0"
                placeholder="—"
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 placeholder:text-text-secondary/40"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">Observações</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Observações gerais sobre a avaliação..."
          className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 placeholder:text-text-secondary/40 resize-none"
        />
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar Avaliação
        </button>
      </div>
    </form>
  )
}

// ─── Card de avaliação (com delete) ──────────────────────────────────────────
export function AssessmentCard({
  assessment,
  studentId,
}: {
  assessment: Assessment
  studentId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm('Excluir esta avaliação? Esta ação não pode ser desfeita.')) return
    startTransition(async () => {
      await deleteAssessment(assessment.id, studentId)
    })
  }

  const fmt = (v: number | null, suffix = '') =>
    v !== null ? `${v}${suffix}` : '—'

  const hasMeasurements =
    assessment.arm !== null ||
    assessment.chest !== null ||
    assessment.waist !== null ||
    assessment.hip !== null ||
    assessment.thigh !== null

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      {/* Header do card */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-body font-semibold text-sm text-text-primary">
              {new Date(assessment.assessed_at + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
              {assessment.weight !== null && (
                <span className="text-text-primary font-medium">{assessment.weight} kg</span>
              )}
              {assessment.height !== null && <span>{assessment.height} cm</span>}
              {assessment.body_fat !== null && <span>{assessment.body_fat}% gordura</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(hasMeasurements || assessment.notes) && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Menos' : 'Detalhes'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-text-secondary hover:text-status-error transition-colors disabled:opacity-40"
            title="Excluir avaliação"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-surface-border px-5 py-4 space-y-4">
          {hasMeasurements && (
            <div>
              <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Circunferências
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Braço',    value: fmt(assessment.arm,   ' cm') },
                  { label: 'Peitoral', value: fmt(assessment.chest, ' cm') },
                  { label: 'Cintura',  value: fmt(assessment.waist, ' cm') },
                  { label: 'Quadril',  value: fmt(assessment.hip,   ' cm') },
                  { label: 'Coxa',     value: fmt(assessment.thigh, ' cm') },
                ].map((m) => (
                  <div key={m.label} className="bg-background rounded-lg p-3 text-center">
                    <p className="text-xs text-text-secondary mb-0.5">{m.label}</p>
                    <p className="text-sm font-medium text-text-primary">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {assessment.notes && (
            <div>
              <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Observações
              </p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{assessment.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
