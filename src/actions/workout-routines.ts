'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createRoutine(planId: string, name: string, displayOrder: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { error: 'Tenant não encontrado' }

  const { data, error } = await supabase
    .from('workout_routines')
    .insert({
      workout_plan_id: planId,
      tenant_id: profile.tenant_id,
      name,
      display_order: displayOrder,
    })
    .select('id, name, day_of_week, display_order, notes')
    .single()

  if (error) return { error: error.message }
  return { routine: data }
}

export async function updateRoutine(
  routineId: string,
  fields: { name?: string; day_of_week?: number | null; notes?: string | null }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_routines')
    .update(fields)
    .eq('id', routineId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteRoutine(routineId: string, planId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_routines')
    .delete()
    .eq('id', routineId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/treinos/${planId}`)
  return { success: true }
}

export async function reorderRoutines(
  planId: string,
  studentId: string,
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

  revalidatePath(`/dashboard/alunos/${studentId}/treinos/${planId}`)
  return { success: true }
}
