'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addFeedback(formData: FormData) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .single()

  if (!profile?.tenant_id || profile.role !== 'personal') {
    return { error: 'Não autorizado' }
  }

  const student_id      = formData.get('student_id') as string
  const workout_plan_id = formData.get('workout_plan_id') as string | null
  const rating          = Number(formData.get('rating'))
  const comment         = (formData.get('comment') as string | null) || null

  if (!student_id || rating < 1 || rating > 5) {
    return { error: 'Dados inválidos' }
  }

  const { error } = await supabase.from('workout_feedbacks').insert({
    tenant_id:      profile.tenant_id,
    student_id,
    workout_plan_id: workout_plan_id || null,
    rating,
    comment,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feedbacks')
  return { success: true }
}

export async function deleteFeedback(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workout_feedbacks')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/feedbacks')
  return { success: true }
}
