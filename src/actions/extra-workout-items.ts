'use server'

import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import type { ExtraWorkoutItemData } from './extra-workouts'

export async function addExtraWorkoutItem(
  extraWorkoutId: string,
  exerciseId: string,
  displayOrder: number
): Promise<{ item?: ExtraWorkoutItemData; error?: string }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) return { error: 'Não autenticado' }

  const { data: prof } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', profile.user.id)
    .single()

  if (!prof?.tenant_id) return { error: 'Tenant não encontrado' }

  const { data: ex } = await supabase
    .from('exercises')
    .select('default_sets, default_reps, default_duration_secs, count_type')
    .eq('id', exerciseId)
    .single()

  const { data, error } = await supabase
    .from('extra_workout_items')
    .insert({
      tenant_id: prof.tenant_id,
      extra_workout_id: extraWorkoutId,
      exercise_id: exerciseId,
      display_order: displayOrder,
      sets: ex?.default_sets ?? 3,
      reps: ex?.default_reps ?? '10-12',
      duration_secs: ex?.default_duration_secs ?? null,
      count_type: ex?.count_type ?? 'reps',
    })
    .select('*, exercises( id, name, muscle_group, load_type, is_global, video_url, instructions, count_type )')
    .single()

  if (error) return { error: error.message }

  const raw = data as Record<string, unknown>
  const item: ExtraWorkoutItemData = {
    ...(raw as Omit<ExtraWorkoutItemData, 'exercises'>),
    exercises: joinOne(raw.exercises),
  }

  return { item }
}

export async function updateExtraWorkoutItem(
  id: string,
  fields: Partial<{
    sets: number | null
    reps: string | null
    duration_secs: number | null
    rest_seconds: number | null
    load: string | null
    notes: string | null
    count_type: string
  }>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('extra_workout_items').update(fields).eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function removeExtraWorkoutItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('extra_workout_items').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function groupExtraWorkoutItems(
  itemIds: string[],
  comboType: 'biset' | 'triset' | 'circuit'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const comboGroupId = crypto.randomUUID()
  const { error } = await supabase
    .from('extra_workout_items')
    .update({ combo_group_id: comboGroupId, combo_type: comboType })
    .in('id', itemIds)
  if (error) return { error: error.message }
  return {}
}

export async function ungroupExtraWorkoutItems(comboGroupId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('extra_workout_items')
    .update({ combo_group_id: null, combo_type: null })
    .eq('combo_group_id', comboGroupId)
  if (error) return { error: error.message }
  return {}
}

export async function reorderExtraWorkoutItems(
  orderedIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('extra_workout_items').update({ display_order: index }).eq('id', id)
    )
  )
  return {}
}
