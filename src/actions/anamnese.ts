'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveStudentRow } from '@/lib/supabase/student-context'

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

  const student = await getActiveStudentRow(supabase, user.id)

  if (!student) return { error: 'Aluno não encontrado' }

  const now = new Date().toISOString()

  // Anamnese pertence à pessoa (user_id) — compartilhada entre todos os
  // personals que o aluno já teve/tem, não só o vínculo atual.
  let resolvedId = existingId
  if (!resolvedId) {
    const { data: found } = await supabase
      .from('anamnese_responses')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    resolvedId = found?.id ?? null
  }

  if (resolvedId) {
    const updateData: Record<string, unknown> = {
      responses: values,
      updated_at: now,
      student_id: student.id,
      tenant_id: student.tenant_id,
    }
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
      user_id: user.id,
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
