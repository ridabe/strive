import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMonthlyChargesFor, markOverdueChargesFor } from '@/lib/billing/core'
import { pickReminderChannel, sendReminder } from '@/lib/billing/reminder-channels'
import { joinOne } from '@/lib/supabase/join'

// Chamado 1x/dia pelo Vercel Cron (ver vercel.json). Gera as cobranças do mês,
// atualiza atrasados e envia o lembrete de vencimento de hoje, tenant por
// tenant — não depende de ninguém abrir a tela de Financeiro.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, business_name, logo_url, primary_color')
    .eq('status', 'active')

  if (tenantsError) {
    return NextResponse.json({ error: tenantsError.message }, { status: 500 })
  }

  const today = new Date().toISOString().slice(0, 10)
  let generated = 0
  let sent = 0
  let failed = 0

  for (const tenant of tenants ?? []) {
    const genResult = await generateMonthlyChargesFor(supabase, tenant.id)
    generated += genResult.created ?? 0

    await markOverdueChargesFor(supabase, tenant.id)

    const { data: candidates } = await supabase
      .from('financial_plans')
      .select('id, amount, due_date, students ( full_name, email, phone )')
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending')
      .eq('due_date', today)
      .is('reminder_sent_at', null)

    for (const charge of candidates ?? []) {
      const student = joinOne<{ full_name: string; email: string | null; phone: string | null }>(charge.students)
      if (!student) continue

      const channel = pickReminderChannel({ email: student.email, phone: student.phone })
      if (!channel) {
        failed++
        console.error(`[billing-reminders] aluno sem e-mail/telefone — charge=${charge.id}`)
        continue
      }

      const result = await sendReminder(
        channel,
        {
          studentName:  student.full_name,
          businessName: tenant.business_name,
          amount:       charge.amount,
          dueDateISO:   charge.due_date,
          email:        student.email,
          phone:        student.phone,
          logoUrl:      tenant.logo_url,
          primaryColor: tenant.primary_color,
        },
        supabase
      )

      if (result.ok) {
        sent++
        await supabase
          .from('financial_plans')
          .update({ reminder_sent_at: new Date().toISOString(), reminder_channel: result.channel })
          .eq('id', charge.id)
      } else {
        failed++
        console.error(`[billing-reminders] tenant=${tenant.id} charge=${charge.id}: ${result.error}`)
      }
    }
  }

  return NextResponse.json({ generated, sent, failed })
}
