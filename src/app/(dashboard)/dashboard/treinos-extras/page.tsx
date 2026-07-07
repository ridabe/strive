import { getTenantExtraWorkouts } from '@/actions/extra-workouts'
import { requireAcademiaModuleAccess } from '@/lib/supabase/module-access'
import Link from 'next/link'
import { Dumbbell, Tag, Copy } from 'lucide-react'

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

export default async function TreinosExtrasPage() {
  await requireAcademiaModuleAccess('treinos-extras')
  const workouts = await getTenantExtraWorkouts()
  const templates = workouts.filter((w) => w.is_template)
  const assigned = workouts.filter((w) => !w.is_template)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Treinos Extras
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Treinos avulsos fora do planejamento semanal
          </p>
        </div>
      </div>

      {/* Templates */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Copy size={14} className="text-brand-lime" />
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Templates ({templates.length})
          </h2>
        </div>
        {templates.length === 0 ? (
          <p className="text-sm text-text-secondary py-4">
            Nenhum template criado ainda. Crie um treino na ficha de um aluno e marque como template para reutilizá-lo.
          </p>
        ) : (
          <div className="grid gap-2">
            {templates.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        )}
      </section>

      {/* Treinos atribuídos */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-brand-lime" />
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Treinos atribuídos ({assigned.length})
          </h2>
        </div>
        {assigned.length === 0 ? (
          <p className="text-sm text-text-secondary py-4">
            Nenhum treino extra atribuído. Acesse a ficha de um aluno para criar.
          </p>
        ) : (
          <div className="grid gap-2">
            {assigned.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function WorkoutCard({ workout }: {
  workout: {
    id: string
    name: string
    description: string | null
    category: string
    tags: string[]
    is_template: boolean
    student_id?: string | null
    created_at: string
  }
}) {
  const href = workout.student_id
    ? `/dashboard/alunos/${workout.student_id}/treinos-extras/${workout.id}`
    : `/dashboard/treinos-extras/${workout.id}`

  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-surface border border-surface-border rounded-xl p-4 hover:border-brand-lime/40 transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
        <Dumbbell size={16} className="text-brand-lime" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-text-primary group-hover:text-brand-lime transition-colors truncate">
          {workout.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${CATEGORY_COLOR[workout.category] ?? CATEGORY_COLOR.outros}`}>
            {CATEGORY_LABEL[workout.category] ?? workout.category}
          </span>
          {workout.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 text-[10px] text-text-secondary">
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      </div>
      {workout.is_template && (
        <span className="text-[10px] font-bold text-brand-lime bg-brand-lime/10 border border-brand-lime/20 px-2 py-0.5 rounded-full flex-shrink-0">
          TEMPLATE
        </span>
      )}
    </Link>
  )
}
