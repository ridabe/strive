'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return null
  return { supabase, tenantId: profile.tenant_id, role: profile.role as string }
}

const BASE_PATH = '/dashboard/planos-alimentares'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MealFood = {
  id: string
  quantity: number
  sort_order: number
  notes: string | null
  food_items: {
    id: string
    name: string
    category: string
    portion_grams: number
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
  } | null
}

export type Meal = {
  id: string
  name: string
  meal_type: string
  suggested_time: string | null
  sort_order: number
  notes: string | null
  meal_plan_foods: MealFood[]
}

export type MealPlanWithMeals = {
  id: string
  tenant_id: string
  name: string
  goal: string | null
  description: string | null
  daily_calories: number | null
  status: string
  created_at: string
  meals: Meal[]
}

export type MealPlanSummary = {
  id: string
  name: string
  goal: string | null
  status: string
  created_at: string
  student_meal_plan_assignments: { student_id: string }[]
}

// ─── Meal Plans ───────────────────────────────────────────────────────────────

export async function getMealPlans(): Promise<MealPlanSummary[]> {
  const ctx = await getCtx()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('meal_plans')
    .select('id, name, goal, status, created_at, student_meal_plan_assignments ( student_id )')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
  return (data ?? []) as MealPlanSummary[]
}

export async function getMealPlan(id: string): Promise<MealPlanWithMeals | null> {
  const ctx = await getCtx()
  if (!ctx) return null

  const { data, error } = await ctx.supabase
    .from('meal_plans')
    .select(`
      id, tenant_id, name, goal, description, daily_calories, status, created_at,
      meal_plan_meals (
        id, name, meal_type, suggested_time, sort_order, notes,
        meal_plan_foods (
          id, quantity, sort_order, notes,
          food_items ( id, name, category, portion_grams, calories, protein_g, carbs_g, fat_g, fiber_g )
        )
      )
    `)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .single()

  if (error || !data) return null

  const raw = data as unknown as {
    id: string; tenant_id: string; name: string; goal: string | null
    description: string | null; daily_calories: number | null; status: string; created_at: string
    meal_plan_meals: Meal[]
  }

  return {
    ...raw,
    meals: (raw.meal_plan_meals ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        ...m,
        meal_plan_foods: (m.meal_plan_foods ?? []).sort((a, b) => a.sort_order - b.sort_order),
      })),
  }
}

export async function createMealPlan(formData: FormData) {
  const ctx = await getCtx()
  if (!ctx || ctx.role !== 'personal') return { error: 'Não autorizado' }

  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { error: 'Nome é obrigatório' }

  const calRaw = formData.get('daily_calories') as string | null

  const { data, error } = await ctx.supabase
    .from('meal_plans')
    .insert({
      tenant_id:      ctx.tenantId,
      name,
      goal:           (formData.get('goal') as string | null) || null,
      description:    (formData.get('description') as string | null) || null,
      daily_calories: calRaw ? Number(calRaw) : null,
      status:         'inactive',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(BASE_PATH)
  return { planId: data.id }
}

export async function updateMealPlan(id: string, formData: FormData) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const calRaw = formData.get('daily_calories') as string | null

  const { error } = await ctx.supabase
    .from('meal_plans')
    .update({
      name:           (formData.get('name') as string).trim(),
      goal:           (formData.get('goal') as string | null) || null,
      description:    (formData.get('description') as string | null) || null,
      daily_calories: calRaw ? Number(calRaw) : null,
    })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(BASE_PATH)
  revalidatePath(`${BASE_PATH}/${id}`)
  return { success: true }
}

export async function publishMealPlan(id: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('meal_plans')
    .update({ status: 'active' })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${id}`)
  revalidatePath(BASE_PATH)
  return { success: true }
}

export async function deactivateMealPlan(id: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('meal_plans')
    .update({ status: 'inactive' })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${id}`)
  revalidatePath(BASE_PATH)
  return { success: true }
}

export async function deleteMealPlan(id: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('meal_plans')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(BASE_PATH)
  return { success: true }
}

// ─── Meals (meal_plan_meals) ──────────────────────────────────────────────────

export async function addMeal(
  planId: string,
  name: string,
  mealType: string,
  suggestedTime: string | null,
  notes: string | null,
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: existing } = await ctx.supabase
    .from('meal_plan_meals')
    .select('sort_order')
    .eq('meal_plan_id', planId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0]?.sort_order ?? -1) as number) + 1

  const { data, error } = await ctx.supabase
    .from('meal_plan_meals')
    .insert({
      meal_plan_id:   planId,
      tenant_id:      ctx.tenantId,
      name:           name.trim(),
      meal_type:      mealType || 'outro',
      suggested_time: suggestedTime || null,
      notes:          notes || null,
      sort_order:     nextOrder,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${planId}`)
  return { success: true, id: data.id }
}

export async function updateMeal(
  id: string,
  planId: string,
  name: string,
  mealType: string,
  suggestedTime: string | null,
  notes: string | null,
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('meal_plan_meals')
    .update({
      name:           name.trim(),
      meal_type:      mealType || 'outro',
      suggested_time: suggestedTime || null,
      notes:          notes || null,
    })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${planId}`)
  return { success: true }
}

export async function deleteMeal(id: string, planId: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('meal_plan_meals')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${planId}`)
  return { success: true }
}

// ─── Meal Foods (meal_plan_foods) ─────────────────────────────────────────────

export async function addMealFood(
  mealId: string,
  foodItemId: string,
  quantity: number,
  planId: string,
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: existing } = await ctx.supabase
    .from('meal_plan_foods')
    .select('sort_order')
    .eq('meal_id', mealId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0]?.sort_order ?? -1) as number) + 1

  // Busca valores nutricionais do alimento para pré-calcular
  const { data: food } = await ctx.supabase
    .from('food_items')
    .select('calories, protein_g, carbs_g, fat_g, fiber_g, portion_grams')
    .eq('id', foodItemId)
    .single()

  const factor   = food ? quantity / food.portion_grams : 0
  const calories = food ? Number((food.calories  * factor).toFixed(2)) : 0
  const protein  = food ? Number((food.protein_g * factor).toFixed(2)) : 0
  const carbs    = food ? Number((food.carbs_g   * factor).toFixed(2)) : 0
  const fat      = food ? Number((food.fat_g     * factor).toFixed(2)) : 0
  const fiber    = food ? Number((food.fiber_g   * factor).toFixed(2)) : 0

  const { data, error } = await ctx.supabase
    .from('meal_plan_foods')
    .insert({
      meal_id:      mealId,
      tenant_id:    ctx.tenantId,
      food_item_id: foodItemId,
      quantity,
      sort_order:   nextOrder,
      calories,
      protein_g:    protein,
      carbs_g:      carbs,
      fat_g:        fat,
      fiber_g:      fiber,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${planId}`)
  return { success: true, id: data.id }
}

export async function updateMealFoodQuantity(
  id: string,
  foodItemId: string,
  quantity: number,
  planId: string,
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { data: food } = await ctx.supabase
    .from('food_items')
    .select('calories, protein_g, carbs_g, fat_g, fiber_g, portion_grams')
    .eq('id', foodItemId)
    .single()

  const factor   = food ? quantity / food.portion_grams : 0
  const calories = food ? Number((food.calories  * factor).toFixed(2)) : 0
  const protein  = food ? Number((food.protein_g * factor).toFixed(2)) : 0
  const carbs    = food ? Number((food.carbs_g   * factor).toFixed(2)) : 0
  const fat      = food ? Number((food.fat_g     * factor).toFixed(2)) : 0
  const fiber    = food ? Number((food.fiber_g   * factor).toFixed(2)) : 0

  const { error } = await ctx.supabase
    .from('meal_plan_foods')
    .update({ quantity, calories, protein_g: protein, carbs_g: carbs, fat_g: fat, fiber_g: fiber })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${planId}`)
  return { success: true }
}

export async function deleteMealFood(id: string, planId: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('meal_plan_foods')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`${BASE_PATH}/${planId}`)
  return { success: true }
}

// ─── Batch save — substitui todos os alimentos de uma refeição de uma vez ─────

export async function replaceMealFoods(
  mealId: string,
  planId: string,
  foods: { foodItemId: string; quantity: number; sortOrder: number }[],
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  // Remove todos os alimentos existentes desta refeição
  const { error: delErr } = await ctx.supabase
    .from('meal_plan_foods')
    .delete()
    .eq('meal_id', mealId)

  if (delErr) return { error: delErr.message }

  if (foods.length === 0) {
    revalidatePath(`${BASE_PATH}/${planId}`)
    return { success: true }
  }

  // Busca dados nutricionais de todos os alimentos de uma vez
  const foodIds = [...new Set(foods.map((f) => f.foodItemId))]
  const { data: foodData } = await ctx.supabase
    .from('food_items')
    .select('id, calories, protein_g, carbs_g, fat_g, fiber_g, portion_grams')
    .in('id', foodIds)

  const foodMap = new Map((foodData ?? []).map((f) => [f.id, f]))

  const rows = foods.map((f) => {
    const fi     = foodMap.get(f.foodItemId)
    const factor = fi ? f.quantity / fi.portion_grams : 0
    return {
      meal_id:      mealId,
      tenant_id:    ctx.tenantId,
      food_item_id: f.foodItemId,
      quantity:     f.quantity,
      sort_order:   f.sortOrder,
      calories:     fi ? Number((fi.calories  * factor).toFixed(2)) : 0,
      protein_g:    fi ? Number((fi.protein_g * factor).toFixed(2)) : 0,
      carbs_g:      fi ? Number((fi.carbs_g   * factor).toFixed(2)) : 0,
      fat_g:        fi ? Number((fi.fat_g     * factor).toFixed(2)) : 0,
      fiber_g:      fi ? Number((fi.fiber_g   * factor).toFixed(2)) : 0,
    }
  })

  const { error: insErr } = await ctx.supabase
    .from('meal_plan_foods')
    .insert(rows)

  if (insErr) return { error: insErr.message }

  revalidatePath(`${BASE_PATH}/${planId}`)
  return { success: true }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function getAssignmentsForMealPlan(planId: string) {
  const ctx = await getCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('student_meal_plan_assignments')
    .select('id, student_id, status, assigned_at, students ( full_name, avatar_url )')
    .eq('meal_plan_id', planId)
    .eq('tenant_id', ctx.tenantId)
    .order('assigned_at', { ascending: false })

  return data ?? []
}

export async function getActiveStudentsForMealPlan() {
  const ctx = await getCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('students')
    .select('id, full_name, avatar_url')
    .eq('tenant_id', ctx.tenantId)
    .eq('status', 'active')
    .order('full_name')

  return data ?? []
}

export async function assignMealPlanToStudents(planId: string, studentIds: string[]) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autorizado' }
  if (studentIds.length === 0) return { error: 'Selecione ao menos um aluno' }

  const rows = studentIds.map((studentId) => ({
    meal_plan_id: planId,
    student_id:   studentId,
    tenant_id:    ctx.tenantId,
    status:       'active',
  }))

  const { error } = await ctx.supabase
    .from('student_meal_plan_assignments')
    .upsert(rows, { onConflict: 'meal_plan_id,student_id' })

  if (error) return { error: error.message }
  revalidatePath(BASE_PATH)
  return { success: true }
}

export async function removeMealPlanAssignment(planId: string, studentId: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const { error } = await ctx.supabase
    .from('student_meal_plan_assignments')
    .delete()
    .eq('meal_plan_id', planId)
    .eq('student_id', studentId)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(BASE_PATH)
  return { success: true }
}

export async function getStudentMealPlans(studentId: string): Promise<MealPlanWithMeals[]> {
  const ctx = await getCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
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
    .eq('student_id', studentId)
    .eq('status', 'active')

  return (data ?? [])
    .map((a) => {
      const plan = Array.isArray(a.meal_plans) ? a.meal_plans[0] : a.meal_plans
      return plan as unknown as MealPlanWithMeals | null
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
}
