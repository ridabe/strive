import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAbacateSignature } from '@/lib/abacatepay'

// ─── Tipos do payload AbacatePay ──────────────────────────────────────────────

interface WebhookEvent {
  id:         string
  event:      'subscription.completed' | 'subscription.renewed' | 'subscription.cancelled'
  apiVersion: number
  devMode:    boolean
  data: {
    subscription: {
      id:         string
      amount:     number
      currency:   string
      method:     string
      status:     'ACTIVE' | 'CANCELLED' | 'EXPIRED'
      frequency:  string
      canceledAt: string | null
    }
    customer?: {
      id:    string
      name:  string
      email: string
    }
    payment?: {
      id:         string
      externalId: string | null
      amount:     number
      paidAmount: number
      status:     string
      receiptUrl: string | null
    }
    checkout: {
      id:         string
      externalId: string | null
      url:        string
      amount:     number
      status:     string
      metadata:   Record<string, string> | null
      receiptUrl: string | null
    }
  }
}

// ─── Planos mapeados por slug ─────────────────────────────────────────────────

const PLAN_DOWNGRADE: Record<string, 'free'> = {
  pro:     'free',
  premium: 'free',
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Validar secret na query string
  const webhookSecret = req.nextUrl.searchParams.get('webhookSecret')
  if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Ler body raw para verificar HMAC
  const rawBody = await req.text()

  // 3. Verificar assinatura HMAC
  const signature = req.headers.get('x-webhook-signature') ?? ''
  if (!verifyAbacateSignature(rawBody, signature)) {
    console.error('[webhook/abacatepay] HMAC inválido')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 4. Parsear payload
  let event: WebhookEvent
  try {
    event = JSON.parse(rawBody) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // 5. Idempotência: verificar se evento já foi processado
  const { data: existing } = await adminSupabase
    .from('webhook_events')
    .select('id')
    .eq('id', event.id)
    .single()

  if (existing) {
    console.log(`[webhook/abacatepay] Evento ${event.id} já processado — ignorando`)
    return NextResponse.json({ ok: true })
  }

  // 6. Processar evento
  try {
    const metadata = event.data.checkout.metadata ?? {}
    const tenantId = metadata['tenant_id']
    const planSlug = metadata['plan_slug'] as 'free' | 'pro' | 'premium' | undefined
    const planId   = metadata['plan_id']

    if (!tenantId) {
      console.error('[webhook/abacatepay] tenant_id ausente nos metadados', metadata)
      // Registra para não reprocessar
      await recordEvent(adminSupabase, event, rawBody)
      return NextResponse.json({ ok: true })
    }

    switch (event.event) {

      // ── Assinatura ativada (primeiro pagamento) ────────────────────────────
      case 'subscription.completed': {
        if (!planSlug || planSlug === 'free') break

        // Atualiza plano do tenant
        await adminSupabase
          .from('tenants')
          .update({ plan: planSlug, status: 'active' })
          .eq('id', tenantId)

        // Atualiza max_students do tenant com o valor do plano
        if (planId) {
          const { data: plan } = await adminSupabase
            .from('plans')
            .select('max_students')
            .eq('id', planId)
            .single()

          if (plan) {
            await adminSupabase
              .from('tenants')
              .update({ max_students: plan.max_students })
              .eq('id', tenantId)
          }
        }

        // Upsert subscription
        await adminSupabase
          .from('subscriptions')
          .upsert({
            tenant_id:                   tenantId,
            plan_id:                     planId ?? null,
            plan_slug:                   planSlug,
            abacatepay_subscription_id:  event.data.subscription.id,
            abacatepay_checkout_id:      event.data.checkout.id,
            status:                      'active',
            method:                      event.data.subscription.method,
            receipt_url:                 event.data.checkout.receiptUrl ?? event.data.payment?.receiptUrl ?? null,
          }, {
            onConflict: 'abacatepay_subscription_id',
          })

        console.log(`[webhook/abacatepay] Plano ${planSlug} ativado para tenant ${tenantId}`)
        break
      }

      // ── Renovação mensal ───────────────────────────────────────────────────
      case 'subscription.renewed': {
        await adminSupabase
          .from('subscriptions')
          .update({
            status:      'active',
            receipt_url: event.data.checkout.receiptUrl ?? event.data.payment?.receiptUrl ?? null,
          })
          .eq('abacatepay_subscription_id', event.data.subscription.id)

        console.log(`[webhook/abacatepay] Assinatura ${event.data.subscription.id} renovada`)
        break
      }

      // ── Cancelamento ───────────────────────────────────────────────────────
      case 'subscription.cancelled': {
        // Busca a assinatura para saber qual tenant e qual plano cancelou
        const { data: sub } = await adminSupabase
          .from('subscriptions')
          .update({
            status:       'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('abacatepay_subscription_id', event.data.subscription.id)
          .select('tenant_id, plan_slug')
          .single()

        const affectedTenantId = sub?.tenant_id ?? tenantId
        const cancelledSlug    = sub?.plan_slug  ?? planSlug

        // Faz downgrade para Free
        if (affectedTenantId) {
          const downgradeTo = (cancelledSlug && PLAN_DOWNGRADE[cancelledSlug]) ?? 'free'

          const { data: freePlan } = await adminSupabase
            .from('plans')
            .select('max_students')
            .eq('slug', downgradeTo)
            .single()

          await adminSupabase
            .from('tenants')
            .update({
              plan:         downgradeTo,
              max_students: freePlan?.max_students ?? 5,
            })
            .eq('id', affectedTenantId)
        }

        console.log(`[webhook/abacatepay] Assinatura ${event.data.subscription.id} cancelada — tenant rebaixado para Free`)
        break
      }

      default:
        console.log(`[webhook/abacatepay] Evento não tratado: ${event.event}`)
    }

    // 7. Registrar evento processado (idempotência)
    await recordEvent(adminSupabase, event, rawBody)

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[webhook/abacatepay] Erro ao processar:', err)
    // Retorna 500 para AbacatePay retentar
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordEvent(supabase: any, event: WebhookEvent, rawBody: string) {
  await supabase
    .from('webhook_events')
    .upsert({
      id:      event.id,
      event:   event.event,
      payload: JSON.parse(rawBody),
    }, { onConflict: 'id' })
}
