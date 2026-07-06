import { notFound } from 'next/navigation'
import { getWorkoutPlan } from '@/actions/workout-plans'
import { getAssignmentsForPlan, getActiveStudentsForTenant } from '@/actions/plan-assignments'
import { WorkoutBuilder } from '../../alunos/[id]/treinos/_components/WorkoutBuilder'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Calendar, Target } from 'lucide-react'
import { PlanAssignPanel } from './plan-assign-panel'
import { PlanDeleteButton } from './plan-delete-button'
import { PlanInfoEditor } from '@/components/dashboard/plan-info-editor'

type Props = { params: Promise<{ planId: string }> }

const GOAL_COLOR: Record<string, string> = {
  'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Força':          'text-red-400 bg-red-400/10 border-red-400/20',
  'Resistência':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  'Condicionamento':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Reabilitação':   'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

export default async function PlanoPage({ params }: Props) {
  const { planId } = await params
  const [plan, assignments, students] = await Promise.all([
    getWorkoutPlan(planId),
    getAssignmentsForPlan(planId),
    getActiveStudentsForTenant(),
  ])
  if (!plan) notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/treinos"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Planos de Treino
        </Link>
        <PlanDeleteButton
          planId={planId}
          planName={plan.name}
          assignedCount={assignments.length}
        />
      </div>

      {/* Cabeçalho */}
      <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={18} className="text-brand-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest truncate">
              {plan.name}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {assignments.length} aluno{assignments.length !== 1 ? 's' : ''} com este plano
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${
            plan.status === 'active'
              ? 'text-status-success bg-status-success/10 border-status-success/20'
              : 'text-text-secondary bg-background border-surface-border'
          }`}>
            {plan.status === 'active' ? 'Ativo' : 'Rascunho'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {plan.goal && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
              GOAL_COLOR[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
            }`}>
              <Target size={10} />
              {plan.goal}
            </span>
          )}
          {(plan.start_date || plan.end_date) && (
            <span className="flex items-center gap-1 text-xs text-text-secondary bg-background border border-surface-border px-2.5 py-1 rounded-full">
              <Calendar size={10} />
              {plan.start_date
                ? new Date(plan.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                : '–'}
              {' → '}
              {plan.end_date
                ? new Date(plan.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                : '–'}
            </span>
          )}
        </div>

        {plan.description && (
          <p className="text-xs text-text-secondary leading-relaxed">{plan.description}</p>
        )}

        <PlanInfoEditor
          planId={plan.id}
          name={plan.name}
          goal={plan.goal}
          description={plan.description}
          startDate={plan.start_date}
          endDate={plan.end_date}
        />
      </div>

      {/* Atribuição de alunos */}
      <PlanAssignPanel
        planId={planId}
        allStudents={students as { id: string; full_name: string; avatar_url: string | null }[]}
        assignments={assignments as { student_id: string; students: unknown }[]}
      />

      {/* Builder de rotinas */}
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
          Rotinas do Plano
        </p>
        <WorkoutBuilder
          planId={plan.id}
          initialRoutines={plan.workout_routines}
          status={plan.status}
        />
      </div>
    </div>
  )
}
