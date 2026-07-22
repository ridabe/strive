import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Receipt, ArrowLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudentRow } from '@/lib/supabase/student-context'

// due_date vem como "YYYY-MM-DD" (sem hora) — formata direto da string, sem
// passar por Date/TZ (mesmo cuidado do financeiro do personal).
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

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const student = await getActiveStudentRow(supabase, user.id)
  if (!student) redirect('/student')

  const { data: charges } = await supabase
    .from('financial_plans')
    .select('id, plan_name, amount, status, due_date, paid_at, subscription_id')
    .eq('student_id', student.id)
    .order('due_date', { ascending: false })
    .limit(100)

  const { data: subscription } = await supabase
    .from('student_billing_subscriptions')
    .select('id, plan_name, amount, due_day, billing_type, total_installments, active')
    .eq('student_id', student.id)
    .eq('active', true)
    .maybeSingle()

  const rows = charges ?? []
  const pending = rows.filter((c) => c.status === 'pending')
  const overdue = rows.filter((c) => c.status === 'overdue')

  const isPacote = subscription?.billing_type === 'pacote'
  const total = subscription?.total_installments ?? 0
  const paidInPackage = isPacote
    ? rows.filter((c) => c.subscription_id === subscription?.id && c.status === 'paid').length
    : 0
  const packageDone = isPacote && total > 0 && paidInPackage >= total

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-lg">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center flex-shrink-0">
          <Receipt size={18} className="text-sky-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Financeiro
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Suas mensalidades e histórico de pagamentos.
          </p>
        </div>
      </div>

      {/* Resumo da assinatura ativa */}
      {subscription && (
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-2">
          <p className="text-xs text-text-secondary uppercase tracking-widest font-display font-bold">
            {isPacote ? 'Pacote atual' : 'Mensalidade'}
          </p>
          <p className="text-text-primary font-medium">{subscription.plan_name}</p>
          <p className="text-sm text-text-secondary">
            R$ {subscription.amount.toFixed(2).replace('.', ',')} / mês · vencimento todo dia {subscription.due_day}
          </p>
          {isPacote && (
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${
                  packageDone
                    ? 'text-status-warning bg-status-warning/10 border-status-warning/20'
                    : 'text-sky-400 bg-sky-400/10 border-sky-400/20'
                }`}
              >
                {paidInPackage} de {total} meses pagos
              </span>
              {packageDone && (
                <span className="text-xs text-text-secondary">Fale com seu personal para renovar.</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cobranças em aberto */}
      {(pending.length > 0 || overdue.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary uppercase tracking-widest font-display font-bold">
            Em aberto
          </p>
          <div className="bg-surface border border-surface-border rounded-2xl divide-y divide-surface-border overflow-hidden">
            {[...overdue, ...pending].map((c) => {
              const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm text-text-primary font-medium">{c.plan_name}</p>
                    <p className="text-xs text-text-secondary">Vence em {formatDateBR(c.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-primary font-medium">
                      R$ {c.amount.toFixed(2).replace('.', ',')}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      <Icon size={10} />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="space-y-2">
        <p className="text-xs text-text-secondary uppercase tracking-widest font-display font-bold">
          Histórico
        </p>
        {rows.length === 0 ? (
          <div className="bg-surface border border-surface-border rounded-2xl p-8 text-center">
            <Receipt size={28} className="text-text-secondary/40 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Nenhuma cobrança registrada ainda.</p>
          </div>
        ) : (
          <div className="bg-surface border border-surface-border rounded-2xl divide-y divide-surface-border overflow-hidden">
            {rows.map((c) => {
              const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-text-primary">{c.plan_name}</p>
                    <p className="text-xs text-text-secondary">
                      {c.status === 'paid' && c.paid_at
                        ? `Pago em ${formatDateBR(c.paid_at.slice(0, 10))}`
                        : `Vencimento ${formatDateBR(c.due_date)}`}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Link
        href="/student"
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar ao início
      </Link>
    </div>
  )
}
