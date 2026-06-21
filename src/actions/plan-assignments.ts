'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getPersonalCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role !== 'personal') return null
  return { supabase, tenantId: profile.tenant_id }
}

// Atribuir plano a um ou mais alunos
export async function assignPlanToStudents(planId: string, studentIds: string[]) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }
  if (studentIds.length === 0) return { error: 'Selecione ao menos um aluno' }

  const rows = studentIds.map((studentId) => ({
    plan_id:    planId,
    student_id: studentId,
    tenant_id:  ctx.tenantId,
    status:     'active',
  }))

  const { error } = await ctx.supabase
    .from('student_plan_assignments')
    .upsert(rows, { onConflict: 'plan_id,student_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/treinos')
  revalidatePath('/dashboard/alunos')
  return { success: true }
}

// Atribuir plano a todos os alunos ativos do tenant
export async function assignPlanToAllStudents(planId: string) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const { data: students } = await ctx.supabase
    .from('students')
    .select('id')
    .eq('tenant_id', ctx.tenantId)
    .eq('status', 'active')

  if (!students?.length) return { error: 'Nenhum aluno ativo' }

  const rows = students.map((s) => ({
    plan_id:    planId,
    student_id: s.id,
    tenant_id:  ctx.tenantId,
    status:     'active',
  }))

  const { error } = await ctx.supabase
    .from('student_plan_assignments')
    .upsert(rows, { onConflict: 'plan_id,student_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/treinos')
  revalidatePath('/dashboard/alunos')
  return { success: true }
}

// Remover atribuição de um aluno
export async function removePlanAssignment(planId: string, studentId: string) {
  const ctx = await getPersonalCtx()
  if (!ctx) return { error: 'Não autorizado' }

  const { error } = await ctx.supabase
    .from('student_plan_assignments')
    .delete()
    .eq('plan_id', planId)
    .eq('student_id', studentId)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/treinos')
  revalidatePath('/dashboard/alunos')
  return { success: true }
}

// Buscar alunos atribuídos a um plano
export async function getAssignmentsForPlan(planId: string) {
  const ctx = await getPersonalCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('student_plan_assignments')
    .select('id, student_id, status, assigned_at, students ( full_name, avatar_url )')
    .eq('plan_id', planId)
    .eq('tenant_id', ctx.tenantId)
    .order('assigned_at', { ascending: false })

  return data ?? []
}

// Buscar todos os alunos ativos do tenant (para selector)
export async function getActiveStudentsForTenant() {
  const ctx = await getPersonalCtx()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('students')
    .select('id, full_name, avatar_url')
    .eq('tenant_id', ctx.tenantId)
    .eq('status', 'active')
    .order('full_name')

  return data ?? []
}

// Buscar planos NÃO atribuídos a um aluno específico (para tela do aluno)
export async function getUnassignedPlansForStudent(studentId: string) {
  const ctx = await getPersonalCtx()
  if (!ctx) return []

  // Planos já atribuídos
  const { data: assigned } = await ctx.supabase
    .from('student_plan_assignments')
    .select('plan_id')
    .eq('student_id', studentId)
    .eq('tenant_id', ctx.tenantId)

  const assignedIds = (assigned ?? []).map((a) => a.plan_id)

  let query = ctx.supabase
    .from('workout_plans')
    .select('id, name, goal, status, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })

  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  }

  const { data } = await query
  return data ?? []
}
