'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calcBMI, calcBMR } from '@/lib/fitness-calc'

// ─── Criar avaliação física ───────────────────────────────────────────────────
export async function createAssessment(studentId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Tenant não encontrado' }

  const num = (key: string): number | null => {
    const val = formData.get(key)
    if (val === null || val === '') return null
    const n = parseFloat(String(val))
    return isNaN(n) ? null : n
  }

  const assessed_at =
    String(formData.get('assessed_at') || '').trim() ||
    new Date().toISOString().split('T')[0]

  const rawSex = String(formData.get('sex') || '').trim()
  const sex = rawSex === 'M' || rawSex === 'F' ? rawSex : null

  const weight   = num('weight')
  const height   = num('height')
  const body_fat = num('body_fat')
  const arm      = num('arm')
  const chest    = num('chest')
  const waist    = num('waist')
  const hip      = num('hip')
  const thigh    = num('thigh')
  const notes    = String(formData.get('notes') || '').trim() || null

  // Buscar data de nascimento do aluno para calcular TMB
  const { data: studentRow } = await supabase
    .from('students')
    .select('birth_date')
    .eq('id', studentId)
    .maybeSingle()

  const bmi =
    weight !== null && height !== null && height > 0
      ? calcBMI(weight, height)
      : null

  const bmr =
    weight !== null && height !== null && sex !== null && studentRow?.birth_date
      ? calcBMR(weight, height, studentRow.birth_date, sex)
      : null

  const { error } = await supabase.from('physical_assessments').insert({
    student_id: studentId,
    tenant_id:  profile.tenant_id,
    assessed_at,
    sex,
    weight,
    height,
    body_fat,
    arm,
    chest,
    waist,
    hip,
    thigh,
    notes,
    bmi,
    bmr,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/avaliacoes`)
  revalidatePath('/dashboard/avaliacoes')
  return { success: true }
}

// ─── Excluir avaliação física ─────────────────────────────────────────────────
export async function deleteAssessment(assessmentId: string, studentId: string) {
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
    .from('physical_assessments')
    .delete()
    .eq('id', assessmentId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/avaliacoes`)
  revalidatePath('/dashboard/avaliacoes')
  return { success: true }
}
