import { createClient } from '@/lib/supabase/server'
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Dumbbell,
  CalendarCheck,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import { subDays, startOfDay } from 'date-fns'

// ─── helpers ───────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  if (b === 0) return null
  return Math.round(((a - b) / b) * 100)
}

function fmtBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

// ─── types ────────────────────────────────────────────────────────────────────

interface GrowthBadgeProps {
  current: number
  previous: number
}

function GrowthBadge({ current, previous }: GrowthBadgeProps) {
  const delta = pct(current, previous)
  if (delta === null) return <span className="text-xs text-text-secondary/60">—</span>
  if (delta > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success">
      <ArrowUp size={11} />{delta}%
    </span>
  )
  if (delta < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-status-error">
      <ArrowDown size={11} />{Math.abs(delta)}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
      <Minus size={11} />0%
    </span>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function MetricasPage() {
  const supabase = await createClient()

  const now = new Date()
  const last30  = startOfDay(subDays(now, 30)).toISOString()
  const last60  = startOfDay(subDays(now, 60)).toISOString()

  // ── queries em paralelo ──────────────────────────────────────────────────────
  const [
    { data: tenants },
    { data: students },
    { count: workoutCount },
    { count: attendanceCount },
    { data: tenants30 },
    { data: tenants60to30 },
    { data: students30 },
    { data: students60to30 },
  ] = await Promise.all([
    supabase.from('tenants').select('id, plan, status, business_name, max_students'),
    supabase.from('students').select('id, tenant_id, status'),
    supabase.from('workout_plans').select('*', { count: 'exact', head: true }),
    supabase.from('attendance').select('*', { count: 'exact', head: true }),
    // novos clientes últimos 30 dias
    supabase.from('tenants').select('id').gte('created_at', last30),
    // novos clientes 30–60 dias atrás
    supabase.from('tenants').select('id').gte('created_at', last60).lt('created_at', last30),
    // novos alunos últimos 30 dias
    supabase.from('students').select('id').gte('created_at', last30),
    // novos alunos 30–60 dias atrás
    supabase.from('students').select('id').gte('created_at', last60).lt('created_at', last30),
  ])

  // ── derivados ────────────────────────────────────────────────────────────────
  const allTenants  = tenants  ?? []
  const allStudents = students ?? []

  const tenantByPlan = {
    free:    allTenants.filter(t => t.plan === 'free').length,
    pro:     allTenants.filter(t => t.plan === 'pro').length,
    premium: allTenants.filter(t => t.plan === 'premium').length,
  }
  const tenantByStatus = {
    active:    allTenants.filter(t => t.status === 'active').length,
    inactive:  allTenants.filter(t => t.status === 'inactive').length,
    suspended: allTenants.filter(t => t.status === 'suspended').length,
  }

  const activeTenants  = tenantByStatus.active
  const totalStudents  = allStudents.length
  const activeStudents = allStudents.filter(s => s.status === 'active').length

  // MRR estimado: apenas tenants ativos
  const mrrEstimado =
    allTenants.filter(t => t.plan === 'pro'     && t.status === 'active').length * 59  +
    allTenants.filter(t => t.plan === 'premium' && t.status === 'active').length * 119

  // novos nos períodos
  const newTenants30     = tenants30?.length      ?? 0
  const newTenants60to30 = tenants60to30?.length  ?? 0
  const newStudents30    = students30?.length      ?? 0
  const newStudents60to30= students60to30?.length  ?? 0

  // top 5 clientes por alunos
  const countByTenant = allStudents.reduce<Record<string, number>>((acc, s) => {
    acc[s.tenant_id] = (acc[s.tenant_id] ?? 0) + 1
    return acc
  }, {})

  const topClients = [...allTenants]
    .sort((a, b) => (countByTenant[b.id] ?? 0) - (countByTenant[a.id] ?? 0))
    .slice(0, 5)

  // ── constantes de estilo ─────────────────────────────────────────────────────
  const PLAN_COLORS = {
    free:    'text-text-secondary  bg-surface-border/40     border-surface-border',
    pro:     'text-brand-lime      bg-brand-lime/10         border-brand-lime/20',
    premium: 'text-status-warning  bg-status-warning/10     border-status-warning/20',
  }
  const PLAN_LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Métricas
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Visão geral da plataforma em tempo real
        </p>
      </div>

      {/* ── KPIs principais ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Clientes ativos */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">
              Clientes ativos
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
              <Building2 size={14} className="text-brand-lime" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text-primary">{activeTenants}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary/60">
            <span>+{newTenants30} nos últimos 30d</span>
            <GrowthBadge current={newTenants30} previous={newTenants60to30} />
          </div>
        </div>

        {/* Alunos totais */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">
              Alunos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
              <Users size={14} className="text-blue-400" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text-primary">{totalStudents}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary/60">
            <span>+{newStudents30} nos últimos 30d</span>
            <GrowthBadge current={newStudents30} previous={newStudents60to30} />
          </div>
        </div>

        {/* Treinos criados */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">
              Treinos criados
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center">
              <Dumbbell size={14} className="text-purple-400" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text-primary">{workoutCount ?? 0}</p>
          <p className="text-xs text-text-secondary/60">planos de treino</p>
        </div>

        {/* MRR estimado */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">
              MRR estimado
            </span>
            <div className="w-8 h-8 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center justify-center">
              <DollarSign size={14} className="text-status-success" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text-primary">{fmtBRL(mrrEstimado)}</p>
          <p className="text-xs text-text-secondary/60">somente tenants ativos pagos</p>
        </div>
      </div>

      {/* ── Segunda linha: planos + status + presenças ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Distribuição por plano */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Distribuição por plano
          </h2>
          <div className="space-y-3">
            {(['free', 'pro', 'premium'] as const).map(plan => {
              const count = tenantByPlan[plan]
              const total = allTenants.length || 1
              const pctVal = Math.round((count / total) * 100)
              return (
                <div key={plan} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan]}`}>
                      {PLAN_LABELS[plan]}
                    </span>
                    <span className="text-sm font-display font-bold text-text-primary">
                      {count} <span className="text-xs font-body font-normal text-text-secondary/60">({pctVal}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pctVal}%`,
                        backgroundColor: plan === 'free' ? '#6b7280' : plan === 'pro' ? '#E8FF47' : '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status dos clientes */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Status dos clientes
          </h2>
          <div className="space-y-3">
            {([
              { key: 'active',    label: 'Ativos',    color: 'text-status-success bg-status-success/10 border-status-success/20', bar: '#22c55e' },
              { key: 'inactive',  label: 'Inativos',  color: 'text-text-secondary bg-surface-border/40 border-surface-border',     bar: '#6b7280' },
              { key: 'suspended', label: 'Suspensos', color: 'text-status-error bg-status-error/10 border-status-error/20',        bar: '#ef4444' },
            ] as const).map(({ key, label, color, bar }) => {
              const count = tenantByStatus[key]
              const total = allTenants.length || 1
              const pctVal = Math.round((count / total) * 100)
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                      {label}
                    </span>
                    <span className="text-sm font-display font-bold text-text-primary">
                      {count} <span className="text-xs font-body font-normal text-text-secondary/60">({pctVal}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctVal}%`, backgroundColor: bar }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alunos + Presenças */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Engajamento
          </h2>
          <div className="space-y-4">
            {/* Alunos ativos vs inativos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Users size={12} /> Alunos ativos
                </span>
                <span className="text-text-primary font-medium">{activeStudents} / {totalStudents}</span>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Presenças registradas */}
            <div className="pt-2 border-t border-surface-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                <CalendarCheck size={16} className="text-brand-lime" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-text-primary">{attendanceCount ?? 0}</p>
                <p className="text-xs text-text-secondary/60">presenças registradas</p>
              </div>
            </div>

            {/* Crescimento */}
            <div className="pt-2 border-t border-surface-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} className="text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-2xl font-bold text-text-primary">+{newTenants30}</p>
                  <GrowthBadge current={newTenants30} previous={newTenants60to30} />
                </div>
                <p className="text-xs text-text-secondary/60">novos clientes (30d)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 5 clientes por alunos ─────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
          <Building2 size={15} className="text-text-secondary" />
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Top clientes por alunos
          </h2>
        </div>

        {topClients.length === 0 ? (
          <p className="text-center text-text-secondary text-sm py-10">Nenhum cliente cadastrado.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {topClients.map((tenant, i) => {
              const count   = countByTenant[tenant.id] ?? 0
              const usagePct = Math.round((count / tenant.max_students) * 100)

              return (
                <div key={tenant.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Rank */}
                  <span className="w-6 text-center font-display font-bold text-sm text-text-secondary/40 flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Nome */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-body font-medium text-text-primary truncate">
                        {tenant.business_name}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[tenant.plan as keyof typeof PLAN_COLORS]}`}>
                          {PLAN_LABELS[tenant.plan as keyof typeof PLAN_LABELS]}
                        </span>
                        <span className="text-xs text-text-secondary font-medium">
                          {count}/{tenant.max_students === 9999 ? '∞' : tenant.max_students}
                        </span>
                      </div>
                    </div>
                    {/* Barra de uso em relação ao limite do plano */}
                    <div className="w-full h-1 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, usagePct)}%`,
                          backgroundColor: usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#f59e0b' : '#E8FF47',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
