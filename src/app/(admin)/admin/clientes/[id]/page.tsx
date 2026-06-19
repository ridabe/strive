import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, CalendarDays, Users, Crown, CheckCircle2, XCircle, PauseCircle, Puzzle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailActions } from '@/components/admin/client-detail-actions'
import { ClientEditForm } from '@/components/admin/client-edit-form'

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

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }    = await params
  const supabase  = await createClient()

  // Busca tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select(`
      id, business_name, slug, plan, status, primary_color,
      logo_url, max_students, contact_email, contact_phone,
      notes, created_at, updated_at
    `)
    .eq('id', id)
    .single()

  if (!tenant) notFound()

  // Busca perfil do personal vinculado
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, status, created_at')
    .eq('tenant_id', id)
    .eq('role', 'personal')
    .single()

  // Busca contagem de alunos
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', id)
    .eq('role', 'student')

  const statusCfg = STATUS_CONFIG[tenant.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.inactive
  const StatusIcon = statusCfg.Icon

  const usagePercent = Math.min(
    Math.round(((studentCount ?? 0) / tenant.max_students) * 100),
    100
  )

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">

      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Clientes
        </Link>

        <div className="flex items-start gap-4">
          {/* Logo */}
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

      {/* Ações + link de módulos */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ClientDetailActions
          tenantId={tenant.id}
          tenantName={tenant.business_name}
          status={tenant.status as 'active' | 'inactive' | 'suspended'}
        />
        <Link
          href={`/admin/clientes/${tenant.id}/modulos`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 transition-colors"
        >
          <Puzzle size={15} /> Gerenciar módulos
        </Link>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Alunos"
          value={`${studentCount ?? 0} / ${tenant.max_students}`}
          sub={`${usagePercent}% utilizado`}
          accent={tenant.primary_color ?? '#E8FF47'}
          progress={usagePercent}
          icon={<Users size={15} />}
        />
        <MetricCard
          label="Plano atual"
          value={PLAN_LABELS[tenant.plan as keyof typeof PLAN_LABELS]}
          sub={`máx. ${tenant.max_students} alunos`}
          icon={<Crown size={15} />}
        />
        <MetricCard
          label="Criado em"
          value={new Date(tenant.created_at).toLocaleDateString('pt-BR')}
          sub={`atualizado ${new Date(tenant.updated_at).toLocaleDateString('pt-BR')}`}
          icon={<CalendarDays size={15} />}
        />
      </div>

      {/* Formulário de edição / visualização */}
      <ClientEditForm
        tenant={{
          id:            tenant.id,
          business_name: tenant.business_name,
          plan:          tenant.plan as 'free' | 'pro' | 'premium',
          primary_color: tenant.primary_color,
          logo_url:      tenant.logo_url,
          contact_email: tenant.contact_email,
          contact_phone: tenant.contact_phone,
          notes:         tenant.notes,
        }}
        profile={{
          full_name: profile?.full_name ?? null,
          email:     profile?.email ?? '—',
        }}
      />

      {/* Acesso do personal */}
      {profile && (
        <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-3">
          <h2 className="font-body font-semibold text-text-primary text-sm">Conta de acesso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">E-mail</p>
              <p className="text-text-primary">{profile.email}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">Status da conta</p>
              <p className="text-text-primary capitalize">{profile.status}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">Conta criada</p>
              <p className="text-text-primary">
                {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
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
