'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCtx } from '@/lib/supabase/context'

export async function createRoutine(
  planId: string,
  name: string,
  displayOrder: number,
  daysOfWeek?: number[] | null,
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }
  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('workout_routines')
    .insert({
      workout_plan_id: planId,
      tenant_id: tenantId,
      name,
      display_order: displayOrder,
      days_of_week: daysOfWeek?.length ? daysOfWeek : null,
    })
    .select('id, name, days_of_week, display_order, notes')
    .single()

  if (error) return { error: error.message }
  return { routine: data }
}

export async function updateRoutine(
  routineId: string,
  fields: { name?: string; days_of_week?: number[] | null; notes?: string | null }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_routines')
    .update(fields)
    .eq('id', routineId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteRoutine(routineId: string, planId: string, studentId?: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_routines')
    .delete()
    .eq('id', routineId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/treinos')
  if (studentId) revalidatePath(`/dashboard/alunos/${studentId}/treinos/${planId}`)
  return { success: true }
}

export async function reorderRoutines(
  planId: string,
  studentId: string | undefined,
  orderedIds: string[]
) {
  const supabase = await createClient()
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('workout_routines')
      .update({ display_order: index })
      .eq('id', id)
      .eq('workout_plan_id', planId)
  )
  const results = await Promise.all(updates)
  const failed  = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/dashboard/treinos')
  if (studentId) revalidatePath(`/dashboard/alunos/${studentId}/treinos/${planId}`)
  return { success: true }
}
