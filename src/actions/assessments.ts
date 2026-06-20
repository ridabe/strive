'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitStudentAssessment(values: {
  assessed_at: string
  weight: number | null
  height: number | null
  body_fat: number | null
  arm: number | null
  chest: number | null
  waist: number | null
  hip: number | null
  thigh: number | null
  notes: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: student } = await supabase
    .from('students')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) return { error: 'Aluno não encontrado' }

  const { error } = await supabase.from('physical_assessments').insert({
    student_id: student.id,
    tenant_id:  student.tenant_id,
    ...values,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/avaliacao')
  return { success: true }
}
