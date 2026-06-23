import { createClient } from '@/lib/supabase/server'
import { UtensilsCrossed, Target, Flame } from 'lucide-react'
import { StudentMealPlanView } from '@/components/meal-plans/StudentMealPlanView'
import type { MealPlanWithMeals } from '@/app/actions/meal-plans'

export default async function StudentPlanosAlimentaresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const assignments = student
    ? (await supabase
        .from('student_meal_plan_assignments')
        .select(`
          meal_plans (
            id, tenant_id, name, goal, description, daily_calories, status, created_at,
            meal_plan_meals (
              id, name, meal_type, suggested_time, sort_order, notes,
              meal_plan_foods (
                id, quantity, sort_order, notes,
                food_items ( id, name, category, portion_grams, calories, protein_g, carbs_g, fat_g, fiber_g )
              )
            )
          )
        `)
        .eq('student_id', student.id)
        .eq('status', 'active')).data ?? []
    : []

  const plans = assignments
    .map((a) => {
      const p = Array.isArray(a.meal_plans) ? a.meal_plans[0] : a.meal_plans
      return p as unknown as MealPlanWithMeals | null
    })
    .filter((p): p is MealPlanWithMeals => p !== null && p.status === 'active')
    .map((p) => ({
      ...p,
      meals: (p.meals ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => ({
          ...m,
          meal_plan_foods: (m.meal_plan_foods ?? []).sort((a, b) => a.sort_order - b.sort_order),
        })),
    }))

  const GOAL_COLOR: Record<string, string> = {
    'Emagrecimento': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'Hipertrofia':   'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Manutenção':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
    'Saúde Geral':   'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'Performance':   'text-red-400 bg-red-400/10 border-red-400/20',
    'Vegetariano':   'text-green-400 bg-green-400/10 border-green-400/20',
  }

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
          Planos Alimentares
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {plans.length} plano{plans.length !== 1 ? 's' : ''} ativo{plans.length !== 1 ? 's' : ''}
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center space-y-3">
          <UtensilsCrossed size={32} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Nenhum plano alimentar ativo</p>
          <p className="text-sm text-text-secondary">
            Aguarde seu personal trainer atribuir um plano para você.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <div key={plan.id} className="space-y-3">
              <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed size={16} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-text-primary truncate">{plan.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {plan.goal && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                          GOAL_COLOR[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
                        }`}>
                          <Target size={8} />
                          {plan.goal}
                        </span>
                      )}
                      {plan.daily_calories && (
                        <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                          <Flame size={9} />
                          Meta: {plan.daily_calories} kcal/dia
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {plan.description && (
                  <p className="text-xs text-text-secondary leading-relaxed">{plan.description}</p>
                )}
              </div>

              <StudentMealPlanView meals={plan.meals} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
