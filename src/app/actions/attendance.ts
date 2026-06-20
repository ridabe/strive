'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Registrar frequência (admin) ─────────────────────────────────────────────
export async function registerAttendance(
  studentId: string,
  date: string,
  notes?: string,
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

  const { count } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('tenant_id', profile.tenant_id)
    .gte('attended_at', `${date}T00:00:00`)
    .lte('attended_at', `${date}T23:59:59`)

  if ((count ?? 0) > 0) return { error: 'Já existe um registro para esta data.' }

  const { error } = await supabase.from('attendance').insert({
    student_id:  studentId,
    tenant_id:   profile.tenant_id,
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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Tenant não encontrado' }

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', attendanceId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/frequencia`)
  revalidatePath('/dashboard/frequencia')
  return { success: true }
}
