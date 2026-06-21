'use client'

import { useState, useTransition } from 'react'
import { Plus, CheckCircle, Loader2 } from 'lucide-react'
import { RoutineCard } from './RoutineCard'
import { createRoutine } from '@/actions/workout-routines'
import { publishWorkoutPlan } from '@/actions/workout-plans'
import { useRouter } from 'next/navigation'

type Routine = {
  id: string
  name: string
  day_of_week: number | null
  display_order: number
  notes: string | null
  workout_items: {
    id: string
    display_order: number
    combo_group_id: string | null
    combo_type: string | null
    sets: number | null
    reps: string | null
    duration_secs: number | null
    rest_seconds: number | null
    load: string | null
    count_type: string
    notes: string | null
    cadence: string | null
    exercises: {
      id: string
      name: string
      muscle_group: string
      load_type: string
      is_global: boolean
      video_url: string | null
      instructions: string | null
      count_type: string
    } | null
  }[]
}

type Props = {
  planId: string
  studentId?: string | null
  initialRoutines: Routine[]
  status: 'active' | 'inactive'
}

export function WorkoutBuilder({ planId, studentId, initialRoutines, status }: Props) {
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAddRoutine() {
    const label = String.fromCharCode(65 + routines.length) // A, B, C...
    startTransition(async () => {
      const result = await createRoutine(
        planId,
        `Treino ${label}`,
        routines.length
      )
      if (result.routine) {
        setRoutines((prev) => [
          ...prev,
          { ...result.routine!, workout_items: [] },
        ])
      }
    })
  }

  function handleDeleteRoutine(routineId: string) {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId))
  }

  function handlePublish() {
    startTransition(async () => {
      await publishWorkoutPlan(planId, studentId ?? null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Rotinas */}
      {routines.map((routine) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          studentId={studentId ?? undefined}
          planId={planId}
          onDelete={handleDeleteRoutine}
        />
      ))}

      {/* Botão nova rotina */}
      <button
        onClick={handleAddRoutine}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-surface-border text-text-secondary hover:border-brand-lime/40 hover:text-brand-lime hover:bg-brand-lime/5 transition-all font-medium"
      >
        {isPending
          ? <Loader2 size={15} className="animate-spin" />
          : <Plus size={15} />
        }
        {isPending ? 'Criando rotina...' : 'Nova Rotina (Treino)'}
      </button>

      {/* Publicar plano */}
      {status === 'inactive' && routines.length > 0 && (
        <div className="pt-2">
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors"
          >
            {isPending
              ? <Loader2 size={15} className="animate-spin" />
              : <CheckCircle size={15} />
            }
            Ativar Plano
          </button>
          <p className="text-xs text-text-secondary text-center mt-2">
            Após ativar, o plano poderá ser atribuído a alunos.
          </p>
        </div>
      )}

      {status === 'active' && (
        <div className="flex items-center gap-2 p-3 bg-status-success/10 border border-status-success/20 rounded-xl">
          <CheckCircle size={14} className="text-status-success flex-shrink-0" />
          <p className="text-xs text-status-success font-medium">
            Treino ativo — pronto para ser atribuído a alunos.
          </p>
        </div>
      )}
    </div>
  )
}
