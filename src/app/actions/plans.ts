'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/audit'
import { createAbacateProduct } from '@/lib/abacatepay'

// ── Atualizar configuração de um plano ───────────────────────────────────────
export async function updatePlan(planId: string, formData: FormData) {
  const supabase = await createClient()

  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const price_brl   = parseInt(formData.get('price_brl') as string, 10)
  const max_students = parseInt(formData.get('max_students') as string, 10)
  const rawFeatures = formData.get('features') as string

  if (!name || isNaN(price_brl) || isNaN(max_students)) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  let features: string[] = []
  try {
    features = JSON.parse(rawFeatures)
    if (!Array.isArray(features)) throw new Error()
  } catch {
    return { error: 'Formato de features inválido.' }
  }

  // Busca preço atual para detectar mudança
  const { data: current } = await supabase
    .from('plans')
    .select('price_brl, abacatepay_product_id, slug')
    .eq('id', planId)
    .single()

  const { data: plan, error } = await supabase
    .from('plans')
    .update({ name, description, price_brl, max_students, features })
    .eq('id', planId)
    .select('slug, name')
    .single()

  if (error) return { error: error.message }

  // Sincroniza max_students nos tenants que usam esse plano
  await supabase
    .from('tenants')
    .update({ max_students })
    .eq('plan', plan.slug)

  // Se o preço mudou e é um plano pago, recria o produto no AbacatePay
  if (price_brl > 0 && current && current.price_brl !== price_brl) {
    const abacateResult = await createAbacateProduct({
      externalId:  `strive-${plan.slug}-${Date.now()}`,
      name:        `Strive Personal — Plano ${name}`,
      description: description ?? undefined,
      price:       price_brl,
      cycle:       'MONTHLY',
    })

    if (abacateResult.success && abacateResult.data) {
      const adminSupabase = createAdminClient()
      await adminSupabase
        .from('plans')
        .update({ abacatepay_product_id: abacateResult.data.id })
        .eq('id', planId)
    }
  }

  await logAdminAction({
    action: 'PLAN_UPDATED',
    category: 'system',
    description: `Plano "${plan.name}" atualizado — limite: ${max_students === 9999 ? 'ilimitado' : max_students} alunos, preço: R$ ${price_brl}`,
    targetId: planId,
    targetType: 'plan',
  })

  revalidatePath('/admin/planos')
  return { success: true }
}

// ── Ativar / desativar plano ──────────────────────────────────────────────
export async function togglePlanActive(planId: string, is_active: boolean) {
  const supabase = await createClient()

  const { data: plan, error } = await supabase
    .from('plans')
    .update({ is_active })
    .eq('id', planId)
    .select('name')
    .single()

  if (error) return { error: error.message }

  await logAdminAction({
    action: is_active ? 'PLAN_ACTIVATED' : 'PLAN_DEACTIVATED',
    category: 'system',
    description: `Plano "${plan.name}" ${is_active ? 'ativado' : 'desativado'}`,
    targetType: 'plan',
    targetId: planId,
  })

  revalidatePath('/admin/planos')
  return { success: true }
}
