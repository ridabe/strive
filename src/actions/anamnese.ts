'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveAnamnese({
  values,
  complete,
  existingId,
}: {
  values: Record<string, string>
  complete: boolean
  existingId: string | null
}): Promise<{ success?: boolean; error?: string; newId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: student } = await supabase
    .from('students')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) return { error: 'Aluno não encontrado' }

  const now = new Date().toISOString()

  // Resolve the actual record — existingId may be null if first save in this session
  let resolvedId = existingId
  if (!resolvedId) {
    const { data: found } = await supabase
      .from('anamnese_responses')
      .select('id')
      .eq('student_id', student.id)
      .maybeSingle()
    resolvedId = found?.id ?? null
  }

  if (resolvedId) {
    const updateData: Record<string, unknown> = { responses: values, updated_at: now }
    if (complete) updateData.completed_at = now

    const { error } = await supabase
      .from('anamnese_responses')
      .update(updateData)
      .eq('id', resolvedId)

    if (error) return { error: error.message }
    return { success: true }
  }

  // First insert
  const { data: inserted, error } = await supabase
    .from('anamnese_responses')
    .insert({
      student_id: student.id,
      tenant_id: student.tenant_id,
      responses: values,
      ...(complete ? { completed_at: now } : {}),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, newId: inserted.id }
}
