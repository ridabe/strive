'use server'

import { revalidatePath } from 'next/cache'
import { getCtx } from '@/lib/supabase/context'

// ─── Registrar frequência (admin) ─────────────────────────────────────────────
export async function registerAttendance(
  studentId: string,
  date: string,
  notes?: string,
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }
  const { supabase, tenantId } = ctx

  const { count } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .gte('attended_at', `${date}T00:00:00`)
    .lte('attended_at', `${date}T23:59:59`)

  if ((count ?? 0) > 0) return { error: 'Já existe um registro para esta data.' }

  const { error } = await supabase.from('attendance').insert({
    student_id:  studentId,
    tenant_id:   tenantId,
    attended_at: `${date}T12:00:00`,
    notes:       notes?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/frequencia`)
  revalidatePath('/dashboard/frequencia')
  return { success: true }
}

// ─── Remover frequência (admin) ───────────────────────────────────────────────
export async function removeAttendance(attendanceId: string, studentId: string) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }
  const { supabase, tenantId } = ctx

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', attendanceId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/frequencia`)
  revalidatePath('/dashboard/frequencia')
  return { success: true }
}
