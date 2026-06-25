import { createClient } from '@/lib/supabase/server'
import { PlanUpgradeButton } from '@/components/dashboard/plan-upgrade-button'
import { Check, AlertCircle, CheckCircle2, CreditCard, Zap } from 'lucide-react'

// ─── Constantes visuais ──────────────────────────────────────────────────────

const PLAN_STYLE: Record<string, {
  border: string
  badge: string
  accent: string
  dot: string
}> = {
  free:    { border: 'border-surface-border',       badge: 'text-text-secondary bg-surface-border/40 border-surface-border',     accent: '#6b7280', dot: '#6b7280' },
  pro:     { border: 'border-brand-lime/30',         badge: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20',              accent: '#E8FF47', dot: '#E8FF47' },
  premium: { border: 'border-status-warning/30',     badge: 'text-status-warning bg-status-warning/10 border-status-warning/20',  accent: '#f59e0b', dot: '#f59e0b' },
}

export default async function PlanosDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string; error?: string; info?: string }>
}) {
  const params     = await searchParams
  const supabase   = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Tenant e plano atual
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user!.id)
    .single()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan, max_students, business_name')
    .eq('id', profile!.tenant_id!)
    .single()

  // Todos os planos disponíveis
  const { data: plans } = await supabase
    .from('plans')
    .select('id, slug, name, description, price_brl, max_students, features, is_active')
    .eq('is_active', true)
    .order('sort_order')

  // Assinatura ativa do tenant
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_slug, status, method, receipt_url, created_at')
    .eq('tenant_id', profile!.tenant_id!)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const currentPlan = tenant?.plan ?? 'free'

  // Contagem de alunos ativos
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', profile!.tenant_id!)
    .eq('status', 'active')

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Planos
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Gerencie sua assinatura e escolha o plano ideal para o seu negócio.
        </p>
      </div>

      {/* Feedback de sucesso */}
      {params.success === '1' && (
        <div className="flex items-start gap-3 bg-status-success/10 border border-status-success/20 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} className="text-status-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-status-success">Pagamento confirmado!</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Seu plano {params.plan && <strong>{params.plan.charAt(0).toUpperCase() + params.plan.slice(1)}</strong>} foi ativado.
              O acesso completo já está disponível.
            </p>
          </div>
        </div>
      )}

      {/* Feedback de erro */}
      {params.error && (
        <div className="flex items-start gap-3 bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-status-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-status-error">
            {params.error === 'checkout_failed' || params.error?.startsWith('checkout_failed:')
              ? 'Não foi possível iniciar o pagamento. Tente novamente ou entre em contato com o suporte.'
              : params.error === 'product_unavailable'
              ? 'Produto não disponível no momento. Entre em contato com o suporte.'
              : params.error === 'already_active'
              ? 'Você já possui este plano ativo.'
              : 'Ocorreu um erro. Tente novamente.'}
            {/* Detalhe técnico visível apenas em dev */}
            {params.error?.startsWith('checkout_failed:') && (
              <span className="block mt-1 text-xs opacity-70 font-mono">
                {params.error.replace('checkout_failed: ', '')}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Plano atual */}
      <div className={`bg-surface border-2 rounded-xl p-5 flex items-center gap-4 ${PLAN_STYLE[currentPlan]?.border ?? 'border-surface-border'}`}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${PLAN_STYLE[currentPlan]?.dot}20`, border: `1px solid ${PLAN_STYLE[currentPlan]?.dot}30` }}>
          <CreditCard size={20} style={{ color: PLAN_STYLE[currentPlan]?.dot }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-body font-medium text-text-secondary text-xs">Plano atual</p>
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_STYLE[currentPlan]?.badge ?? ''}`}>
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </span>
            {subscription && (
              <span className="inline-flex items-center gap-1 text-xs text-status-success">
                <CheckCircle2 size={11} /> Ativa
              </span>
            )}
          </div>
          <p className="text-text-primary text-sm mt-1">
            <strong>{studentCount ?? 0}</strong> aluno{studentCount !== 1 ? 's' : ''} ativos
            {' '}de{' '}
            <strong>{tenant?.max_students === 9999 ? 'ilimitados' : tenant?.max_students ?? 5}</strong>
          </p>
          {subscription?.method && (
            <p className="text-xs text-text-secondary/60 mt-0.5">
              Pagamento via {subscription.method === 'CARD' ? 'Cartão de crédito' : 'PIX'} · renovação mensal automática
            </p>
          )}
        </div>
        {subscription?.receipt_url && (
          <a
            href={subscription.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-lime hover:underline flex-shrink-0"
          >
            Ver recibo →
          </a>
        )}
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(plans ?? []).map((plan) => {
          const style       = PLAN_STYLE[plan.slug] ?? PLAN_STYLE.free
          const isCurrent   = currentPlan === plan.slug
          const features    = Array.isArray(plan.features) ? plan.features as string[] : []
          const isUpgrade   = plan.slug !== 'free' && !isCurrent

          return (
            <div
              key={plan.id}
              className={`bg-surface border-2 rounded-2xl overflow-hidden flex flex-col transition-all ${style.border} ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
              style={isCurrent ? { '--tw-ring-color': style.dot } as React.CSSProperties : {}}
            >
              <div className="h-1" style={{ backgroundColor: style.dot }} />

              <div className="p-6 flex flex-col flex-1 space-y-4">

                {/* Badge + nome */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-xs text-status-success font-medium">
                        <CheckCircle2 size={11} /> Ativo
                      </span>
                    )}
                    {plan.slug === 'pro' && !isCurrent && currentPlan === 'free' && (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-lime font-medium">
                        <Zap size={11} /> Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{plan.description}</p>
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

                {/* Limite */}
                <p className="text-xs text-text-secondary">
                  {plan.max_students >= 9999 ? 'Alunos ilimitados' : `Até ${plan.max_students} alunos`}
                </p>

                {/* Features */}
                <div className="flex-1 space-y-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: style.dot }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-surface-border">
                  {isCurrent ? (
                    <div className="w-full text-center text-xs text-text-secondary/60 py-2">
                      Seu plano atual
                    </div>
                  ) : plan.slug === 'free' ? (
                    <div className="w-full text-center text-xs text-text-secondary/60 py-2">
                      Plano básico gratuito
                    </div>
                  ) : isUpgrade ? (
                    <PlanUpgradeButton
                      planSlug={plan.slug as 'pro' | 'premium'}
                      label={`Assinar ${plan.name}`}
                      variant={plan.slug === 'pro' ? 'primary' : 'outline'}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* FAQ / info */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-3">
        <p className="text-sm font-body font-semibold text-text-primary">Dúvidas sobre planos?</p>
        <p className="text-sm text-text-secondary">
          Entre em contato com o suporte ou acesse nossa central de ajuda para saber mais sobre cada plano.
        </p>
      </div>
    </div>
  )
}
