import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExerciseForm } from '@/components/exercises/exercise-form'

export default async function NovoExercicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/dashboard')

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/banco-de-exercicios" className="hover:text-text-primary transition-colors">
          Banco de Exercícios
        </Link>
        <span>/</span>
        <span className="text-text-primary">Novo exercício</span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Novo Exercício
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Exercício personalizado — visível apenas para você e seus alunos
        </p>
      </div>

      <ExerciseForm
        isGlobal={false}
        tenantId={profile.tenant_id}
        redirectTo="/dashboard/banco-de-exercicios"
      />
    </div>
  )
}
