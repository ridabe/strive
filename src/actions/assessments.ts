'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calcBMI, calcBMR } from '@/lib/fitness-calc'

export async function submitStudentAssessment(values: {
  assessed_at: string
  sex: 'M' | 'F' | null
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
    .select('id, tenant_id, birth_date')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) return { error: 'Aluno não encontrado' }

  // Calcular IMC e TMB quando os dados necessários estiverem disponíveis
  const bmi =
    values.weight !== null && values.height !== null && values.height > 0
      ? calcBMI(values.weight, values.height)
      : null

  const bmr =
    values.weight !== null &&
    values.height !== null &&
    values.sex !== null &&
    student.birth_date
      ? calcBMR(values.weight, values.height, student.birth_date, values.sex)
      : null

  const { error } = await supabase.from('physical_assessments').insert({
    student_id: student.id,
    tenant_id:  student.tenant_id,
    bmi,
    bmr,
    ...values,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/avaliacao')
  return { success: true }
}
