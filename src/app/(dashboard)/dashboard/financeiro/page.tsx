import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAcademiaModuleAccess } from '@/lib/supabase/module-access'
import { Receipt, CheckCircle2, Clock, AlertCircle, Wallet } from 'lucide-react'
import { joinOne } from '@/lib/supabase/join'
import { generateMonthlyCharges, markOverdueCharges } from '@/actions/student-billing'
import { PaymentActions } from './payment-actions'
import { NewSubscriptionForm, SubscriptionRow } from './subscription-form'
import { FinanceiroGuide } from './financeiro-guide'

// Garante que toda troca de aba/filtro (?aba=...) sempre busque dados novos —
// sem isso, o Client Router Cache do Next 15 pode reaproveitar uma renderização
// anterior da mesma rota e mostrar KPIs/cobranças desatualizados.
export const dynamic = 'force-dynamic'

// due_date vem como "YYYY-MM-DD" (sem hora) — usar `new Date(str)` interpreta
// como UTC meia-noite e pode exibir o dia anterior conforme o fuso do
// navegador. Formata direto a partir da string, sem passar por Date/TZ.
function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  paid:      { label: 'Pago',      icon: CheckCircle2, color: 'text-status-success bg-status-success/10 border-status-success/20' },
  pending:   { label: 'Pendente',  icon: Clock,        color: 'text-status-warning bg-status-warning/10 border-status-warning/20' },
  overdue:   { label: 'Atrasado',  icon: AlertCircle,  color: 'text-status-error bg-status-error/10 border-status-error/20'     },
  cancelled: { label: 'Cancelado', icon: Receipt,      color: 'text-text-secondary bg-background border-surface-border'          },
}

const TABS = [
  { value: 'hoje',        label: 'Hoje' },
  { value: 'atrasados',   label: 'Inadimplentes' },
  { value: 'todas',       label: 'Todas' },
  { value: 'assinaturas', label: 'Mensalidades' },
]

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  await requireAcademiaModuleAccess('faturas')
  const { aba: tab = 'hoje' } = await searchParams
  const supabase = await createClient()

  // Tema academia usa tipografia neutra (sentence case, números tabulares).
  const { data: { user } } = await supabase.auth.getUser()
  const { data: prof } = user
    ? await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    : { data: null }
  const { data: tnt } = prof?.tenant_id
    ? await supabase.from('tenants').select('tenant_type').eq('id', prof.tenant_id).single()
    : { data: null }
  const isAcademia = tnt?.tenant_type === 'academia'

  // Gera as cobranças do mês (idempotente) e atualiza atrasados toda vez que a
  // tela é aberta — ainda não há cron configurado no projeto.
  await generateMonthlyCharges()
  await markOverdueCharges()

  const today = new Date().toISOString().slice(0, 10)

  const { data: allCharges } = await supabase
    .from('financial_plans')
    .select(`
      id, plan_name, amount, status, due_date, paid_at, payment_method,
      students ( full_name ),
      profiles!financial_plans_paid_by_fkey ( full_name )
    `)
    .order('due_date', { ascending: false })
    .limit(200)

  const paid    = allCharges?.filter((i) => i.status === 'paid') ?? []
  const pending = allCharges?.filter((i) => i.status === 'pending') ?? []
  const overdue = allCharges?.filter((i) => i.status === 'overdue') ?? []
  const mrr     = paid.reduce((acc, i) => acc + i.amount, 0)
  const owed    = overdue.reduce((acc, i) => acc + i.amount, 0)

  const dueToday = pending.filter((i) => i.due_date === today)

  const visibleCharges =
    tab === 'hoje'      ? dueToday :
    tab === 'atrasados' ? overdue :
    allCharges ?? []

  // ── Assinaturas (mensalidade recorrente ou pacote de N meses) ───────────
  const { data: subscriptions } = await supabase
    .from('student_billing_subscriptions')
    .select('id, student_id, plan_name, amount, due_day, active, billing_type, total_installments, sync_to_agenda, students ( full_name )')
    .eq('active', true)
    .order('due_day')

  // Progresso dos pacotes: conta quantas parcelas de cada assinatura-pacote
  // já foram pagas (para exibir "3/6" e avisar quando quitar o pacote inteiro).
  const packageSubscriptionIds = (subscriptions ?? [])
    .filter((s) => s.billing_type === 'pacote')
    .map((s) => s.id)

  const paidCountBySubscription = new Map<string, number>()
  if (packageSubscriptionIds.length) {
    const { data: packageCharges } = await supabase
      .from('financial_plans')
      .select('subscription_id, status')
      .in('subscription_id', packageSubscriptionIds)

    for (const c of packageCharges ?? []) {
      if (c.status === 'paid' && c.subscription_id) {
        paidCountBySubscription.set(c.subscription_id, (paidCountBySubscription.get(c.subscription_id) ?? 0) + 1)
      }
    }
  }

  const { data: activeStudents } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('status', 'active')
    .order('full_name')

  const subscribedIds = new Set((subscriptions ?? []).map((s) => s.student_id))
  const studentsWithoutSubscription = (activeStudents ?? []).filter((s) => !subscribedIds.has(s.id))

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className={
              isAcademia
                ? 'text-xl md:text-2xl font-semibold text-text-primary tracking-tight'
                : 'font-display text-2xl font-bold text-text-primary uppercase tracking-widest'
            }
          >
            Financeiro
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Mensalidades e cobranças dos seus alunos.
          </p>
        </div>
        <FinanceiroGuide />
      </div>

      {/* Ação principal — sempre visível, em qualquer aba, para não ficar
          escondida atrás da aba "Mensalidades". */}
      <NewSubscriptionForm students={studentsWithoutSubscription} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Recebido',      value: `R$ ${mrr.toFixed(2).replace('.', ',')}`,  color: 'text-status-success' },
          { label: 'Vencem hoje',   value: dueToday.length,                           color: 'text-status-warning' },
          { label: 'Inadimplentes', value: overdue.length,                            color: 'text-status-error'   },
          { label: 'Em aberto',     value: `R$ ${owed.toFixed(2).replace('.', ',')}`,  color: 'text-status-error'   },
        ].map((k) => (
          <div key={k.label} className="bg-surface border border-surface-border rounded-xl p-4">
            <p className={`text-2xl ${isAcademia ? 'font-semibold tabular-nums' : 'font-display font-bold'} ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`?aba=${t.value}`}
            className={`px-3 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
              tab === t.value
                ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                : 'text-text-secondary hover:text-text-primary border border-surface-border'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'assinaturas' ? (
        <div className="space-y-4">
          {!subscriptions?.length ? (
            <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
              <Wallet size={32} className="text-text-secondary/40 mx-auto" />
              <div>
                <p className="font-body font-medium text-text-primary">Nenhuma cobrança configurada</p>
                <p className="text-sm text-text-secondary mt-1">
                  Cadastre uma mensalidade recorrente ou um pacote fechado de meses para começar a cobrar seus alunos.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Aluno</th>
                    <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Plano</th>
                    <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">Valor / vencimento</th>
                    <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {subscriptions.map((s) => {
                    const student = joinOne<{ full_name: string }>(s.students)
                    return (
                      <SubscriptionRow
                        key={s.id}
                        subscription={{ ...s, paidInstallments: paidCountBySubscription.get(s.id) ?? 0 }}
                        studentName={student?.full_name ?? '—'}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : visibleCharges.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
          <Receipt size={32} className="text-text-secondary/40 mx-auto" />
          <div>
            <p className="font-body font-medium text-text-primary">
              {tab === 'hoje' ? 'Nenhum vencimento hoje' : tab === 'atrasados' ? 'Nenhum inadimplente' : 'Nenhuma cobrança registrada'}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              As cobranças dos alunos serão exibidas aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Aluno</th>
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Plano</th>
                <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">Valor</th>
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Vencimento</th>
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Status</th>
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium hidden lg:table-cell">Baixa</th>
                <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visibleCharges.map((inv) => {
                const student = joinOne<{ full_name: string }>(inv.students)
                const paidBy  = joinOne<{ full_name: string }>(inv.profiles)
                const cfg     = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending
                const Icon    = cfg.icon
                return (
                  <tr key={inv.id} className="hover:bg-surface-border/10">
                    <td className="px-5 py-3.5 text-text-primary font-medium truncate max-w-[140px]">
                      {student?.full_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary hidden sm:table-cell truncate max-w-[120px]">
                      {inv.plan_name}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-primary font-medium">
                      R$ {inv.amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary hidden md:table-cell">
                      {formatDateBR(inv.due_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary hidden lg:table-cell text-xs">
                      {inv.status === 'paid' && paidBy ? `${paidBy.full_name}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <PaymentActions chargeId={inv.id} status={inv.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
