'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ExtraWorkoutCategory } from '@/types/database'

export type ExtraWorkoutWithItems = {
  id: string
  name: string
  description: string | null
  category: ExtraWorkoutCategory
  tags: string[]
  is_template: boolean
  student_id: string | null
  tenant_id: string
  created_at: string
  updated_at: string
  extra_workout_items: ExtraWorkoutItemData[]
}

export type ExtraWorkoutItemData = {
  id: string
  extra_workout_id: string
  display_order: number
  combo_group_id: string | null
  combo_type: string | null
  sets: number | null
  reps: string | null
  duration_secs: number | null
  rest_seconds: number | null
  load: string | null
  count_type: string
  notes: string | null
  exercises: {
    id: string
    name: string
    muscle_group: string
    load_type: string
    is_global: boolean
    video_url: string | null
    instructions: string | null
    count_type: string
  } | null
}

export async function getExtraWorkout(id: string): Promise<ExtraWorkoutWithItems | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('extra_workouts')
    .select(`
      *,
      extra_workout_items (
        *,
        exercises ( id, name, muscle_group, load_type, is_global, video_url, instructions, count_type )
      )
    `)
    .eq('id', id)
    .order('display_order', { referencedTable: 'extra_workout_items' })
    .single()

  if (!data) return null

  return {
    ...data,
    extra_workout_items: (data.extra_workout_items ?? []).map((item: Record<string, unknown>) => ({
      ...item,
      exercises: Array.isArray(item.exercises) ? (item.exercises[0] ?? null) : item.exercises,
    })) as ExtraWorkoutItemData[],
  }
}

export async function getStudentExtraWorkouts(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('extra_workouts')
    .select('id, name, description, category, tags, is_template, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getTenantExtraWorkouts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('extra_workouts')
    .select('id, name, description, category, tags, is_template, student_id, created_at')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createExtraWorkout(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) return { error: 'Não autenticado' }

  const { data: prof } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', profile.user.id)
    .single()

  if (!prof?.tenant_id) return { error: 'Tenant não encontrado' }

  const studentId = formData.get('student_id') as string | null
  const isTemplate = formData.get('is_template') === 'true'
  const tagsRaw = formData.get('tags') as string | null
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []

  const { data, error } = await supabase
    .from('extra_workouts')
    .insert({
      tenant_id: prof.tenant_id,
      student_id: isTemplate ? null : (studentId || null),
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      category: (formData.get('category') as ExtraWorkoutCategory) || 'outros',
      tags,
      is_template: isTemplate,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/treinos-extras')
  if (studentId) revalidatePath(`/dashboard/alunos/${studentId}/treinos-extras`)

  return { id: data.id }
}

export async function updateExtraWorkout(
  id: string,
  fields: {
    name?: string
    description?: string | null
    category?: ExtraWorkoutCategory
    tags?: string[]
  }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('extra_workouts').update(fields).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/treinos-extras')
  return {}
}

export async function deleteExtraWorkout(id: string, studentId?: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('extra_workouts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/treinos-extras')
  if (studentId) revalidatePath(`/dashboard/alunos/${studentId}/treinos-extras`)
  return {}
}

export async function assignTemplateToStudent(
  templateId: string,
  studentId: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()

  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user) return { error: 'Não autenticado' }

  const { data: prof } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', profile.user.id)
    .single()

  if (!prof?.tenant_id) return { error: 'Tenant não encontrado' }

  const { data: template } = await supabase
    .from('extra_workouts')
    .select('*, extra_workout_items(*)')
    .eq('id', templateId)
    .single()

  if (!template) return { error: 'Template não encontrado' }

  const { data: newWorkout, error: wErr } = await supabase
    .from('extra_workouts')
    .insert({
      tenant_id: prof.tenant_id,
      student_id: studentId,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      is_template: false,
    })
    .select('id')
    .single()

  if (wErr || !newWorkout) return { error: wErr?.message ?? 'Erro ao criar treino' }

  if (template.extra_workout_items?.length) {
    type RawItem = {
      exercise_id: string
      display_order: number
      combo_group_id: string | null
      combo_type: string | null
      sets: number | null
      reps: string | null
      duration_secs: number | null
      rest_seconds: number | null
      load: string | null
      count_type: string
      notes: string | null
    }
    const rawItems = template.extra_workout_items as RawItem[]
    const items = rawItems
      .filter((item) => item.exercise_id)
      .map((item) => ({
        tenant_id: prof.tenant_id!,
        extra_workout_id: newWorkout.id,
        exercise_id: item.exercise_id,
        display_order: item.display_order,
        combo_group_id: item.combo_group_id,
        combo_type: item.combo_type,
        sets: item.sets,
        reps: item.reps,
        duration_secs: item.duration_secs,
        rest_seconds: item.rest_seconds,
        load: item.load,
        count_type: item.count_type,
        notes: item.notes,
      }))

    const { error: iErr } = await supabase.from('extra_workout_items').insert(items)
    if (iErr) return { error: iErr.message }
  }

  revalidatePath(`/dashboard/alunos/${studentId}/treinos-extras`)
  return { id: newWorkout.id }
}
