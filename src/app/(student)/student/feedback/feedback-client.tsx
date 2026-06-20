'use client'

import { useState, useRef } from 'react'
import { submitFeedback } from '@/actions/feedback'
import {
  Star, MessageSquare, Plus, X, Loader2,
  CheckCircle2, AlertTriangle, ChevronDown,
} from 'lucide-react'

interface WorkoutPlan {
  id: string
  name: string
}

interface Feedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
  workout_plan_id: string | null
  workout_plans: { name: string } | null
}

interface Props {
  feedbacks: Feedback[]
  workoutPlans: WorkoutPlan[]
}

const LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']
const LABEL_COLORS = [
  '',
  'text-red-400',
  'text-orange-400',
  'text-yellow-400',
  'text-brand-lime',
  'text-green-400',
]

function StarRow({
  rating,
  size = 18,
  interactive = false,
  hovered = 0,
  onRate,
  onHover,
  onLeave,
}: {
  rating: number
  size?: number
  interactive?: boolean
  hovered?: number
  onRate?: (n: number) => void
  onHover?: (n: number) => void
  onLeave?: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onRate?.(n) : undefined}
          onMouseEnter={interactive ? () => onHover?.(n) : undefined}
          onMouseLeave={interactive ? () => onLeave?.() : undefined}
          className={interactive ? 'transition-transform hover:scale-110 focus:outline-none' : 'cursor-default'}
          tabIndex={interactive ? 0 : -1}
        >
          <Star
            size={size}
            className={`transition-colors ${
              n <= (hovered || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-surface-border'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function FeedbackClient({ feedbacks, workoutPlans }: Props) {
  const [open, setOpen]       = useState(false)
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [isPending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [localList, setLocalList] = useState<Feedback[]>(feedbacks)
  const formRef = useRef<HTMLFormElement>(null)

  function openModal() {
    setOpen(true)
    setRating(0)
    setHovered(0)
    setError(null)
    setSuccess(false)
  }

  function closeModal() {
    setOpen(false)
    formRef.current?.reset()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (rating === 0) { setError('Selecione uma nota'); return }
    setPending(true)
    setError(null)

    try {
      const fd = new FormData(e.currentTarget)
      fd.set('rating', String(rating))
      const res = await submitFeedback(fd)
      if (res.error) {
        setError(res.error)
      } else {
        const planId = fd.get('workout_plan_id') as string | null
        const plan   = workoutPlans.find(p => p.id === planId) ?? null
        setLocalList(prev => [{
          id: Math.random().toString(),
          rating,
          comment: (fd.get('comment') as string | null)?.trim() || null,
          created_at: new Date().toISOString(),
          workout_plan_id: planId || null,
          workout_plans: plan ? { name: plan.name } : null,
        }, ...prev])
        setSuccess(true)
        closeModal()
      }
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Botão principal */}
      <button
        onClick={openModal}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors"
      >
        <Plus size={15} />
        Avaliar treino
      </button>

      {success && (
        <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-status-success/10 border border-status-success/20 text-status-success text-sm font-medium">
          <CheckCircle2 size={15} />
          Feedback enviado! Obrigado pela avaliação.
        </div>
      )}

      {/* Histórico */}
      {localList.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center mx-auto">
            <MessageSquare size={22} className="text-purple-400" />
          </div>
          <p className="font-body font-medium text-text-primary">Nenhum feedback ainda</p>
          <p className="text-sm text-text-secondary">
            Avalie seus treinos para ajudar seu personal a melhorar suas fichas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
            Seus feedbacks ({localList.length})
          </p>
          {localList.map((fb) => (
            <FeedbackCard key={fb.id} fb={fb} />
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">

            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Avaliar Treino
              </h2>
              <button onClick={closeModal} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

              {/* Nota */}
              <div className="space-y-2">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Nota do treino
                </label>
                <div className="flex items-center gap-3">
                  <StarRow
                    rating={rating}
                    hovered={hovered}
                    size={30}
                    interactive
                    onRate={setRating}
                    onHover={setHovered}
                    onLeave={() => setHovered(0)}
                  />
                  {rating > 0 && (
                    <span className={`text-sm font-display font-bold ${LABEL_COLORS[rating]}`}>
                      {LABELS[rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Plano */}
              {workoutPlans.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                    Plano de treino <span className="text-text-secondary/50">(opcional)</span>
                  </label>
                  <div className="relative">
                    <select
                      name="workout_plan_id"
                      className="w-full appearance-none bg-background border border-surface-border rounded-lg px-3 py-2.5 pr-8 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                    >
                      <option value="">Sem plano específico</option>
                      {workoutPlans.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Comentário */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Comentário <span className="text-text-secondary/50">(opcional)</span>
                </label>
                <textarea
                  name="comment"
                  rows={3}
                  placeholder="Como foi o treino? Ficou pesado? Alguma dificuldade?"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-status-error">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest disabled:opacity-60 hover:bg-brand-lime/90 transition-colors"
                >
                  {isPending
                    ? <><Loader2 size={14} className="animate-spin" /> Enviando…</>
                    : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FeedbackCard({ fb }: { fb: Feedback }) {
  const date = new Date(fb.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Data */}
        <div className="flex-shrink-0 text-center bg-background border border-surface-border rounded-lg px-3 py-2 min-w-[52px]">
          <p className="text-[10px] text-text-secondary uppercase leading-none">
            {new Date(fb.created_at).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
          </p>
          <p className="font-display font-bold text-lg text-text-primary leading-tight">
            {new Date(fb.created_at).getDate()}
          </p>
          <p className="text-[10px] text-text-secondary leading-none">
            {new Date(fb.created_at).getFullYear()}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <StarRow rating={fb.rating} size={13} />
            <span className={`text-xs font-display font-bold ${LABEL_COLORS[fb.rating]}`}>
              {LABELS[fb.rating]}
            </span>
          </div>
          {fb.workout_plans && (
            <p className="text-xs text-text-secondary truncate">
              {fb.workout_plans.name}
            </p>
          )}
          {fb.comment && (
            <p className="text-sm text-text-primary line-clamp-2">{fb.comment}</p>
          )}
        </div>
      </div>
    </div>
  )
}
