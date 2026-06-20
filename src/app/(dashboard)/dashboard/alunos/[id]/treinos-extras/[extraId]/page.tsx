import { notFound } from 'next/navigation'
import { getExtraWorkout } from '@/actions/extra-workouts'
import { ExtraWorkoutBuilder } from '../_components/ExtraWorkoutBuilder'
import Link from 'next/link'
import { ArrowLeft, Zap, Tag } from 'lucide-react'

type Props = { params: Promise<{ id: string; extraId: string }> }

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

export default async function TreinoExtraPage({ params }: Props) {
  const { id: studentId, extraId } = await params
  const workout = await getExtraWorkout(extraId)
  if (!workout) notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para o aluno
      </Link>

      {/* Cabeçalho */}
      <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-brand-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest truncate">
              {workout.name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${CATEGORY_COLOR[workout.category] ?? CATEGORY_COLOR.outros}`}>
                {CATEGORY_LABEL[workout.category] ?? workout.category}
              </span>
              {workout.is_template && (
                <span className="text-[10px] font-bold text-brand-lime bg-brand-lime/10 border border-brand-lime/20 px-1.5 py-0.5 rounded-md">
                  TEMPLATE
                </span>
              )}
            </div>
          </div>
        </div>

        {workout.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {workout.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs text-text-secondary bg-background border border-surface-border px-2 py-0.5 rounded-full">
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {workout.description && (
          <p className="text-xs text-text-secondary leading-relaxed">{workout.description}</p>
        )}
      </div>

      {/* Builder */}
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
          Exercícios do Treino
        </p>
        <ExtraWorkoutBuilder
          extraWorkoutId={workout.id}
          initialItems={workout.extra_workout_items}
        />
      </div>
    </div>
  )
}
