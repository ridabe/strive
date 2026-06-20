import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { muscleColor, loadEmoji, loadLabel, countLabel } from '@/lib/exercise-config'
import { ExerciseForm } from '@/components/exercises/exercise-form'

interface Props { params: Promise<{ id: string }> }

export default async function AdminEditExercicioPage({ params }: Props) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: ex } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .eq('is_global', true)
    .single()

  if (!ex) notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin/banco-de-exercicios" className="hover:text-text-primary transition-colors">
          Banco de Exercícios
        </Link>
        <span>/</span>
        <span className="text-text-primary">{ex.name}</span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${muscleColor(ex.muscle_group)}`}>
            {ex.muscle_group}
          </span>
          <span className="text-xs text-text-secondary">
            {loadEmoji(ex.load_type)} {loadLabel(ex.load_type)} · {countLabel(ex.count_type)}
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          {ex.name}
        </h1>
      </div>

      {ex.video_url && (
        <video src={ex.video_url} controls preload="metadata"
          className="w-full max-h-64 object-contain bg-black rounded-xl" />
      )}

      <ExerciseForm
        isGlobal={true}
        exercise={ex}
        redirectTo="/admin/banco-de-exercicios"
      />
    </div>
  )
}
