import { notFound } from 'next/navigation'
import { getWorkoutPlan, type WorkoutPlanWithRoutines } from '@/actions/workout-plans'
import Link from 'next/link'
import { ArrowLeft, Play, Clock, Target, Dumbbell, Link2 } from 'lucide-react'
import { muscleColor } from '@/lib/exercise-config'

type Props = { params: Promise<{ planId: string }> }

type WorkoutItem = WorkoutPlanWithRoutines['workout_routines'][number]['workout_items'][number]
type ItemBlock =
  | { type: 'single'; item: WorkoutItem }
  | { type: 'combo'; comboGroupId: string; comboType: string; items: WorkoutItem[] }

function groupItemsByCombo(items: WorkoutItem[]): ItemBlock[] {
  const blocks: ItemBlock[] = []
  const seen = new Set<string>()
  for (const item of items) {
    if (!item.combo_group_id) {
      blocks.push({ type: 'single', item })
    } else if (!seen.has(item.combo_group_id)) {
      seen.add(item.combo_group_id)
      const grouped = items.filter((x) => x.combo_group_id === item.combo_group_id)
      blocks.push({ type: 'combo', comboGroupId: item.combo_group_id, comboType: item.combo_type ?? 'biset', items: grouped })
    }
  }
  return blocks
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const COMBO_LABEL: Record<string, string> = { biset: 'BI-SET', triset: 'TRI-SET', circuit: 'CIRCUITO' }

function ExerciseBlock({ item }: { item: WorkoutItem }) {
  const ex = item.exercises
  if (!ex) return null

  const countLine =
    item.count_type === 'time'
      ? `${item.sets ?? '?'}× ${item.duration_secs}seg`
      : item.count_type === 'both'
        ? `${item.sets ?? '?'}× ${item.reps} reps / ${item.duration_secs}seg`
        : `${item.sets ?? '?'}× ${item.reps ?? '?'} reps`

  return (
    <div className="bg-background border border-surface-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <Dumbbell size={14} className="text-brand-lime" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-text-primary">{ex.name}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${muscleColor(ex.muscle_group)}`}>
            {ex.muscle_group}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-semibold text-text-primary bg-surface border border-surface-border rounded-lg px-3 py-1.5">
          {countLine}
        </span>
        {item.load && (
          <span className="text-sm text-text-secondary bg-surface border border-surface-border rounded-lg px-3 py-1.5">
            {item.load}
          </span>
        )}
        {item.rest_seconds != null && item.rest_seconds > 0 && (
          <span className="flex items-center gap-1 text-sm text-text-secondary bg-surface border border-surface-border rounded-lg px-3 py-1.5">
            <Clock size={11} />
            {item.rest_seconds}s descanso
          </span>
        )}
      </div>

      {item.notes && (
        <p className="text-xs text-text-secondary italic border-l-2 border-brand-lime/30 pl-3">
          {item.notes}
        </p>
      )}

      {ex.video_url && (
        <a
          href={ex.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-brand-lime hover:underline"
        >
          <Play size={11} />
          Ver demonstração
        </a>
      )}
    </div>
  )
}

export default async function StudentPlanPage({ params }: Props) {
  const { planId } = await params
  const plan = await getWorkoutPlan(planId)
  if (!plan || plan.status !== 'active') notFound()

  const goalColor: Record<string, string> = {
    'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'Força':          'text-red-400 bg-red-400/10 border-red-400/20',
    'Resistência':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
    'Condicionamento':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'Reabilitação':   'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }

  return (
    <div className="p-5 space-y-6">
      <Link
        href="/student/treinos"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Meus treinos
      </Link>

      {/* Cabeçalho do plano */}
      <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-2">
        <h1 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
          {plan.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          {plan.goal && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
              goalColor[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
            }`}>
              <Target size={10} />
              {plan.goal}
            </span>
          )}
          {plan.start_date && plan.end_date && (
            <span className="text-xs text-text-secondary">
              {new Date(plan.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              {' → '}
              {new Date(plan.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        {plan.description && (
          <p className="text-xs text-text-secondary leading-relaxed">{plan.description}</p>
        )}
      </div>

      {/* Rotinas */}
      {plan.workout_routines.map((routine) => {
        const blocks = groupItemsByCombo(routine.workout_items)
        return (
          <div key={routine.id} className="space-y-3">
            {/* Header da rotina */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-brand-lime rounded-full" />
              <h2 className="font-display font-bold text-text-primary uppercase tracking-widest text-sm">
                {routine.name}
              </h2>
              {routine.day_of_week != null && (
                <span className="text-xs text-text-secondary bg-surface border border-surface-border px-2 py-0.5 rounded-full">
                  {DAY_LABELS[routine.day_of_week]}
                </span>
              )}
              <span className="text-xs text-text-secondary ml-auto">
                {routine.workout_items.length} exercício{routine.workout_items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Blocos de exercícios */}
            <div className="space-y-2">
              {blocks.map((block) => {
                if (block.type === 'single') {
                  return <ExerciseBlock key={block.item.id} item={block.item} />
                }
                return (
                  <div key={block.comboGroupId} className="space-y-1">
                    <div className="flex items-center gap-2 px-1">
                      <Link2 size={12} className="text-brand-lime" />
                      <span className="text-[10px] font-bold text-brand-lime tracking-widest">
                        {COMBO_LABEL[block.comboType] ?? block.comboType.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        — execute consecutivamente sem pausa
                      </span>
                    </div>
                    <div className="pl-4 space-y-1 border-l-2 border-brand-lime/30">
                      {block.items.map((item) => (
                        <ExerciseBlock key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
