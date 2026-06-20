'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markAttendanceToday() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: student } = await supabase
    .from('students')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) return { error: 'Aluno não encontrado' }

  const today = new Date().toISOString().split('T')[0]

  const { count } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', student.id)
    .gte('attended_at', `${today}T00:00:00`)
    .lte('attended_at', `${today}T23:59:59`)

  if ((count ?? 0) > 0) return { alreadyCheckedIn: true }

  const { error } = await supabase.from('attendance').insert({
    student_id:  student.id,
    tenant_id:   student.tenant_id,
    attended_at: `${today}T12:00:00`,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/frequencia')
  return { success: true }
}
