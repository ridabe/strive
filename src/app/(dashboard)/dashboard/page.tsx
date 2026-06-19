import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import Link from 'next/link'
import {
  Users, Dumbbell, TrendingUp, Receipt,
  ClipboardList, Zap, Play, Ruler, FileHeart,
  CalendarCheck, MessageSquare, FolderOpen, Bell, Palette,
  Lock, type LucideIcon,
} from 'lucide-react'
import { MODULE_ROUTES } from '@/lib/modules-config'

// ─── Ícones por nome (espelha system_modules.icon) ──────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, ClipboardList, Zap, Play, Ruler, FileHeart,
  TrendingUp, CalendarCheck, MessageSquare, Receipt,
  FolderOpen, Bell, Palette,
}

// Cor por categoria
const CATEGORY_COLOR: Record<string, string> = {
  treinos:        'text-blue-400   bg-blue-400/10   border-blue-400/20',
  acompanhamento: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  financeiro:     'text-green-400  bg-green-400/10  border-green-400/20',
  comunicacao:    'text-orange-400 bg-orange-400/10 border-orange-400/20',
  whitelabel:     'text-pink-400   bg-pink-400/10   border-pink-400/20',
  futuro:         'text-text-secondary bg-background border-surface-border',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, tenant_id')
    .eq('id', user!.id)
    .single()

  const tenantId   = profile?.tenant_id
  const firstName  = profile?.full_name?.split(' ')[0] ?? 'Personal'

  // ── Stats rápidas ──────────────────────────────────────────────────────────
  const [{ count: studentCount }, { count: planCount }, { count: attendanceCount }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('workout_plans').select('*', { count: 'exact', head: true }),
    supabase.from('attendance').select('*', { count: 'exact', head: true }),
  ])

  // ── Módulos do tenant ──────────────────────────────────────────────────────
  const { data: tenantModuleRows } = tenantId
    ? await supabase
        .from('tenant_modules')
        .select(`enabled, system_modules(id, slug, name, icon, category, status, available, sort_order)`)
        .eq('tenant_id', tenantId)
    : { data: null }

  // Todos os módulos disponíveis globalmente (para mostrar os não habilitados)
  const { data: allModules } = await supabase
    .from('system_modules')
    .select('id, slug, name, icon, category, status, available, sort_order')
    .eq('available', true)
    .neq('status', 'coming_soon')
    .order('sort_order')

  const enabledSlugs = new Set(
    (tenantModuleRows ?? [])
      .filter((r) => r.enabled)
      .map((r) => joinOne<{ slug: string }>(r.system_modules)?.slug)
      .filter(Boolean) as string[]
  )

  const enabledModules  = (allModules ?? []).filter((m) => enabledSlugs.has(m.slug))
  const lockedModules   = (allModules ?? []).filter((m) => !enabledSlugs.has(m.slug))

  const stats = [
    { label: 'Alunos ativos',    value: studentCount  ?? 0, icon: Users,     color: 'text-brand-lime',     href: '/dashboard/alunos' },
    { label: 'Fichas de treino', value: planCount      ?? 0, icon: Dumbbell,  color: 'text-blue-400',       href: null },
    { label: 'Check-ins',        value: attendanceCount ?? 0, icon: CalendarCheck, color: 'text-purple-400', href: null },
    { label: 'Módulos ativos',   value: enabledSlugs.size,   icon: Zap,       color: 'text-status-success', href: null },
  ]

  const now    = new Date()
  const hour   = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          {greeting}, {firstName}!
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Aqui está um resumo da sua operação.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const content = (
            <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3 transition-all hover:border-surface-border/80">
              <div className={stat.color}>
                <Icon size={20} />
              </div>
              <div>
                <div className="font-display font-bold text-3xl text-text-primary">{stat.value}</div>
                <div className="text-text-secondary text-xs mt-0.5">{stat.label}</div>
              </div>
            </div>
          )
          return stat.href
            ? <Link key={stat.label} href={stat.href}>{content}</Link>
            : <div key={stat.label}>{content}</div>
        })}
      </div>

      {/* Módulos habilitados */}
      {enabledModules.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-body font-semibold text-text-primary text-sm uppercase tracking-widest">
            Seus módulos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {enabledModules.map((mod) => {
              const route   = MODULE_ROUTES[mod.slug]
              if (!route) return null
              const Icon    = ICON_MAP[mod.icon ?? ''] ?? Dumbbell
              const colCls  = CATEGORY_COLOR[mod.category] ?? CATEGORY_COLOR.treinos

              return (
                <Link
                  key={mod.id}
                  href={route.href}
                  className="group bg-surface border border-surface-border rounded-xl p-4 flex flex-col gap-3 hover:border-brand-lime/30 transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colCls} flex-shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <p className="text-sm font-body font-medium text-text-primary leading-tight group-hover:text-brand-lime transition-colors">
                    {route.label}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Módulos disponíveis mas não habilitados */}
      {lockedModules.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-body font-semibold text-text-secondary text-sm uppercase tracking-widest">
              Módulos disponíveis
            </h2>
            <p className="text-xs text-text-secondary/60">Solicite ao seu administrador para habilitar</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {lockedModules.map((mod) => {
              const route  = MODULE_ROUTES[mod.slug]
              if (!route) return null
              const Icon   = ICON_MAP[mod.icon ?? ''] ?? Dumbbell

              return (
                <div
                  key={mod.id}
                  className="bg-surface/50 border border-surface-border/50 rounded-xl p-4 flex flex-col gap-3 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-surface-border bg-background flex-shrink-0">
                      <Icon size={16} className="text-text-secondary" />
                    </div>
                    <Lock size={12} className="text-text-secondary/50" />
                  </div>
                  <p className="text-sm font-body font-medium text-text-secondary leading-tight">
                    {route.label}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Estado vazio */}
      {enabledModules.length === 0 && lockedModules.length === 0 && (
        <div className="bg-surface border border-surface-border rounded-xl p-8 text-center space-y-2">
          <p className="text-text-primary font-body font-medium">Nenhum módulo configurado ainda</p>
          <p className="text-text-secondary text-sm">
            Entre em contato com o suporte para habilitar os módulos do seu plano.
          </p>
        </div>
      )}
    </div>
  )
}
