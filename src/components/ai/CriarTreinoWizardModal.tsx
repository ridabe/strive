'use client'

import { useState } from 'react'
import { X, Sparkles, Zap } from 'lucide-react'

const MAX_COLOR = '#7C3AED'

export interface PlanPreferences {
  workoutType?: string
  goal?: string
  daysCount?: number
  notes?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSkip: () => void
  onSubmit: (preferences: PlanPreferences) => void
}

const WORKOUT_TYPES = ['Hipertrofia', 'Emagrecimento', 'Resistência', 'Força', 'Condicionamento', 'Reabilitação']
const GOAL_COLORS: Record<string, string> = {
  Hipertrofia: '#8B5CF6',
  Emagrecimento: '#EF4444',
  Resistência: '#10B981',
  Força: '#F59E0B',
  Condicionamento: '#06B6D4',
  Reabilitação: '#EC4899',
}
const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6]
const NOTES_TIPS = [
  'Poucos exercícios e cargas altas',
  'Foco em pernas e glúteos',
  'Treino em casa, sem equipamentos',
  'Evitar exercícios de impacto (joelho)',
]

/**
 * Wizard de perguntas opcionais para personalizar o treino gerado pelo Max —
 * o personal pode responder tudo, só parte, ou pular e deixar automático.
 */
export function CriarTreinoWizardModal({ open, onClose, onSkip, onSubmit }: Props) {
  const [workoutType, setWorkoutType] = useState('')
  const [daysCount, setDaysCount] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  if (!open) return null

  function reset() {
    setWorkoutType('')
    setDaysCount(null)
    setNotes('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSkip() {
    reset()
    onSkip()
  }

  function handleSubmit() {
    onSubmit({
      workoutType: workoutType || undefined,
      daysCount:   daysCount ?? undefined,
      notes:       notes.trim() || undefined,
    })
    reset()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center" onClick={handleClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-body text-lg font-bold text-text-primary">Personalizar Treino</h2>
          <button type="button" onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-text-secondary transition-colors hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-text-secondary">
          Responda o que quiser — o que ficar em branco o Max decide sozinho.
        </p>

        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">Tipo de treino</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {WORKOUT_TYPES.map((g) => {
            const isSelected = workoutType === g
            const color = GOAL_COLORS[g] ?? MAX_COLOR
            return (
              <button
                key={g}
                type="button"
                onClick={() => setWorkoutType(isSelected ? '' : g)}
                className="rounded-full border px-3.5 py-2 text-sm font-medium transition-all"
                style={isSelected
                  ? { borderColor: color, backgroundColor: `${color}18`, color }
                  : { borderColor: 'var(--surface-border)', color: 'var(--text-secondary)' }}
              >
                {g}
              </button>
            )
          })}
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">Quantidade de dias</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {DAYS_OPTIONS.map((n) => {
            const isSelected = daysCount === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setDaysCount(isSelected ? null : n)}
                className="flex h-10 w-12 items-center justify-center rounded-xl border text-sm font-medium transition-all"
                style={isSelected
                  ? { borderColor: MAX_COLOR, backgroundColor: `${MAX_COLOR}18`, color: MAX_COLOR }
                  : { borderColor: 'var(--surface-border)', color: 'var(--text-secondary)' }}
              >
                {n}x
              </button>
            )
          })}
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">Observações</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: poucos exercícios e muita carga"
          rows={3}
          className="w-full resize-none rounded-xl border border-surface-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-violet-400/50 focus:outline-none"
        />
        <div className="mt-2 mb-5 flex flex-wrap gap-1.5">
          {NOTES_TIPS.map((tip) => (
            <button
              key={tip}
              type="button"
              onClick={() => setNotes(tip)}
              className="rounded-full border border-surface-border bg-background px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              {tip}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: MAX_COLOR }}
        >
          <Sparkles size={16} />
          Criar com essas preferências
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors"
          style={{ color: MAX_COLOR }}
        >
          <Zap size={14} />
          Deixar o Max decidir automaticamente
        </button>
      </div>
    </div>
  )
}
