'use server'

import { revalidatePath } from 'next/cache'
import { getCtx } from '@/lib/supabase/context'

// ─── Salvar respostas da anamnese ─────────────────────────────────────────────
export async function saveAnamneseResponse(
  studentId: string,
  responses: Record<string, unknown>,
  markCompleted = false,
) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }
  const { supabase, tenantId } = ctx

  const { data: student } = await supabase
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .maybeSingle()

  const payload: {
    student_id: string
    tenant_id: string
    responses: Record<string, unknown>
    completed_at?: string
    user_id?: string
  } = {
    student_id: studentId,
    tenant_id: tenantId,
    responses,
  }
  if (markCompleted) payload.completed_at = new Date().toISOString()

  // Aluno com conta: anamnese é compartilhada pela pessoa (user_id), então o
  // upsert precisa mirar a linha única da pessoa. Sem conta: não há como
  // compartilhar entre tenants, mantém o vínculo antigo por aluno/tenant.
  const { error } = student?.user_id
    ? await supabase
        .from('anamnese_responses')
        .upsert({ ...payload, user_id: student.user_id }, { onConflict: 'user_id' })
    : await supabase
        .from('anamnese_responses')
        .upsert(payload, { onConflict: 'student_id,tenant_id' })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/anamnese`)
  return { success: true }
}

// ─── Adicionar campo customizado ──────────────────────────────────────────────
export async function addCustomField(formData: FormData) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }
  const { supabase, tenantId } = ctx

  const label      = String(formData.get('label') ?? '').trim()
  const field_key  = String(formData.get('field_key') ?? '').trim()
  const field_type = String(formData.get('field_type') ?? 'text').trim()
  const category   = String(formData.get('category') ?? 'outros').trim()
  const required   = formData.get('required') === 'true'
  const rawOptions = String(formData.get('options') ?? '').trim()

  if (!label || !field_key) return { error: 'label e field_key são obrigatórios' }

  let options = null
  if (field_type === 'select' && rawOptions) {
    try {
      options = JSON.parse(rawOptions)
    } catch {
      options = rawOptions.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  const { error } = await supabase.from('anamnese_templates').insert({
    tenant_id: tenantId,
    label,
    field_key,
    field_type,
    category,
    required,
    options,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/anamnese')
  return { success: true }
}

// ─── Ativar / desativar campo customizado ─────────────────────────────────────
export async function toggleCustomField(fieldId: string, isActive: boolean) {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' }
  const { supabase, tenantId } = ctx

  const { error } = await supabase
    .from('anamnese_templates')
    .update({ is_active: isActive })
    .eq('id', fieldId)
    .eq('tenant_id', tenantId) // só campos do próprio tenant

  if (error) return { error: error.message }

  revalidatePath('/dashboard/anamnese')
  return { success: true }
}
