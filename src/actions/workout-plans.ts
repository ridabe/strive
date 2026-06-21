'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'

export type WorkoutPlanWithRoutines = {
  id: string
  name: string
  goal: string | null
  description: string | null
  status: 'active' | 'inactive'
  start_date: string | null
  end_date: string | null
  student_id: string | null
  tenant_id: string
  student: { full_name: string; avatar_url: string | null } | null
  workout_routines: {
    id: string
    name: string
    day_of_week: number | null
    display_order: number
    notes: string | null
    workout_items: {
      id: string
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
      cadence: string | null
      exercises: {
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
      } | null
    }[]
  }[]
}

export async function getWorkoutPlan(planId: string): Promise<WorkoutPlanWithRoutines | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workout_plans')
    .select(`
      id, name, goal, description, status, start_date, end_date, student_id, tenant_id,
      students ( full_name, avatar_url ),
      workout_routines (
        id, name, day_of_week, display_order, notes,
        workout_items (
          id, display_order, combo_group_id, combo_type,
          sets, reps, duration_secs, rest_seconds, load, count_type, notes, cadence,
          exercises (
            id, name, muscle_group, load_type, is_global,
            video_url, instructions, count_type,
            default_sets, default_reps, default_duration_secs
          )
        )
      )
    `)
    .eq('id', planId)
    .order('display_order', { referencedTable: 'workout_routines' })
    .order('display_order', { referencedTable: 'workout_items' })
    .single()

  if (error || !data) return null

  return {
    ...data,
    student: joinOne<{ full_name: string; avatar_url: string | null }>(data.students),
    workout_routines: (data.workout_routines ?? []).map((r) => ({
      ...r,
      workout_items: (r.workout_items ?? []).map((item) => ({
        ...item,
        exercises: joinOne(item.exercises),
      })),
    })),
  } as WorkoutPlanWithRoutines
}

export async function getStudentWorkoutPlans(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('student_plan_assignments')
    .select(`
      status,
      assigned_at,
      workout_plans ( id, name, goal, status, start_date, end_date, created_at )
    `)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('assigned_at', { ascending: false })

  return (data ?? [])
    .map((a) => {
      const plan = Array.isArray(a.workout_plans)
        ? a.workout_plans[0]
        : a.workout_plans
      return plan as {
        id: string; name: string; goal: string | null;
        status: string; start_date: string | null; end_date: string | null; created_at: string
      } | null
    })
    .filter(Boolean) as {
      id: string; name: string; goal: string | null;
      status: string; start_date: string | null; end_date: string | null; created_at: string
    }[]
}

export async function createWorkoutPlan(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) return { error: 'Tenant não encontrado' }

  const studentId  = (formData.get('student_id') as string) || null
  const name       = formData.get('name') as string
  const goal       = formData.get('goal') as string | null
  const description= formData.get('description') as string | null
  const start_date = formData.get('start_date') as string | null
  const end_date   = formData.get('end_date') as string | null

  if (!name) return { error: 'Nome do plano é obrigatório' }

  const { data, error } = await supabase
    .from('workout_plans')
    .insert({
      tenant_id:  profile.tenant_id,
      student_id: studentId || null,
      name,
      goal:        goal || null,
      description: description || null,
      start_date:  start_date || null,
      end_date:    end_date || null,
      status:      'inactive',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/treinos')
  if (studentId) revalidatePath(`/dashboard/alunos/${studentId}`)
  return { planId: data.id }
}

export async function updateWorkoutPlan(planId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_plans')
    .update({
      name:        formData.get('name') as string,
      goal:        (formData.get('goal') as string) || null,
      description: (formData.get('description') as string) || null,
      start_date:  (formData.get('start_date') as string) || null,
      end_date:    (formData.get('end_date') as string) || null,
    })
    .eq('id', planId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos`)
  revalidatePath('/dashboard/treinos')
  return { success: true }
}

export async function publishWorkoutPlan(planId: string, studentId?: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_plans')
    .update({ status: 'active' })
    .eq('id', planId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/treinos')
  if (studentId) revalidatePath(`/dashboard/alunos/${studentId}/treinos/${planId}`)
  return { success: true }
}

export async function deactivateWorkoutPlan(planId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_plans')
    .update({ status: 'inactive' })
    .eq('id', planId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/treinos/${planId}`)
  revalidatePath('/dashboard/treinos')
  return { success: true }
}

export async function deleteWorkoutPlan(planId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('id', planId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}`)
  revalidatePath('/dashboard/treinos')
  return { success: true }
}
