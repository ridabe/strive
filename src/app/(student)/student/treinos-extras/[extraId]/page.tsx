import { notFound } from 'next/navigation'
import { getExtraWorkout } from '@/actions/extra-workouts'
import Link from 'next/link'
import { ArrowLeft, Dumbbell, Clock, Link2, Tag, Zap } from 'lucide-react'
import { muscleColor } from '@/lib/exercise-config'
import type { ExtraWorkoutItemData } from '@/actions/extra-workouts'
import { VideoPreviewButton } from '@/components/exercises/VideoPreviewButton'

type Props = { params: Promise<{ extraId: string }> }

type ItemBlock =
  | { type: 'single'; item: ExtraWorkoutItemData }
  | { type: 'combo'; comboGroupId: string; comboType: string; items: ExtraWorkoutItemData[] }

function groupItemsByCombo(items: ExtraWorkoutItemData[]): ItemBlock[] {
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

const COMBO_LABEL: Record<string, string> = { biset: 'BI-SET', triset: 'TRI-SET', circuit: 'CIRCUITO' }

const CATEGORY_LABEL: Record<string, string> = {
  aquecimento: 'Aquecimento',
  hiit: 'HIIT',
  mobilidade: 'Mobilidade',
  cardio: 'Cardio',
  desafio: 'Desafio',
  forca: 'Força',
  outros: 'Outros',
}

const CATEGORY_COLOR: Record<string, string> = {
  aquecimento: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  hiit: 'text-red-400 bg-red-400/10 border-red-400/20',
  mobilidade: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  cardio: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  desafio: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  forca: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  outros: 'text-text-secondary bg-background border-surface-border',
}

function ExerciseBlock({ item }: { item: ExtraWorkoutItemData }) {
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
        <VideoPreviewButton url={ex.video_url} name={ex.name} label="Ver demonstração" />
      )}
    </div>
  )
}

export default async function StudentExtraWorkoutPage({ params }: Props) {
  const { extraId } = await params
  const workout = await getExtraWorkout(extraId)
  if (!workout) notFound()

  const blocks = groupItemsByCombo(workout.extra_workout_items)

  return (
    <div className="p-5 space-y-6">
      <Link
        href="/student/treinos-extras"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Treinos extras
      </Link>

      {/* Cabeçalho */}
      <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-brand-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
              {workout.name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${CATEGORY_COLOR[workout.category] ?? CATEGORY_COLOR.outros}`}>
                {CATEGORY_LABEL[workout.category] ?? workout.category}
              </span>
              {workout.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-[10px] text-text-secondary">
                  <Tag size={9} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        {workout.description && (
          <p className="text-xs text-text-secondary leading-relaxed">{workout.description}</p>
        )}
      </div>

      {/* Exercícios */}
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
}
