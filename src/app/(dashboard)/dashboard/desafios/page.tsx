import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getChallenges } from '@/app/actions/challenges'
import { PlanUpgradeButton } from '@/components/dashboard/plan-upgrade-button'
import { Trophy, Plus, Lock, Users } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  finished: 'Aguardando publicação',
  published: 'Publicado',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-text-secondary bg-surface-border/40 border-surface-border',
  active: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  finished: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  published: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

export default async function DesafiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['personal', 'global_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Verificar se o módulo está habilitado para este tenant
  if (profile.tenant_id) {
    const { data: tenantModule } = await supabase
      .from('tenant_modules')
      .select('enabled, system_modules!inner(slug)')
      .eq('tenant_id', profile.tenant_id)
      .eq('system_modules.slug', 'desafios')
      .single()

    if (!tenantModule?.enabled) redirect('/dashboard')
  }

  // Plano Free não tem acesso ao módulo (evita conflito com limite de vagas)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', profile.tenant_id ?? '')
    .single()

  if (tenant?.plan === 'free') {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="bg-surface border border-surface-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <Lock size={24} className="text-brand-lime" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
              Desafios é um recurso Pro
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
              Crie desafios com regras, premiações e acompanhamento diário para seus alunos.
              Disponível a partir do plano Pro.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xs mx-auto pt-2">
            <PlanUpgradeButton planSlug="pro" label="Assinar Pro" />
            <PlanUpgradeButton planSlug="premium" label="Assinar Premium" variant="outline" />
          </div>
        </div>
      </div>
    )
  }

  const challenges = await getChallenges()

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
            <Trophy size={18} className="text-brand-lime" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
              Desafios
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Crie desafios com regras, premiações e acompanhamento diário
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/desafios/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={15} />
          Novo Desafio
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <Trophy size={22} className="text-brand-lime" />
          </div>
          <p className="font-body font-medium text-text-primary">Nenhum desafio criado ainda</p>
          <p className="text-sm text-text-secondary">
            Clique em &quot;Novo Desafio&quot; para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {challenges.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/desafios/${c.id}`}
              className="bg-surface border border-surface-border rounded-xl overflow-hidden hover:border-brand-lime/30 transition-colors"
            >
              {c.cover_image_url && (
                <div className="relative aspect-[1200/630] w-full">
                  <Image src={c.cover_image_url} alt={c.name} fill unoptimized className="object-cover" />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-body font-semibold text-text-primary">{c.name}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLE[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>
                {c.description && (
                  <p className="text-xs text-text-secondary line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-text-secondary pt-1">
                  <span className="flex items-center gap-1.5">
                    <Users size={12} />
                    {c.participant_count} participante{c.participant_count !== 1 ? 's' : ''}
                  </span>
                  <span>{c.duration_days} dias</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
