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

export type FoodItem = {
  id: string
  name: string
  category: string
  portion_grams: number
  portion_label: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  is_global: boolean
}

export async function getFoodItems(): Promise<FoodItem[]> {
  const ctx = await getCtx()
  if (!ctx) return []
  const { data } = await ctx.supabase
    .from('food_items')
    .select('id, name, category, portion_grams, portion_label, calories, protein_g, carbs_g, fat_g, fiber_g, is_global')
    .or(`tenant_id.eq.${ctx.tenantId},is_global.eq.true`)
    .order('name')
  return (data ?? []) as FoodItem[]
}

export async function createFoodItem(formData: FormData) {
  const ctx = await getCtx()
  if (!ctx || ctx.role !== 'personal') return { error: 'Não autorizado' }

  const name     = (formData.get('name') as string | null)?.trim()
  const category = formData.get('category') as string | null
  if (!name || !category) return { error: 'Nome e categoria são obrigatórios' }

  const portionGrams = formData.get('portion_grams') ? Number(formData.get('portion_grams')) : 100
  const portionLabel = (formData.get('portion_label') as string | null) || `${portionGrams}g`

  const { data, error } = await ctx.supabase
    .from('food_items')
    .insert({
      tenant_id:    ctx.tenantId,
      name,
      category,
      portion_grams: portionGrams,
      portion_label: portionLabel,
      calories:     Number(formData.get('calories')   ?? 0),
      protein_g:    Number(formData.get('protein_g')  ?? 0),
      carbs_g:      Number(formData.get('carbs_g')    ?? 0),
      fat_g:        Number(formData.get('fat_g')      ?? 0),
      fiber_g:      Number(formData.get('fiber_g')    ?? 0),
      is_global:    false,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/planos-alimentares')
  return { success: true, id: data.id }
}

export async function updateFoodItem(id: string, formData: FormData) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const portionGrams = formData.get('portion_grams') ? Number(formData.get('portion_grams')) : 100
  const portionLabel = (formData.get('portion_label') as string | null) || `${portionGrams}g`

  const { error } = await ctx.supabase
    .from('food_items')
    .update({
      name:          (formData.get('name') as string).trim(),
      category:      formData.get('category') as string,
      portion_grams: portionGrams,
      portion_label: portionLabel,
      calories:      Number(formData.get('calories')  ?? 0),
      protein_g:     Number(formData.get('protein_g') ?? 0),
      carbs_g:       Number(formData.get('carbs_g')   ?? 0),
      fat_g:         Number(formData.get('fat_g')     ?? 0),
      fiber_g:       Number(formData.get('fiber_g')   ?? 0),
    })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/planos-alimentares')
  return { success: true }
}

export async function deleteFoodItem(id: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('food_items')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/planos-alimentares')
  return { success: true }
}
