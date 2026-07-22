import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type TypedClient = SupabaseClient<Database>

// ── Gera as cobranças do mês corrente para assinaturas ativas de um tenant ───
// Idempotente: só cria a cobrança se ainda não existir uma para o mês
// corrente daquela assinatura. Usada tanto pela action (sessão do usuário,
// tenant atual) quanto pelo cron de lembretes (admin client, todos os tenants).
export async function generateMonthlyChargesFor(
  supabase: TypedClient,
  tenantId: string
): Promise<{ error?: string; created?: number }> {
  const { data: subscriptions, error: subsError } = await supabase
    .from('student_billing_subscriptions')
    .select('id, student_id, plan_name, amount, due_day, sync_to_agenda')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    // pacote: todas as parcelas já foram geradas de uma vez na criação
    // (ver createPackageSubscription) — não entra na geração mensal automática.
    .eq('billing_type', 'recorrente')

  if (subsError) return { error: subsError.message }
  if (!subscriptions?.length) return { created: 0 }

  // Ano/mês em UTC — evita que new Date(y, m, d).toISOString() role pro
  // dia/mês errado dependendo do fuso do servidor.
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() // 0-indexed
  const pad = (n: number) => String(n).padStart(2, '0')

  const startOfMonth = `${year}-${pad(month + 1)}-01`
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1))
  const startOfNextMonth = `${nextMonthDate.getUTCFullYear()}-${pad(nextMonthDate.getUTCMonth() + 1)}-01`

  const { data: existingCharges, error: chargesError } = await supabase
    .from('financial_plans')
    .select('subscription_id')
    .eq('tenant_id', tenantId)
    .gte('due_date', startOfMonth)
    .lt('due_date', startOfNextMonth)
    .not('subscription_id', 'is', null)

  if (chargesError) return { error: chargesError.message }

  const alreadyBilled = new Set(existingCharges?.map((c) => c.subscription_id))
  const pending = subscriptions.filter((s) => !alreadyBilled.has(s.id))
  if (!pending.length) return { created: 0 }

  const rows = pending.map((s) => ({
    tenant_id:       tenantId,
    student_id:      s.student_id,
    subscription_id: s.id,
    plan_name:       s.plan_name,
    amount:          s.amount,
    due_date:        `${year}-${pad(month + 1)}-${pad(s.due_day)}`,
    status:          'pending' as const,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('financial_plans')
    .insert(rows)
    .select('id, subscription_id, student_id, plan_name, amount, due_date')
  if (insertError) return { error: insertError.message }

  const syncSubscriptionIds = new Set(pending.filter((s) => s.sync_to_agenda).map((s) => s.id))
  const toSync = (inserted ?? []).filter((c) => c.subscription_id && syncSubscriptionIds.has(c.subscription_id))
  if (toSync.length) await createAgendaEventsForCharges(supabase, tenantId, toSync)

  return { created: rows.length }
}

// ── Cria eventos de agenda (type=pagamento_a_receber) para cobranças cuja
// assinatura tem sync_to_agenda=true. Idempotente via índice único em
// agenda_events.financial_plan_id — reprocessamentos são ignorados (23505).
export async function createAgendaEventsForCharges(
  supabase: TypedClient,
  tenantId: string,
  charges: { id: string; student_id: string; plan_name: string; amount: number; due_date: string }[]
) {
  const studentIds = [...new Set(charges.map((c) => c.student_id))]
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .in('id', studentIds)
  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name]))

  const events = charges.map((c) => ({
    tenant_id:         tenantId,
    type:              'pagamento_a_receber',
    title:             c.plan_name,
    event_date:        c.due_date,
    student_id:        c.student_id,
    student_name:      nameById.get(c.student_id) ?? null,
    amount:            c.amount,
    status:            'scheduled',
    origin:            'personal' as const,
    financial_plan_id: c.id,
  }))

  const { error } = await supabase.from('agenda_events').insert(events)
  // 23505 = unique_violation (financial_plan_id já tem evento) — ignora.
  if (error && (error as { code?: string }).code !== '23505') {
    console.error('[billing] falha ao criar eventos de agenda para cobranças:', error.message)
  }
}

// ── Marca como atrasada toda cobrança pendente de um tenant cujo vencimento
// já passou ───────────────────────────────────────────────────────────────
export async function markOverdueChargesFor(
  supabase: TypedClient,
  tenantId: string
): Promise<{ error?: string }> {
  const today = new Date().toISOString().slice(0, 10)

  const { error } = await supabase
    .from('financial_plans')
    .update({ status: 'overdue' })
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .lt('due_date', today)

  if (error) return { error: error.message }
  return {}
}
