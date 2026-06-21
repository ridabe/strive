'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getStudentCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!student) return null
  return { supabase, studentId: student.id, tenantId: student.tenant_id }
}

// ─── Iniciar sessão ───────────────────────────────────────────────────────────
export async function startWorkoutSession(
  workoutPlanId: string,
  workoutRoutineId: string | null = null
) {
  const ctx = await getStudentCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { data, error } = await ctx.supabase
    .from('workout_sessions')
    .insert({
      tenant_id:          ctx.tenantId,
      student_id:         ctx.studentId,
      workout_plan_id:    workoutPlanId,
      workout_routine_id: workoutRoutineId,
      started_at:         new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { sessionId: data.id }
}

// ─── Finalizar sessão ─────────────────────────────────────────────────────────
export async function finishWorkoutSession(
  sessionId: string,
  durationSeconds: number,
  intensity: 'muito_leve' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso',
  notes: string | null
) {
  const ctx = await getStudentCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { error } = await ctx.supabase
    .from('workout_sessions')
    .update({
      finished_at:      new Date().toISOString(),
      duration_seconds: durationSeconds,
      intensity,
      notes: notes || null,
    })
    .eq('id', sessionId)
    .eq('student_id', ctx.studentId)

  if (error) return { error: error.message }

  revalidatePath('/student/treinos')
  revalidatePath('/student/historico')
  return { success: true }
}

// ─── Salvar exercício executado ───────────────────────────────────────────────
export async function saveSessionExercise(input: {
  sessionId:     string
  workoutItemId: string
  exerciseId:    string
  setsDone:      number | null
  repsDone:      string | null
  loadUsed:      string | null
  feedback:      string | null
}) {
  const ctx = await getStudentCtx()
  if (!ctx) return { error: 'Não autenticado' }

  const { data, error } = await ctx.supabase
    .from('workout_session_exercises')
    .upsert(
      {
        session_id:      input.sessionId,
        workout_item_id: input.workoutItemId,
        exercise_id:     input.exerciseId,
        sets_done:       input.setsDone,
        reps_done:       input.repsDone,
        load_used:       input.loadUsed,
        feedback:        input.feedback,
      },
      { onConflict: 'session_id,workout_item_id' }
    )
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data.id }
}

// ─── Buscar histórico do aluno ────────────────────────────────────────────────
export async function getStudentWorkoutHistory(limit = 20) {
  const ctx = await getStudentCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('workout_sessions')
    .select(`
      id, started_at, finished_at, duration_seconds, intensity, notes,
      workout_plans ( name ),
      workout_routines ( name )
    `)
    .eq('student_id', ctx.studentId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ─── Buscar sessões de um aluno (visão do personal) ──────────────────────────
export async function getStudentSessionsForPersonal(studentId: string, limit = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role !== 'personal') return []

  const { data } = await supabase
    .from('workout_sessions')
    .select(`
      id, started_at, finished_at, duration_seconds, intensity, notes,
      workout_plans ( name ),
      workout_routines ( name ),
      workout_session_exercises (
        id, sets_done, reps_done, load_used, feedback,
        exercises ( name, muscle_group )
      )
    `)
    .eq('student_id', studentId)
    .eq('tenant_id', profile.tenant_id)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ─── Evolução de carga por exercício (aluno) ──────────────────────────────────
export async function getExerciseLoadHistory(exerciseId: string, limit = 10) {
  const ctx = await getStudentCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('workout_session_exercises')
    .select(`
      load_used, sets_done, reps_done, created_at,
      workout_sessions!inner ( student_id, finished_at )
    `)
    .eq('exercise_id', exerciseId)
    .eq('workout_sessions.student_id', ctx.studentId)
    .not('workout_sessions.finished_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
