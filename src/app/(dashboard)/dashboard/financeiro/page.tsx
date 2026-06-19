import { createClient } from '@/lib/supabase/server'
import { Receipt, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { joinOne } from '@/lib/supabase/join'

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  paid:      { label: 'Pago',      icon: CheckCircle2, color: 'text-status-success bg-status-success/10 border-status-success/20' },
  pending:   { label: 'Pendente',  icon: Clock,        color: 'text-status-warning bg-status-warning/10 border-status-warning/20' },
  overdue:   { label: 'Atrasado',  icon: AlertCircle,  color: 'text-status-error bg-status-error/10 border-status-error/20'     },
  cancelled: { label: 'Cancelado', icon: Receipt,      color: 'text-text-secondary bg-background border-surface-border'          },
}

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('financial_plans')
    .select(`
      id, plan_name, amount, status, due_date, paid_at,
      students ( full_name )
    `)
    .order('due_date', { ascending: false })
    .limit(100)

  const total   = invoices?.length ?? 0
  const paid    = invoices?.filter((i) => i.status === 'paid').length ?? 0
  const pending = invoices?.filter((i) => i.status === 'pending').length ?? 0
  const overdue = invoices?.filter((i) => i.status === 'overdue').length ?? 0

  const mrr = invoices
    ?.filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.amount, 0) ?? 0

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Financeiro
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Faturas e cobranças dos seus alunos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Recebido',   value: `R$ ${mrr.toFixed(2).replace('.', ',')}`, color: 'text-status-success' },
          { label: 'Pagos',      value: paid,    color: 'text-status-success' },
          { label: 'Pendentes',  value: pending, color: 'text-status-warning' },
          { label: 'Atrasados',  value: overdue, color: 'text-status-error'   },
        ].map((k) => (
          <div key={k.label} className="bg-surface border border-surface-border rounded-xl p-4">
            <p className={`font-display font-bold text-2xl ${k.color}`}>{k.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {total === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
          <Receipt size={32} className="text-text-secondary/40 mx-auto" />
          <div>
            <p className="font-body font-medium text-text-primary">Nenhuma fatura registrada</p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {invoices?.map((inv) => {
                const student = joinOne<{ full_name: string }>(inv.students)
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
                      {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
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
