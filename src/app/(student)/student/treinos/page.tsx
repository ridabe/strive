import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardList, Target, Calendar, ChevronRight } from 'lucide-react'

export default async function StudentTreinosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Planos atribuídos e ativos para este aluno
  const assignments = student
    ? (await supabase
        .from('student_plan_assignments')
        .select(`
          workout_plans ( id, name, goal, status, start_date, end_date )
        `)
        .eq('student_id', student.id)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false })).data ?? []
    : []

  const plans = assignments
    .map((a) => {
      const p = Array.isArray(a.workout_plans) ? a.workout_plans[0] : a.workout_plans
      return p as { id: string; name: string; goal: string | null; status: string; start_date: string | null; end_date: string | null } | null
    })
    .filter((p): p is NonNullable<typeof p> => p !== null && p.status === 'active')

  const goalColor: Record<string, string> = {
    'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'Força':          'text-red-400 bg-red-400/10 border-red-400/20',
    'Resistência':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
    'Condicionamento':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'Reabilitação':   'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
          Meus Treinos
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {plans.length} plano{plans.length !== 1 ? 's' : ''} ativo{plans.length !== 1 ? 's' : ''}
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center space-y-3">
          <ClipboardList size={32} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Nenhum plano ativo</p>
          <p className="text-sm text-text-secondary">
            Aguarde seu personal trainer atribuir um plano para você.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/student/treinos/${plan.id}`}
              className="flex items-center gap-4 bg-surface border border-surface-border rounded-2xl p-4 hover:border-brand-lime/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-body font-medium text-text-primary truncate group-hover:text-brand-lime transition-colors">
                  {plan.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.goal && (
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                      goalColor[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
                    }`}>
                      <Target size={9} />
                      {plan.goal}
                    </span>
                  )}
                  {plan.start_date && (
                    <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                      <Calendar size={9} />
                      {new Date(plan.start_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
