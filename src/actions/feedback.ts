'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitFeedback(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: student } = await supabase
    .from('students')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) return { error: 'Aluno não encontrado' }

  const rating         = Number(formData.get('rating'))
  const workout_plan_id = (formData.get('workout_plan_id') as string | null) || null
  const comment        = ((formData.get('comment') as string | null) ?? '').trim() || null

  if (rating < 1 || rating > 5) return { error: 'Selecione uma nota de 1 a 5' }

  const { error } = await supabase.from('workout_feedbacks').insert({
    tenant_id:      student.tenant_id,
    student_id:     student.id,
    workout_plan_id: workout_plan_id || null,
    rating,
    comment,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/feedback')
  return { success: true }
}
