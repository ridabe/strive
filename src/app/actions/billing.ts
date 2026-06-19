'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSubscriptionCheckout, createAbacateProduct } from '@/lib/abacatepay'
import { logAdminAction } from '@/lib/admin/audit'

// ─── IDs dos produtos AbacatePay por plano (definidos no .env) ───────────────
const ABACATE_PRODUCT_IDS: Record<string, string | undefined> = {
  pro:     process.env.ABACATE_PRO,
  premium: process.env.ABACATE_PREMIUM,
}

// ─── Garante que o plano tem um produto no AbacatePay ────────────────────────
// Prioridade: env var → DB → cria via API (fallback)
async function ensureAbacateProduct(planSlug: string) {
  // 1. Env var tem prioridade (IDs criados manualmente no painel AbacatePay)
  const envProductId = ABACATE_PRODUCT_IDS[planSlug]
  if (envProductId) {
    // Persiste no DB se ainda não estiver salvo
    const adminSupabase = createAdminClient()
    const { data: plan } = await adminSupabase
      .from('plans')
      .select('id, abacatepay_product_id')
      .eq('slug', planSlug)
      .single()

    if (plan && plan.abacatepay_product_id !== envProductId) {
      await adminSupabase
        .from('plans')
        .update({ abacatepay_product_id: envProductId })
        .eq('id', plan.id)
    }

    return envProductId
  }

  const adminSupabase = createAdminClient()
  const { data: plan } = await adminSupabase
    .from('plans')
    .select('id, name, description, price_brl, abacatepay_product_id')
    .eq('slug', planSlug)
    .single()

  if (!plan || plan.price_brl === 0) return null // Free não precisa

  // 2. Já salvo no DB
  if (plan.abacatepay_product_id) return plan.abacatepay_product_id

  // 3. Fallback: cria o produto via API
  const result = await createAbacateProduct({
    externalId:  `strive-${planSlug}`,
    name:        `Strive Personal — Plano ${plan.name}`,
    description: plan.description ?? undefined,
    price:       plan.price_brl,
    cycle:       'MONTHLY',
  })

  if (!result.success || !result.data) {
    console.error('[billing] Falha ao criar produto no AbacatePay:', result.error)
    return null
  }

  await adminSupabase
    .from('plans')
    .update({ abacatepay_product_id: result.data.id })
    .eq('id', plan.id)

  return result.data.id
}

// ─── Iniciar checkout de assinatura ──────────────────────────────────────────
export async function startSubscriptionCheckout(planSlug: 'pro' | 'premium') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca tenant do personal
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, full_name, email')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id
  if (!tenantId) throw new Error('Tenant não encontrado')

  // Verifica se já possui assinatura ativa no plano escolhido
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()

  if (tenant?.plan === planSlug) {
    redirect('/dashboard/planos?info=already_active')
  }

  // Garante produto no AbacatePay (cria se necessário)
  const productId = await ensureAbacateProduct(planSlug)
  if (!productId) {
    redirect('/dashboard/planos?error=product_unavailable')
  }

  // Busca dados do plano para enviar no metadata
  const { data: plan } = await supabase
    .from('plans')
    .select('id, name')
    .eq('slug', planSlug)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Cria checkout no AbacatePay
  // Nota: assinaturas AbacatePay aceitam apenas CARD (não PIX)
  const checkoutResult = await createSubscriptionCheckout({
    productId,
    externalId:    `tenant_${tenantId}_${planSlug}_${Date.now()}`,
    completionUrl: `${appUrl}/dashboard/planos?success=1&plan=${planSlug}`,
    returnUrl:     `${appUrl}/dashboard/planos`,
    methods:       ['CARD'],
    metadata: {
      tenant_id: tenantId,
      plan_slug: planSlug,
      plan_id:   plan?.id ?? '',
    },
  })

  if (!checkoutResult.success || !checkoutResult.data?.url) {
    const errMsg = checkoutResult.error ?? 'Resposta inválida da AbacatePay'
    console.error('[billing] Erro ao criar checkout:', errMsg)
    // Em desenvolvimento, expõe o erro real para facilitar debug
    const isDev = process.env.NODE_ENV === 'development'
    redirect(
      `/dashboard/planos?error=${encodeURIComponent(isDev ? `checkout_failed: ${errMsg}` : 'checkout_failed')}`
    )
  }

  // Registra checkout pendente
  const adminSupabase = createAdminClient()
  await adminSupabase.from('subscriptions').insert({
    tenant_id:             tenantId,
    plan_id:               plan?.id ?? null,
    plan_slug:             planSlug,
    abacatepay_checkout_id: checkoutResult.data.id,
    status:                'pending',
  })

  // Redireciona para a página de pagamento do AbacatePay
  redirect(checkoutResult.data.url)
}

// ─── Sincronizar produto de um plano com o AbacatePay (chamado pelo admin) ───
export async function syncPlanToAbacatePay(planId: string) {
  const adminSupabase = createAdminClient()

  const { data: plan } = await adminSupabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (!plan || plan.price_brl === 0) return { info: 'Plano gratuito não precisa de produto no AbacatePay' }

  // Sempre cria um novo produto (AbacatePay não tem endpoint de atualização)
  const result = await createAbacateProduct({
    externalId:  `strive-${plan.slug}-${Date.now()}`,
    name:        `Strive Personal — Plano ${plan.name}`,
    description: plan.description ?? undefined,
    price:       plan.price_brl,
    cycle:       'MONTHLY',
  })

  if (!result.success || !result.data) {
    return { error: result.error ?? 'Falha ao criar produto no AbacatePay' }
  }

  await adminSupabase
    .from('plans')
    .update({ abacatepay_product_id: result.data.id })
    .eq('id', planId)

  await logAdminAction({
    action:     'PLAN_SYNCED_ABACATEPAY',
    category:   'system',
    description: `Produto "${plan.name}" sincronizado com AbacatePay (ID: ${result.data.id})`,
    targetType: 'plan',
    targetId:   planId,
    metadata:   { abacatepay_product_id: result.data.id },
  })

  return { success: true, productId: result.data.id }
}
