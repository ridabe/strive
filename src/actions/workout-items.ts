'use server'

import { createClient } from '@/lib/supabase/server'

type ExerciseRow = {
  id: string
  name: string
  muscle_group: string
  load_type: string
  is_global: boolean
  video_url: string | null
  instructions: string | null
  count_type: string
  default_sets: number | null
  default_reps: string | null
  default_duration_secs: number | null
  tenant_id: string | null
}

export async function searchExercises(query: string): Promise<ExerciseRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const q = query.trim()
  let builder = supabase
    .from('exercises')
    .select(
      'id, name, muscle_group, load_type, is_global, video_url, instructions, count_type, default_sets, default_reps, default_duration_secs, tenant_id'
    )
    .or(`is_global.eq.true,tenant_id.eq.${profile?.tenant_id ?? '00000000-0000-0000-0000-000000000000'}`)
    .order('name')
    .limit(40)

  if (q) {
    builder = builder.ilike('name', `%${q}%`)
  }

  const { data } = await builder
  return (data ?? []) as ExerciseRow[]
}

export async function addWorkoutItem(
  routineId: string,
  exerciseId: string,
  displayOrder: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { error: 'Tenant não encontrado' }

  const { data: ex } = await supabase
    .from('exercises')
    .select('default_sets, default_reps, default_duration_secs, count_type')
    .eq('id', exerciseId)
    .single()

  const { data, error } = await supabase
    .from('workout_items')
    .insert({
      routine_id:    routineId,
      tenant_id:     profile.tenant_id,
      exercise_id:   exerciseId,
      display_order: displayOrder,
      sets:          ex?.default_sets ?? 3,
      reps:          ex?.default_reps ?? '10-12',
      duration_secs: ex?.default_duration_secs ?? null,
      rest_seconds:  60,
      count_type:    ex?.count_type ?? 'reps',
    })
    .select(`
      id, display_order, combo_group_id, combo_type,
      sets, reps, duration_secs, rest_seconds, load, count_type, notes, cadence,
      exercises (
        id, name, muscle_group, load_type, is_global,
        video_url, instructions, count_type,
        default_sets, default_reps, default_duration_secs
      )
    `)
    .single()

  if (error) return { error: error.message }
  return { item: data }
}

export async function updateWorkoutItem(
  itemId: string,
  fields: {
    sets?: number | null
    reps?: string | null
    duration_secs?: number | null
    rest_seconds?: number | null
    load?: string | null
    count_type?: string
    notes?: string | null
    cadence?: string | null
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_items')
    .update(fields)
    .eq('id', itemId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function removeWorkoutItem(itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function reorderWorkoutItems(routineId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('workout_items')
      .update({ display_order: index })
      .eq('id', id)
      .eq('routine_id', routineId)
  )
  const results = await Promise.all(updates)
  const failed  = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  return { success: true }
}

export async function groupWorkoutItems(
  itemIds: string[],
  comboType: 'biset' | 'triset' | 'circuit'
) {
  if (itemIds.length < 2) return { error: 'Selecione ao menos 2 exercícios para combinar' }
  const supabase = await createClient()
  const comboGroupId = crypto.randomUUID()

  const updates = itemIds.map((id) =>
    supabase
      .from('workout_items')
      .update({ combo_group_id: comboGroupId, combo_type: comboType })
      .eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed  = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  return { comboGroupId, success: true }
}

export async function ungroupWorkoutItems(comboGroupId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_items')
    .update({ combo_group_id: null, combo_type: null })
    .eq('combo_group_id', comboGroupId)

  if (error) return { error: error.message }
  return { success: true }
}
