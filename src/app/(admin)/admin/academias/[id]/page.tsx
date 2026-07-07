import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, CalendarDays, Users, UsersRound, Crown, CheckCircle2, XCircle, PauseCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AcademiaDetailActions } from '@/components/admin/academia-detail-actions'
import { AcademiaEditForm } from '@/components/admin/academia-edit-form'

const PLAN_LABELS  = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLAN_COLORS  = {
  free:    'text-text-secondary border-surface-border',
  pro:     'text-brand-lime border-brand-lime/30',
  premium: 'text-status-warning border-status-warning/30',
}
const STATUS_CONFIG = {
  active:    { label: 'Ativo',    Icon: CheckCircle2, color: 'text-status-success' },
  inactive:  { label: 'Inativo',  Icon: XCircle,      color: 'text-text-secondary' },
  suspended: { label: 'Suspenso', Icon: PauseCircle,  color: 'text-status-warning' },
}

export default async function AcademiaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }    = await params
  const supabase  = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select(`
      id, business_name, slug, plan, status, primary_color, logo_url,
      max_students, max_personals, self_assign_enabled, abacatepay_customer_id,
      contact_email, contact_phone, notes, tenant_type, created_at, updated_at
    `)
    .eq('id', id)
    .eq('tenant_type', 'academia')
    .single()

  if (!tenant) notFound()

  const { data: owner } = await supabase
    .from('tenant_members')
    .select('user_id, profiles(full_name, email)')
    .eq('tenant_id', id)
    .eq('role', 'owner')
    .maybeSingle()

  const ownerProfile = owner
    ? (Array.isArray(owner.profiles) ? owner.profiles[0] : owner.profiles)
    : null

  const { count: memberCount } = await supabase
    .from('tenant_members')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', id)
    .eq('status', 'active')

  const { count: studentCount } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', id)

  const statusCfg = STATUS_CONFIG[tenant.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.inactive
  const StatusIcon = statusCfg.Icon

  const memberUsagePercent = Math.min(
    Math.round(((memberCount ?? 0) / tenant.max_personals) * 100),
    100
  )

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">

      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/academias"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Academias
        </Link>

        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-xl border border-surface-border flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: tenant.primary_color ? `${tenant.primary_color}15` : '#1A1A2E' }}
          >
            {tenant.logo_url ? (
              <Image
                src={tenant.logo_url}
                alt={`Logo ${tenant.business_name}`}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <span
                className="text-2xl font-display font-black"
                style={{ color: tenant.primary_color ?? '#E8FF47' }}
              >
                {tenant.business_name[0].toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest truncate">
                {tenant.business_name}
              </h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PLAN_COLORS[tenant.plan as keyof typeof PLAN_COLORS]}`}>
                {PLAN_LABELS[tenant.plan as keyof typeof PLAN_LABELS]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span className="font-mono text-xs bg-background border border-surface-border px-2 py-0.5 rounded">
                /{tenant.slug}
              </span>
              <span className={`inline-flex items-center gap-1 ${statusCfg.color}`}>
                <StatusIcon size={13} />
                {statusCfg.label}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={13} />
                {new Date(tenant.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações + link de equipe */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AcademiaDetailActions
          tenantId={tenant.id}
          tenantName={tenant.business_name}
          status={tenant.status as 'active' | 'inactive' | 'suspended'}
        />
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Personais/admins"
          value={`${memberCount ?? 0} / ${tenant.max_personals}`}
          sub={`${memberUsagePercent}% utilizado`}
          accent={tenant.primary_color ?? '#E8FF47'}
          progress={memberUsagePercent}
          icon={<UsersRound size={15} />}
        />
        <MetricCard
          label="Alunos"
          value={`${studentCount ?? 0} / ${tenant.max_students === 9999 ? '∞' : tenant.max_students}`}
          sub="capacidade do plano"
          icon={<Users size={15} />}
        />
        <MetricCard
          label="Plano atual"
          value={PLAN_LABELS[tenant.plan as keyof typeof PLAN_LABELS]}
          sub={tenant.self_assign_enabled ? 'autoatribuição ativa' : 'autoatribuição desativada'}
          icon={<Crown size={15} />}
        />
      </div>

      {/* Formulário de edição / visualização */}
      <AcademiaEditForm
        tenant={{
          id:                     tenant.id,
          business_name:          tenant.business_name,
          plan:                   tenant.plan as 'free' | 'pro' | 'premium',
          max_students:           tenant.max_students,
          max_personals:          tenant.max_personals,
          self_assign_enabled:    tenant.self_assign_enabled,
          abacatepay_customer_id: tenant.abacatepay_customer_id,
          notes:                  tenant.notes,
        }}
      />

      {/* Dono da academia */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-3">
        <h2 className="font-body font-semibold text-text-primary text-sm">Dono da academia (owner)</h2>
        {ownerProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">Nome</p>
              <p className="text-text-primary">{ownerProfile.full_name ?? '—'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">E-mail</p>
              <p className="text-text-primary">{ownerProfile.email ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Nenhum vínculo de owner encontrado em tenant_members — verifique manualmente.
          </p>
        )}
        <Link
          href="/dashboard/equipe"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-lime transition-colors"
        >
          Gestão de equipe fica em /dashboard/equipe, acessível pelo próprio owner/admin da academia.
        </Link>
      </div>
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon, accent, progress,
}: {
  label: string; value: string; sub: string
  icon: React.ReactNode; accent?: string; progress?: number
}) {
  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">{label}</p>
        <span className="text-text-secondary">{icon}</span>
      </div>
      <p className="text-lg font-body font-bold text-text-primary leading-tight">{value}</p>
      <p className="text-xs text-text-secondary">{sub}</p>
      {progress !== undefined && (
        <div className="h-1.5 bg-background rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: accent ?? '#E8FF47' }}
          />
        </div>
      )}
    </div>
  )
}
