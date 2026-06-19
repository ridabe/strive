import { createClient } from '@/lib/supabase/server'
import { EditPlanDialog } from '@/components/admin/edit-plan-dialog'
import { Check, Users, DollarSign, Building2, AlertTriangle } from 'lucide-react'

const PLAN_ACCENT: Record<string, { border: string; badge: string; dot: string }> = {
  free:    { border: 'border-surface-border',         badge: 'text-text-secondary  bg-surface-border/40     border-surface-border',       dot: '#6b7280' },
  pro:     { border: 'border-brand-lime/30',           badge: 'text-brand-lime      bg-brand-lime/10         border-brand-lime/20',         dot: '#E8FF47' },
  premium: { border: 'border-status-warning/30',       badge: 'text-status-warning  bg-status-warning/10     border-status-warning/20',     dot: '#f59e0b' },
}

export default async function PlanosPage() {
  const supabase = await createClient()

  const [{ data: plans }, { data: tenants }] = await Promise.all([
    supabase.from('plans').select('*').order('sort_order'),
    supabase.from('tenants').select('plan, status'),
  ])

  const allTenants = tenants ?? []

  // Contagem de tenants por plano
  const countByPlan = allTenants.reduce<Record<string, { total: number; active: number }>>((acc, t) => {
    if (!acc[t.plan]) acc[t.plan] = { total: 0, active: 0 }
    acc[t.plan].total++
    if (t.status === 'active') acc[t.plan].active++
    return acc
  }, {})

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Planos
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Configure os planos disponíveis e os limites de cada um.
        </p>
      </div>

      {/* Aviso de impacto */}
      <div className="flex items-start gap-3 bg-status-warning/5 border border-status-warning/20 rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="text-status-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Alterar o <strong className="text-text-primary">limite de alunos</strong> de um plano atualiza imediatamente todos os clientes nesse plano.
          O <strong className="text-text-primary">trigger de banco</strong> garante que nenhum cliente ultrapasse o limite ao adicionar novos alunos.
        </p>
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(plans ?? []).map((plan) => {
          const accent  = PLAN_ACCENT[plan.slug] ?? PLAN_ACCENT.free
          const usage   = countByPlan[plan.slug] ?? { total: 0, active: 0 }
          const features = Array.isArray(plan.features) ? plan.features as string[] : []

          // MRR estimado desse plano
          const mrr = usage.active * plan.price_brl

          return (
            <div
              key={plan.id}
              className={`bg-surface border-2 rounded-2xl overflow-hidden flex flex-col transition-all ${accent.border} ${!plan.is_active ? 'opacity-50' : ''}`}
            >
              {/* Barra colorida no topo */}
              <div className="h-1" style={{ backgroundColor: accent.dot }} />

              <div className="p-6 flex flex-col flex-1 space-y-5">

                {/* Badge + nome */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border mb-2 ${accent.badge}`}>
                      {plan.name}
                    </span>
                    {!plan.is_active && (
                      <span className="ml-2 text-xs text-text-secondary/60 italic">inativo</span>
                    )}
                    <p className="text-xs text-text-secondary leading-relaxed mt-1">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Preço */}
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-text-primary">
                    {plan.price_brl === 0 ? 'Grátis' : `R$${plan.price_brl}`}
                  </span>
                  {plan.price_brl > 0 && (
                    <span className="text-xs text-text-secondary">/mês</span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background rounded-xl p-3 text-center space-y-0.5">
                    <Users size={14} className="text-text-secondary/60 mx-auto" />
                    <p className="font-display font-bold text-base text-text-primary">
                      {plan.max_students >= 9999 ? '∞' : plan.max_students}
                    </p>
                    <p className="text-[10px] text-text-secondary/60">alunos</p>
                  </div>
                  <div className="bg-background rounded-xl p-3 text-center space-y-0.5">
                    <Building2 size={14} className="text-text-secondary/60 mx-auto" />
                    <p className="font-display font-bold text-base text-text-primary">
                      {usage.active}
                    </p>
                    <p className="text-[10px] text-text-secondary/60">ativos</p>
                  </div>
                  <div className="bg-background rounded-xl p-3 text-center space-y-0.5">
                    <DollarSign size={14} className="text-text-secondary/60 mx-auto" />
                    <p className="font-display font-bold text-base text-text-primary">
                      {mrr === 0 ? '—' : `R$${mrr}`}
                    </p>
                    <p className="text-[10px] text-text-secondary/60">MRR</p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: accent.dot }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="pt-4 border-t border-surface-border">
                  <EditPlanDialog plan={{
                    id:           plan.id,
                    slug:         plan.slug,
                    name:         plan.name,
                    description:  plan.description,
                    price_brl:    plan.price_brl,
                    max_students: plan.max_students,
                    features,
                    is_active:    plan.is_active,
                  }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabela de uso por plano */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Distribuição de clientes por plano
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs text-text-secondary">
              <th className="px-5 py-3 text-left font-medium">Plano</th>
              <th className="px-5 py-3 text-right font-medium">Clientes totais</th>
              <th className="px-5 py-3 text-right font-medium">Ativos</th>
              <th className="px-5 py-3 text-right font-medium">Inativos / Suspensos</th>
              <th className="px-5 py-3 text-right font-medium">MRR estimado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {(plans ?? []).map((plan) => {
              const usage = countByPlan[plan.slug] ?? { total: 0, active: 0 }
              const accent = PLAN_ACCENT[plan.slug] ?? PLAN_ACCENT.free
              const mrr = usage.active * plan.price_brl
              return (
                <tr key={plan.id} className="hover:bg-surface-border/10 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${accent.badge}`}>
                      {plan.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-text-primary font-medium">{usage.total}</td>
                  <td className="px-5 py-3.5 text-right text-status-success font-medium">{usage.active}</td>
                  <td className="px-5 py-3.5 text-right text-text-secondary">{usage.total - usage.active}</td>
                  <td className="px-5 py-3.5 text-right text-text-primary font-display font-bold">
                    {mrr === 0 ? '—' : `R$${mrr}`}
                  </td>
                </tr>
              )
            })}
            {/* Total */}
            <tr className="bg-surface-border/10 font-semibold">
              <td className="px-5 py-3.5 text-text-primary text-xs uppercase tracking-wider">Total</td>
              <td className="px-5 py-3.5 text-right text-text-primary">{allTenants.length}</td>
              <td className="px-5 py-3.5 text-right text-status-success">
                {allTenants.filter(t => t.status === 'active').length}
              </td>
              <td className="px-5 py-3.5 text-right text-text-secondary">
                {allTenants.filter(t => t.status !== 'active').length}
              </td>
              <td className="px-5 py-3.5 text-right text-brand-lime font-display font-bold">
                R${(plans ?? []).reduce((sum, p) => {
                  const u = countByPlan[p.slug] ?? { active: 0 }
                  return sum + u.active * p.price_brl
                }, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
