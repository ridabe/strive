import { notFound } from 'next/navigation'
import { getMealPlan, getAssignmentsForMealPlan, getActiveStudentsForMealPlan } from '@/app/actions/meal-plans'
import { getFoodItems } from '@/app/actions/food-items'
import { MealPlanEditor } from '@/components/meal-plans/MealPlanEditor'
import { MealPlanAssignPanel } from '@/components/meal-plans/MealPlanAssignPanel'
import Link from 'next/link'
import { ArrowLeft, UtensilsCrossed, Target, Flame } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

const GOAL_COLOR: Record<string, string> = {
  'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Manutenção':     'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  'Saúde Geral':    'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Performance':    'text-red-400 bg-red-400/10 border-red-400/20',
  'Vegetariano':    'text-green-400 bg-green-400/10 border-green-400/20',
}

export default async function PlanoAlimentarPage({ params }: Props) {
  const { id } = await params
  const [plan, assignments, students, foodItems] = await Promise.all([
    getMealPlan(id),
    getAssignmentsForMealPlan(id),
    getActiveStudentsForMealPlan(),
    getFoodItems(),
  ])
  if (!plan) notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <Link
        href="/dashboard/planos-alimentares"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Planos Alimentares
      </Link>

      {/* Cabeçalho */}
      <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed size={18} className="text-green-400" />
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
          {plan.daily_calories && (
            <span className="flex items-center gap-1 text-xs text-text-secondary bg-background border border-surface-border px-2.5 py-1 rounded-full">
              <Flame size={10} />
              Meta: {plan.daily_calories} kcal/dia
            </span>
          )}
        </div>

        {plan.description && (
          <p className="text-xs text-text-secondary leading-relaxed">{plan.description}</p>
        )}
      </div>

      {/* Atribuição de alunos */}
      <MealPlanAssignPanel
        planId={id}
        allStudents={students as { id: string; full_name: string; avatar_url: string | null }[]}
        assignments={assignments as { student_id: string; students: unknown }[]}
      />

      {/* Editor de refeições */}
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
          Refeições do Plano
        </p>
        <MealPlanEditor
          planId={plan.id}
          initialMeals={plan.meals}
          foodItems={foodItems}
          status={plan.status}
        />
      </div>
    </div>
  )
}
