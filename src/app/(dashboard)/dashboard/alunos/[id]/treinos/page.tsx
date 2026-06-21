import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Target, Calendar, UserPlus } from 'lucide-react'
import { StudentPlanAssignPanel } from './_components/StudentPlanAssignPanel'

type Props = { params: Promise<{ id: string }> }

const GOAL_COLOR: Record<string, string> = {
  'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Força':          'text-red-400 bg-red-400/10 border-red-400/20',
  'Resistência':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  'Condicionamento':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Reabilitação':   'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

export default async function AlunoTreinosPage({ params }: Props) {
  const { id: studentId } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('id', studentId)
    .single()

  if (!student) notFound()

  // Planos atribuídos a este aluno
  const { data: assignments } = await supabase
    .from('student_plan_assignments')
    .select(`
      id, status, assigned_at,
      workout_plans ( id, name, goal, status, start_date, end_date )
    `)
    .eq('student_id', studentId)
    .order('assigned_at', { ascending: false })

  // Planos disponíveis mas NÃO atribuídos a este aluno
  const assignedPlanIds = (assignments ?? [])
    .map((a) => {
      const p = Array.isArray(a.workout_plans) ? a.workout_plans[0] : a.workout_plans
      return (p as { id: string } | null)?.id
    })
    .filter(Boolean) as string[]

  let availableQuery = supabase
    .from('workout_plans')
    .select('id, name, goal, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (assignedPlanIds.length > 0) {
    availableQuery = availableQuery.not('id', 'in', `(${assignedPlanIds.join(',')})`)
  }

  const { data: availablePlans } = await availableQuery

  const assignedPlans = (assignments ?? []).map((a) => {
    const plan = Array.isArray(a.workout_plans) ? a.workout_plans[0] : a.workout_plans
    return {
      assignmentId: a.id,
      assignmentStatus: a.status,
      plan: plan as {
        id: string; name: string; goal: string | null;
        status: string; start_date: string | null; end_date: string | null
      } | null,
    }
  }).filter((a) => a.plan !== null)

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {student.full_name}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Planos de Treino
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{student.full_name}</p>
        </div>
        <Link
          href="/dashboard/treinos/novo"
          className="flex items-center gap-2 border border-surface-border text-text-secondary font-body text-sm px-3 py-2 rounded-lg hover:text-text-primary hover:border-brand-lime/40 transition-colors flex-shrink-0"
        >
          <ClipboardList size={14} />
          Gerenciar Planos
        </Link>
      </div>

      {/* Planos atribuídos */}
      {assignedPlans.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-10 text-center space-y-3">
          <ClipboardList size={32} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Nenhum plano atribuído</p>
          <p className="text-sm text-text-secondary">
            Atribua um plano existente ou{' '}
            <Link href="/dashboard/treinos/novo" className="text-brand-lime hover:underline">
              crie um novo
            </Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignedPlans.map(({ assignmentId, plan }) => {
            if (!plan) return null
            return (
              <Link
                key={assignmentId}
                href={`/dashboard/treinos/${plan.id}`}
                className="flex items-center gap-4 bg-surface border border-surface-border rounded-2xl p-4 hover:border-brand-lime/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-body font-medium text-text-primary truncate group-hover:text-brand-lime transition-colors">
                    {plan.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {plan.goal && (
                      <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                        GOAL_COLOR[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
                      }`}>
                        <Target size={9} />
                        {plan.goal}
                      </span>
                    )}
                    {plan.start_date && (
                      <span className="flex items-center gap-1 text-[10px] text-text-secondary bg-background border border-surface-border px-1.5 py-0.5 rounded-md">
                        <Calendar size={9} />
                        {new Date(plan.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${
                  plan.status === 'active'
                    ? 'text-status-success bg-status-success/10 border-status-success/20'
                    : 'text-text-secondary bg-background border-surface-border'
                }`}>
                  {plan.status === 'active' ? 'Ativo' : 'Rascunho'}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Atribuir plano existente */}
      {(availablePlans?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus size={14} className="text-text-secondary" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Atribuir plano existente
            </p>
          </div>
          <StudentPlanAssignPanel
            studentId={studentId}
            availablePlans={(availablePlans ?? []) as { id: string; name: string; goal: string | null; status: string }[]}
          />
        </div>
      )}
    </div>
  )
}
