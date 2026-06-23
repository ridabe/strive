'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import type { Meal, MealFood } from '@/app/actions/meal-plans'

function fmt(n: number) { return n.toFixed(1) }

function calcNutrition(foods: MealFood[]) {
  return foods.reduce(
    (acc, f) => {
      if (!f.food_items) return acc
      const factor = f.quantity / f.food_items.portion_grams
      return {
        calories: acc.calories + f.food_items.calories  * factor,
        protein:  acc.protein  + f.food_items.protein_g * factor,
        carbs:    acc.carbs    + f.food_items.carbs_g   * factor,
        fat:      acc.fat      + f.food_items.fat_g     * factor,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_da_manha: 'Café da Manhã',
  lanche_manha:  'Lanche da Manhã',
  almoco:        'Almoço',
  lanche_tarde:  'Lanche da Tarde',
  jantar:        'Jantar',
  ceia:          'Ceia',
  pre_treino:    'Pré-Treino',
  pos_treino:    'Pós-Treino',
  outro:         'Outro',
}

type Props = { meals: Meal[] }

export function StudentMealPlanView({ meals }: Props) {
  const [openMeals, setOpenMeals] = useState<Record<string, boolean>>(
    () => Object.fromEntries(meals.map((m) => [m.id, true])),
  )

  function toggle(id: string) {
    setOpenMeals((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const totalNutrition = meals.reduce(
    (acc, meal) => {
      const n = calcNutrition(meal.meal_plan_foods)
      return { calories: acc.calories + n.calories, protein: acc.protein + n.protein, carbs: acc.carbs + n.carbs, fat: acc.fat + n.fat }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  if (meals.length === 0) {
    return (
      <p className="text-xs text-text-secondary text-center py-4">
        Nenhuma refeição cadastrada neste plano ainda.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => {
        const isOpen    = openMeals[meal.id] ?? true
        const nutrition = calcNutrition(meal.meal_plan_foods)

        return (
          <div key={meal.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
            <button
              onClick={() => toggle(meal.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-border/20 transition-colors"
            >
              {isOpen
                ? <ChevronUp size={14} className="text-text-secondary flex-shrink-0" />
                : <ChevronDown size={14} className="text-text-secondary flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-sm text-text-primary">{meal.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-secondary">{MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}</span>
                  {meal.suggested_time && (
                    <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                      <Clock size={9} />
                      {meal.suggested_time}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-text-secondary flex-shrink-0">{fmt(nutrition.calories)} kcal</span>
            </button>

            {isOpen && (
              <div className="border-t border-surface-border/50">
                {meal.meal_plan_foods.length === 0 ? (
                  <p className="text-xs text-text-secondary text-center py-4 px-4">
                    Nenhum alimento nesta refeição.
                  </p>
                ) : (
                  <>
                    <div className="divide-y divide-surface-border/40">
                      {meal.meal_plan_foods.map((f) => {
                        const food = f.food_items
                        if (!food) return null
                        const factor   = f.quantity / food.portion_grams
                        const itemKcal = food.calories  * factor
                        const itemProt = food.protein_g * factor
                        const itemCarb = food.carbs_g   * factor
                        const itemFat  = food.fat_g     * factor
                        return (
                          <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text-primary">{food.name}</p>
                              <p className="text-[10px] text-text-secondary">
                                {fmt(itemKcal)} kcal · P {fmt(itemProt)}g · C {fmt(itemCarb)}g · G {fmt(itemFat)}g
                              </p>
                            </div>
                            <span className="text-[10px] font-medium text-text-secondary flex-shrink-0 bg-background border border-surface-border px-2 py-0.5 rounded-lg">
                              {f.quantity}g
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="px-4 py-2.5 bg-background border-t border-surface-border/40 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[10px] font-bold text-orange-400">{fmt(nutrition.calories)}</p>
                        <p className="text-[9px] text-text-secondary">kcal</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-400">{fmt(nutrition.protein)}g</p>
                        <p className="text-[9px] text-text-secondary">Prot</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-yellow-400">{fmt(nutrition.carbs)}g</p>
                        <p className="text-[9px] text-text-secondary">Carbs</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-red-400">{fmt(nutrition.fat)}g</p>
                        <p className="text-[9px] text-text-secondary">Gord</p>
                      </div>
                    </div>
                  </>
                )}
                {meal.notes && (
                  <p className="text-[10px] text-text-secondary px-4 pb-3 italic">{meal.notes}</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Grand total */}
      <div className="bg-surface border border-surface-border rounded-xl p-4">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Total do Dia</p>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="font-body font-bold text-lg text-orange-400">{fmt(totalNutrition.calories)}</p>
            <p className="text-[10px] text-text-secondary">kcal</p>
          </div>
          <div>
            <p className="font-body font-bold text-lg text-blue-400">{fmt(totalNutrition.protein)}g</p>
            <p className="text-[10px] text-text-secondary">Proteína</p>
          </div>
          <div>
            <p className="font-body font-bold text-lg text-yellow-400">{fmt(totalNutrition.carbs)}g</p>
            <p className="text-[10px] text-text-secondary">Carboidrato</p>
          </div>
          <div>
            <p className="font-body font-bold text-lg text-red-400">{fmt(totalNutrition.fat)}g</p>
            <p className="text-[10px] text-text-secondary">Gordura</p>
          </div>
        </div>
      </div>
    </div>
  )
}
