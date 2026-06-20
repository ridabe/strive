'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Salvar respostas da anamnese ─────────────────────────────────────────────
export async function saveAnamneseResponse(
  studentId: string,
  responses: Record<string, unknown>,
  markCompleted = false,
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Tenant não encontrado' }

  const payload: {
    student_id: string
    tenant_id: string
    responses: Record<string, unknown>
    completed_at?: string
  } = {
    student_id: studentId,
    tenant_id: profile.tenant_id,
    responses,
  }
  if (markCompleted) payload.completed_at = new Date().toISOString()

  const { error } = await supabase
    .from('anamnese_responses')
    .upsert(payload, { onConflict: 'student_id,tenant_id' })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/alunos/${studentId}/anamnese`)
  return { success: true }
}

// ─── Adicionar campo customizado ──────────────────────────────────────────────
export async function addCustomField(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return { error: 'Tenant não encontrado' }

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
    tenant_id: profile.tenant_id,
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
    .from('anamnese_templates')
    .update({ is_active: isActive })
    .eq('id', fieldId)
    .eq('tenant_id', profile.tenant_id) // só campos do próprio tenant

  if (error) return { error: error.message }

  revalidatePath('/dashboard/anamnese')
  return { success: true }
}
