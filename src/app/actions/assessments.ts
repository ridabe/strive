'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase.from('physical_assessments').insert({
    student_id: studentId,
    tenant_id:  profile.tenant_id,
    assessed_at,
    weight:   num('weight'),
    height:   num('height'),
    body_fat: num('body_fat'),
    arm:      num('arm'),
    chest:    num('chest'),
    waist:    num('waist'),
    hip:      num('hip'),
    thigh:    num('thigh'),
    notes:    String(formData.get('notes') || '').trim() || null,
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
