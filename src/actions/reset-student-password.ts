'use server'

import { createClient } from '@/lib/supabase/server'

export async function resetStudentPassword(studentId: string): Promise<{ tempPassword?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'personal') return { error: 'Sem permissão' }

  const { data, error } = await supabase.functions.invoke('reset-student-password', {
    body: { student_id: studentId },
  })

  if (error) return { error: error.message }
  return { tempPassword: (data as { temp_password?: string })?.temp_password }
}
