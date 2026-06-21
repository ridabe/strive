'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Clock, Target, Link2, Zap, CheckCircle, Film } from 'lucide-react'
import { VideoModal } from '@/components/student/VideoModal'
import { muscleColor } from '@/lib/exercise-config'
import type { WorkoutPlanWithRoutines } from '@/actions/workout-plans'

type WorkoutItem = WorkoutPlanWithRoutines['workout_routines'][number]['workout_items'][number]
type ItemBlock =
  | { type: 'single'; item: WorkoutItem }
  | { type: 'combo'; comboGroupId: string; comboType: string; items: WorkoutItem[] }

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const COMBO_LABEL: Record<string, string> = { biset: 'BI-SET', triset: 'TRI-SET', circuit: 'CIRCUITO' }
const GOAL_COLOR: Record<string, string> = {
  'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Força':          'text-red-400 bg-red-400/10 border-red-400/20',
  'Resistência':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  'Condicionamento':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Reabilitação':   'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

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

function VideoThumbnail({ url, onClick }: { url: string; name: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-28 h-20 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 group"
    >
      <video
        src={url}
        preload="metadata"
        muted
        playsInline
        className="w-full h-full object-cover"
        onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.1 }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/25 transition-colors">
        <div className="w-8 h-8 rounded-full bg-brand-lime flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play size={14} className="text-background ml-0.5" fill="currentColor" />
        </div>
      </div>
    </button>
  )
}

function ExerciseBlock({
  item,
  comboLetter,
  onVideoClick,
}: {
  item: WorkoutItem
  comboLetter?: string
  onVideoClick: (url: string, name: string) => void
}) {
  const ex = item.exercises
  if (!ex) return null

  const countLine =
    item.count_type === 'time'
      ? `${item.sets ?? '?'}× ${item.duration_secs}seg`
      : item.count_type === 'both'
        ? `${item.sets ?? '?'}× ${item.reps} reps / ${item.duration_secs}seg`
        : `${item.sets ?? '?'}× ${item.reps ?? '?'} reps`

  return (
    <div className="bg-background border border-surface-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Info à esquerda */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {comboLetter && (
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-lime text-background text-xs font-bold flex items-center justify-center">
                  {comboLetter}
                </span>
              )}
              <p className="font-body font-semibold text-text-primary leading-snug">{ex.name}</p>
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${muscleColor(ex.muscle_group)}`}>
              {ex.muscle_group}
            </span>
          </div>

          <div className="space-y-1 text-sm text-text-secondary">
            <p><span className="font-semibold text-text-primary">Séries:</span> {countLine}</p>
            {item.load && (
              <p><span className="font-semibold text-text-primary">Carga:</span> {item.load}</p>
            )}
            {item.rest_seconds != null && item.rest_seconds > 0 && (
              <p className="flex items-center gap-1">
                <Clock size={10} />
                <span className="font-semibold text-text-primary">Intervalo:</span> {item.rest_seconds}s
              </p>
            )}
          </div>

          {item.notes && (
            <p className="text-xs text-text-secondary italic border-l-2 border-brand-lime/30 pl-2">
              {item.notes}
            </p>
          )}
        </div>

        {/* Thumbnail à direita */}
        {ex.video_url && (
          <VideoThumbnail
            url={ex.video_url}
            name={ex.name}
            onClick={() => onVideoClick(ex.video_url!, ex.name)}
          />
        )}
      </div>
    </div>
  )
}

export function PlanViewClient({ plan }: { plan: WorkoutPlanWithRoutines }) {
  const searchParams = useSearchParams()
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null)

  const concluded = searchParams.get('concluido') === '1'

  return (
    <div className="p-5 space-y-6">
      <Link
        href="/student/treinos"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Meus treinos
      </Link>

      {concluded && (
        <div className="flex items-center gap-2 bg-status-success/10 border border-status-success/20 rounded-xl px-4 py-3">
          <CheckCircle size={14} className="text-status-success" />
          <p className="text-sm text-status-success font-medium">Treino concluído! Bom trabalho 💪</p>
        </div>
      )}

      {/* Cabeçalho do plano */}
      <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-2">
        <h1 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
          {plan.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          {plan.goal && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
              GOAL_COLOR[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
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
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-1.5 h-5 bg-brand-lime rounded-full flex-shrink-0" />
              <h2 className="font-display font-bold text-text-primary uppercase tracking-widest text-sm">
                {routine.name}
              </h2>
              {routine.day_of_week != null && (
                <span className="text-xs text-text-secondary bg-surface border border-surface-border px-2 py-0.5 rounded-full">
                  {DAY_LABELS[routine.day_of_week]}
                </span>
              )}
              <span className="text-xs text-text-secondary">
                {routine.workout_items.length} exercício{routine.workout_items.length !== 1 ? 's' : ''}
              </span>
              <Link
                href={`/student/treinos/${plan.id}/executar/${routine.id}`}
                className="ml-auto flex items-center gap-1.5 bg-brand-lime text-background font-semibold text-xs px-4 py-2 rounded-xl hover:bg-brand-lime/90 transition-colors"
              >
                <Zap size={12} />
                Iniciar Treino
              </Link>
            </div>

            <div className="space-y-2">
              {blocks.map((block) => {
                if (block.type === 'single') {
                  return (
                    <ExerciseBlock
                      key={block.item.id}
                      item={block.item}
                      onVideoClick={(url, name) => setVideoModal({ url, name })}
                    />
                  )
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
                      {block.items.map((item, idx) => (
                        <ExerciseBlock
                          key={item.id}
                          item={item}
                          comboLetter={String.fromCharCode(65 + idx)}
                          onVideoClick={(url, name) => setVideoModal({ url, name })}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <VideoModal
        open={videoModal !== null}
        onClose={() => setVideoModal(null)}
        videoUrl={videoModal?.url ?? ''}
        exerciseName={videoModal?.name ?? ''}
      />
    </div>
  )
}
