import { createClient } from '@/lib/supabase/server'
import { getActiveStudentRow } from '@/lib/supabase/student-context'
import Link from 'next/link'
import { Zap, Tag } from 'lucide-react'

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

export default async function StudentTreinosExtrasPage() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()

  let workouts: {
    id: string
    name: string
    description: string | null
    category: string
    tags: string[]
    created_at: string
  }[] = []

  if (user.user) {
    const student = await getActiveStudentRow(supabase, user.user.id)

    if (student) {
      const { data } = await supabase
        .from('extra_workouts')
        .select('id, name, description, category, tags, created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })

      workouts = data ?? []
    }
  }

  return (
    <div className="p-5 space-y-6">
      <div>
        <h1 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
          Treinos Extras
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Treinos complementares do seu personal
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center">
            <Zap size={22} className="text-text-secondary" />
          </div>
          <p className="text-sm text-text-secondary">Nenhum treino extra disponível ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <Link
              key={w.id}
              href={`/student/treinos-extras/${w.id}`}
              className="flex items-center gap-4 bg-surface border border-surface-border rounded-xl p-4 hover:border-brand-lime/40 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-brand-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-text-primary group-hover:text-brand-lime transition-colors truncate">
                  {w.name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${CATEGORY_COLOR[w.category] ?? CATEGORY_COLOR.outros}`}>
                    {CATEGORY_LABEL[w.category] ?? w.category}
                  </span>
                  {w.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 text-[10px] text-text-secondary">
                      <Tag size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
