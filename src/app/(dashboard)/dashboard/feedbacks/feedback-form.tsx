'use client'

import { useRef, useState, useTransition } from 'react'
import { addFeedback } from './actions'
import { Star, Plus, X, Loader2 } from 'lucide-react'

interface Student {
  id: string
  full_name: string
}

interface WorkoutPlan {
  id: string
  name: string
  student_id: string
}

interface Props {
  students: Student[]
  workoutPlans: WorkoutPlan[]
}

export function AddFeedbackButton({ students, workoutPlans }: Props) {
  const [open, setOpen]         = useState(false)
  const [rating, setRating]     = useState(0)
  const [hovered, setHovered]   = useState(0)
  const [studentId, setStudentId] = useState('')
  const [error, setError]       = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const plansForStudent = workoutPlans.filter(p => p.student_id === studentId)

  function handleClose() {
    setOpen(false)
    setRating(0)
    setHovered(0)
    setStudentId('')
    setError('')
    formRef.current?.reset()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (rating === 0) { setError('Selecione uma nota'); return }
    if (!studentId)   { setError('Selecione um aluno'); return }
    setError('')

    const fd = new FormData(e.currentTarget)
    fd.set('rating', String(rating))

    startTransition(async () => {
      const result = await addFeedback(fd)
      if (result.error) { setError(result.error); return }
      handleClose()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity"
      >
        <Plus size={15} />
        Registrar Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Novo Feedback
              </h2>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {/* Aluno */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Aluno
                </label>
                <select
                  name="student_id"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  required
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                >
                  <option value="">Selecione um aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Plano (opcional) */}
              {plansForStudent.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                    Plano de Treino <span className="text-text-secondary/50">(opcional)</span>
                  </label>
                  <select
                    name="workout_plan_id"
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                  >
                    <option value="">Sem plano específico</option>
                    {plansForStudent.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nota */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Nota do Treino
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          n <= (hovered || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-surface-border'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-text-secondary">
                      {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comentário */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Comentário <span className="text-text-secondary/50">(opcional)</span>
                </label>
                <textarea
                  name="comment"
                  rows={3}
                  placeholder="Como foi o treino?"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-status-error">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
