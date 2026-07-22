'use server'

import { revalidatePath } from 'next/cache'
import { getCtx } from '@/lib/supabase/context'
import { canManageBilling } from '@/lib/permissions'
import { generateMonthlyChargesFor, markOverdueChargesFor } from '@/lib/billing/core'
import type { PaymentMethod } from '@/types/db-enums'

const BILLING_PATH = '/dashboard/financeiro'

// ── Contexto comum: tenant, papel efetivo e se é academia ────────────────────
async function getBillingCtx() {
  const ctx = await getCtx()
  if (!ctx) return { error: 'Não autenticado' as const }

  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', ctx.tenantId)
    .single()

  const isAcademia = tenant?.tenant_type === 'academia'

  if (!canManageBilling(ctx.role, isAcademia)) {
    return { error: 'Você não tem acesso ao financeiro.' as const }
  }

  return { supabase: ctx.supabase, tenantId: ctx.tenantId }
}

// ── Criar ou atualizar a assinatura recorrente de um aluno ───────────────────
export async function upsertStudentSubscription(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  const { supabase, tenantId } = ctx

  const studentId = formData.get('student_id') as string
  const amountRaw = formData.get('amount') as string
  const dueDayRaw = formData.get('due_day') as string
  const planName  = (formData.get('plan_name') as string)?.trim() || 'Mensalidade'

  const amount = Number(amountRaw)
  const dueDay = Number(dueDayRaw)

  if (!studentId) return { error: 'Aluno não informado.' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Valor inválido.' }
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    return { error: 'Dia de vencimento deve ser entre 1 e 28.' }
  }

  const { error } = await supabase
    .from('student_billing_subscriptions')
    .upsert(
      { tenant_id: tenantId, student_id: studentId, plan_name: planName, amount, due_day: dueDay, active: true },
      { onConflict: 'student_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(BILLING_PATH)
  revalidatePath(`/dashboard/alunos/${studentId}`)
  return {}
}

// ── Criar um pacote fechado de N meses (gera todas as parcelas de uma vez) ───
// Diferente de upsertStudentSubscription: aqui as parcelas (financial_plans)
// não esperam o cron/geração mensal — são todas criadas já na hora, com
// vencimento mensal a partir do mês corrente. A baixa de cada mês continua
// usando registerPayment normalmente.
export async function createPackageSubscription(formData: FormData): Promise<{ error?: string; created?: number }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  const { supabase, tenantId } = ctx

  const studentId  = formData.get('student_id') as string
  const amountRaw  = formData.get('amount') as string
  const dueDayRaw  = formData.get('due_day') as string
  const planName   = (formData.get('plan_name') as string)?.trim() || 'Mensalidade'
  const totalRaw   = formData.get('total_installments') as string

  const amount = Number(amountRaw)
  const dueDay = Number(dueDayRaw)
  const totalInstallments = Number(totalRaw)

  if (!studentId) return { error: 'Aluno não informado.' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Valor inválido.' }
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    return { error: 'Dia de vencimento deve ser entre 1 e 28.' }
  }
  if (!Number.isInteger(totalInstallments) || totalInstallments < 1 || totalInstallments > 24) {
    return { error: 'Número de meses deve ser entre 1 e 24.' }
  }

  const { data: subscription, error: subError } = await supabase
    .from('student_billing_subscriptions')
    .upsert(
      {
        tenant_id: tenantId,
        student_id: studentId,
        plan_name: planName,
        amount,
        due_day: dueDay,
        active: true,
        billing_type: 'pacote',
        total_installments: totalInstallments,
      },
      { onConflict: 'student_id' }
    )
    .select('id')
    .single()

  if (subError) return { error: subError.message }

  // Ano/mês em UTC — mesmo cuidado de generateMonthlyChargesFor (evita rolar
  // pro dia/mês errado conforme o fuso do servidor).
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() // 0-indexed
  const pad = (n: number) => String(n).padStart(2, '0')

  const rows = Array.from({ length: totalInstallments }, (_, i) => {
    const d = new Date(Date.UTC(year, month + i, 1))
    return {
      tenant_id:       tenantId,
      student_id:      studentId,
      subscription_id: subscription.id,
      plan_name:       planName,
      amount,
      due_date:        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(dueDay)}`,
      status:          'pending' as const,
    }
  })

  const { error: insertError } = await supabase.from('financial_plans').insert(rows)
  // 23505 = unique_violation — parcela do mês já existe (reenvio do form ou
  // pacote recriado); não é um erro fatal, só ignora as que já existem.
  if (insertError && insertError.code !== '23505') return { error: insertError.message }

  revalidatePath(BILLING_PATH)
  revalidatePath(`/dashboard/alunos/${studentId}`)
  return { created: rows.length }
}

// ── Desativar a recorrência de um aluno (não cancela cobranças já geradas) ───
export async function deactivateStudentSubscription(subscriptionId: string): Promise<{ error?: string }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase
    .from('student_billing_subscriptions')
    .update({ active: false })
    .eq('id', subscriptionId)

  if (error) return { error: error.message }

  revalidatePath(BILLING_PATH)
  return {}
}

// ── Gera as cobranças do mês corrente para assinaturas ativas ────────────────
// Idempotente: chamada toda vez que o financeiro é aberto (sem cron por
// enquanto). Só cria a cobrança se ainda não existir uma para o mês corrente
// daquela assinatura.
export async function generateMonthlyCharges(): Promise<{ error?: string; created?: number }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  return generateMonthlyChargesFor(ctx.supabase, ctx.tenantId)
}

// ── Marca como atrasada toda cobrança pendente cujo vencimento já passou ─────
export async function markOverdueCharges(): Promise<{ error?: string }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  return markOverdueChargesFor(ctx.supabase, ctx.tenantId)
}

// ── Baixa manual de uma cobrança ──────────────────────────────────────────────
export async function registerPayment(formData: FormData): Promise<{ error?: string }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  const { supabase } = ctx

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const chargeId      = formData.get('charge_id') as string
  const paymentMethod = formData.get('payment_method') as PaymentMethod
  const notes         = (formData.get('notes') as string)?.trim() || null

  if (!chargeId) return { error: 'Cobrança não informada.' }
  if (!paymentMethod) return { error: 'Forma de pagamento é obrigatória.' }

  const { error } = await supabase
    .from('financial_plans')
    .update({
      status:         'paid',
      paid_at:        new Date().toISOString(),
      paid_by:        user.id,
      payment_method: paymentMethod,
      notes,
    })
    .eq('id', chargeId)

  if (error) return { error: error.message }

  revalidatePath(BILLING_PATH)
  return {}
}

// ── Reverte uma baixa dada por engano ────────────────────────────────────────
export async function undoPayment(chargeId: string): Promise<{ error?: string }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  const { supabase } = ctx

  const { data: charge } = await supabase
    .from('financial_plans')
    .select('due_date')
    .eq('id', chargeId)
    .single()

  if (!charge) return { error: 'Cobrança não encontrada.' }

  const today = new Date().toISOString().slice(0, 10)
  const status = charge.due_date < today ? 'overdue' : 'pending'

  const { error } = await supabase
    .from('financial_plans')
    .update({ status, paid_at: null, paid_by: null, payment_method: null })
    .eq('id', chargeId)

  if (error) return { error: error.message }

  revalidatePath(BILLING_PATH)
  return {}
}

// ── Cancela uma cobrança (ex.: aluno saiu antes do vencimento) ───────────────
export async function cancelCharge(chargeId: string): Promise<{ error?: string }> {
  const ctx = await getBillingCtx()
  if ('error' in ctx) return { error: ctx.error }
  const { supabase } = ctx

  const { error } = await supabase
    .from('financial_plans')
    .update({ status: 'cancelled' })
    .eq('id', chargeId)

  if (error) return { error: error.message }

  revalidatePath(BILLING_PATH)
  return {}
}
