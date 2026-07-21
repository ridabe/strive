import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { resolveTextColor } from '@/lib/color-contrast'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users, UsersRound, Dumbbell, TrendingUp, Receipt,
  ClipboardList, Zap, Play, Ruler, FileHeart,
  CalendarCheck, CalendarDays, MessageSquare, FolderOpen, Bell, Palette,
  MapPin, Video, Clock, Package,
  Lock, type LucideIcon,
} from 'lucide-react'
import { MODULE_ROUTES } from '@/lib/modules-config'
import { isOperations } from '@/lib/permissions'

// ─── Ícones por nome (espelha system_modules.icon) ──────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, ClipboardList, Zap, Play, Ruler, FileHeart,
  TrendingUp, CalendarCheck, CalendarDays, MessageSquare, Receipt,
  FolderOpen, Bell, Palette, Package,
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

// ─── Sparkline (SVG inline, sem dependência) ────────────────────────────────
// Renderizado no server; cor pelo accent do tenant (--brand-lime).
function Sparkline({ vals, w = 78, h = 26 }: { vals: number[]; w?: number; h?: number }) {
  const pad = 2
  const max = Math.max(1, ...vals)
  const step = (w - pad * 2) / Math.max(1, vals.length - 1)
  const pts = vals.map((v, i) => `${(pad + i * step).toFixed(1)},${(h - pad - (v / max) * (h - pad * 2)).toFixed(1)}`)
  const line = `M${pts.join(' L')}`
  const area = `${line} L ${(pad + (vals.length - 1) * step).toFixed(1)},${h - pad} L ${pad},${h - pad} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0" aria-hidden="true">
      <path d={area} fill="var(--brand-lime)" opacity="0.12" />
      <path d={line} fill="none" stroke="var(--brand-lime)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Área (gráfico de tendência maior, fluido) ──────────────────────────────
function AreaChart({ vals }: { vals: number[] }) {
  const W = 700, H = 176, padX = 4, padTop = 12, padBot = 8
  const max = Math.max(1, ...vals)
  const step = (W - padX * 2) / Math.max(1, vals.length - 1)
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBot)
  const pts = vals.map((v, i) => `${(padX + i * step).toFixed(1)},${y(v).toFixed(1)}`)
  const line = `M${pts.join(' L')}`
  const area = `${line} L ${(padX + (vals.length - 1) * step).toFixed(1)},${H - padBot} L ${padX},${H - padBot} Z`
  const last = vals.length ? [padX + (vals.length - 1) * step, y(vals[vals.length - 1])] : [0, 0]
  const gridY = [0.25, 0.5, 0.75].map((f) => padTop + f * (H - padTop - padBot))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 176 }} aria-hidden="true">
      {gridY.map((gy, i) => (
        <line key={i} x1={padX} x2={W - padX} y1={gy} y2={gy} stroke="rgb(var(--color-surface-border))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={area} fill="var(--brand-lime)" opacity="0.10" />
      <path d={line} fill="none" stroke="var(--brand-lime)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--brand-lime)" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Horário local pt-BR (para lista de frequência do dia).
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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

  // ── Tenant + papel efetivo ──────────────────────────────────────────────────
  // Espelha a resolução de getCtx() (src/lib/supabase/context.ts): numa
  // academia, o papel real (owner/admin/personal) vem de tenant_members, não
  // de profiles.role. Precisamos disso aqui pra saber se quem está olhando é
  // a instituição (owner/admin) — que não opera módulo de treino — e trocar
  // a home por uma visão administrativa com o logo em destaque.
  const { data: tenant } = tenantId
    ? await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()
    : { data: null }

  const isAcademia = tenant?.tenant_type === 'academia'
  // Logo para tema claro (academia); cai no logo padrão se não houver.
  // Lido via cast — logo_light_url é coluna nova, ainda fora do database.ts.
  const academiaLogo = (tenant as { logo_light_url?: string | null } | null)?.logo_light_url ?? tenant?.logo_url ?? null

  let effectiveRole = 'personal'
  if (isAcademia && tenantId && user) {
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    effectiveRole = membership?.role ?? 'personal'
  }

  const isAcademiaAdmin = isAcademia && ['owner', 'admin'].includes(effectiveRole)
  const isAcademiaOps   = isAcademia && isOperations(effectiveRole)

  // ── Stats rápidas ──────────────────────────────────────────────────────────
  const [{ count: studentCount }, { count: planCount }, { count: attendanceCount }, { count: teamCount }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('workout_plans').select('*', { count: 'exact', head: true }),
    supabase.from('attendance').select('*', { count: 'exact', head: true }),
    isAcademiaAdmin && tenantId
      ? supabase.from('tenant_members').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active')
      : Promise.resolve({ count: null } as { count: number | null }),
  ])

  // ── Dados da visão de operação (operador/gerente) ──────────────────────────
  // Sem valores agregados de receita — só contagens operacionais: personais na
  // equipe, alunos inadimplentes (quantidade, sem valor) e anamneses preenchidas.
  let personalCount = 0
  let overdueCount = 0
  let anamneseDone = 0
  if (isAcademiaOps && tenantId) {
    const [{ count: pc }, { count: oc }, { count: ad }] = await Promise.all([
      supabase.from('tenant_members').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active').eq('role', 'personal'),
      supabase.from('financial_plans').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
      supabase.from('anamnese_responses').select('id', { count: 'exact', head: true }).not('completed_at', 'is', null),
    ])
    personalCount = pc ?? 0
    overdueCount = oc ?? 0
    anamneseDone = ad ?? 0
  }

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

  // Owner/admin de academia é uma visão institucional: "Módulos ativos" não
  // diz muito (a instituição não opera módulo nenhum diretamente), então dá
  // lugar a "Personal na equipe" — métrica de gestão que faz sentido pra
  // quem administra a academia.
  const stats = isAcademiaAdmin
    ? [
        { label: 'Alunos ativos',      value: studentCount ?? 0,     icon: Users,         color: 'text-brand-lime',     href: '/dashboard/alunos' },
        { label: 'Personal na equipe', value: teamCount ?? 0,         icon: UsersRound,    color: 'text-blue-400',       href: '/dashboard/equipe' },
        { label: 'Fichas de treino',   value: planCount ?? 0,         icon: Dumbbell,      color: 'text-purple-400',     href: null },
        { label: 'Check-ins',          value: attendanceCount ?? 0,   icon: CalendarCheck, color: 'text-status-success', href: null },
      ]
    : isAcademiaOps
    ? [
        { label: 'Alunos ativos', value: studentCount ?? 0, icon: Users,      color: 'text-brand-lime',     href: '/dashboard/alunos' },
        { label: 'Personais',     value: personalCount,      icon: UsersRound,  color: 'text-blue-400',       href: '/dashboard/equipe' },
        { label: 'Inadimplentes', value: overdueCount,       icon: Receipt,     color: 'text-status-error',   href: '/dashboard/financeiro' },
        { label: 'Anamneses OK',  value: anamneseDone,       icon: FileHeart,   color: 'text-status-success', href: null },
      ]
    : [
        { label: 'Alunos ativos',    value: studentCount  ?? 0, icon: Users,     color: 'text-brand-lime',     href: '/dashboard/alunos' },
        { label: 'Fichas de treino', value: planCount      ?? 0, icon: Dumbbell,  color: 'text-blue-400',       href: null },
        { label: 'Check-ins',        value: attendanceCount ?? 0, icon: CalendarCheck, color: 'text-purple-400', href: null },
        { label: 'Módulos ativos',   value: enabledSlugs.size,   icon: Zap,       color: 'text-status-success', href: null },
      ]

  // ── Dados de BI da academia (só visão institucional owner/admin) ──────────
  // Série de check-ins dos últimos 14 dias (bucket por dia) + frequência de hoje.
  let checkinSeries: number[] = []
  const todayAttendance: { student_id: string; full_name: string; avatar_url: string | null; attended_at: string }[] = []
  if (isAcademiaAdmin && tenantId) {
    const base = new Date(); base.setHours(0, 0, 0, 0); base.setDate(base.getDate() - 13)
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1)
    const [{ data: att }, { data: todayRows }] = await Promise.all([
      supabase.from('attendance').select('attended_at').eq('tenant_id', tenantId).gte('attended_at', base.toISOString()),
      supabase.from('attendance')
        .select('student_id, attended_at, students(full_name, avatar_url)')
        .eq('tenant_id', tenantId)
        .gte('attended_at', dayStart.toISOString())
        .lt('attended_at', dayEnd.toISOString())
        .order('attended_at', { ascending: false }),
    ])
    const buckets = new Array(14).fill(0)
    for (const r of att ?? []) {
      const d = new Date(r.attended_at); d.setHours(0, 0, 0, 0)
      const idx = Math.round((d.getTime() - base.getTime()) / 86400000)
      if (idx >= 0 && idx < 14) buckets[idx]++
    }
    checkinSeries = buckets

    // Um aluno pode ter mais de um registro no dia (ex: combos); mantém só o mais recente.
    const seen = new Set<string>()
    for (const row of todayRows ?? []) {
      if (seen.has(row.student_id)) continue
      seen.add(row.student_id)
      const student = joinOne<{ full_name: string; avatar_url: string | null }>(row.students)
      todayAttendance.push({
        student_id: row.student_id,
        full_name: student?.full_name ?? '—',
        avatar_url: student?.avatar_url ?? null,
        attended_at: row.attended_at,
      })
    }
  }
  const checkinTotal = checkinSeries.reduce((a, b) => a + b, 0)

  // ── Eventos de hoje (banner de notificação) ───────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayEvents } = tenantId
    ? await supabase
        .from('agenda_events')
        .select('id, type, title, start_time, location, meeting_url')
        .eq('event_date', todayStr)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(5)
    : { data: null }

  const now    = new Date()
  const hour   = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Header — na academia, banda de marca com o logo em destaque (a marca
          da instituição é valorizada); o personal autônomo mantém o display
          Syncopate da identidade Strive. */}
      {isAcademia ? (
        <div className="bg-surface border border-surface-border rounded-xl px-5 py-4 flex items-center gap-4">
          {academiaLogo ? (
            <>
              <div className="relative h-14 w-[200px] max-w-[45vw] flex-shrink-0">
                <Image
                  src={academiaLogo}
                  alt={tenant?.business_name ?? 'Academia'}
                  fill
                  className="object-contain object-left"
                  sizes="200px"
                  priority
                />
              </div>
              <div className="min-w-0 border-l border-surface-border pl-4 hidden sm:block">
                <p className="text-sm font-medium text-text-primary">{greeting}, {firstName}</p>
                <p className="text-text-secondary text-xs mt-0.5">Resumo da operação da academia</p>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center font-semibold text-xl flex-shrink-0"
                style={{
                  background: tenant?.primary_color ?? '#4F46E5',
                  color: resolveTextColor(tenant?.primary_color ?? '#4F46E5', tenant?.on_primary_text_color ?? null),
                }}
              >
                {(tenant?.business_name ?? 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-text-primary tracking-tight truncate">
                  {tenant?.business_name ?? 'Sua academia'}
                </h1>
                <p className="text-text-secondary text-sm">
                  {greeting}, {firstName} · resumo da operação
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            {greeting}, {firstName}!
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Aqui está um resumo da sua operação.
          </p>
        </div>
      )}

      {/* Banner de eventos de hoje */}
      {todayEvents && todayEvents.length > 0 && (
        <div className="bg-brand-lime/5 border border-brand-lime/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-brand-lime" />
              <span className="text-sm font-medium text-brand-lime">
                {todayEvents.length === 1
                  ? 'Você tem 1 evento hoje'
                  : `Você tem ${todayEvents.length} eventos hoje`}
              </span>
            </div>
            <Link href="/dashboard/agenda" className="text-xs text-text-secondary hover:text-brand-lime transition-colors">
              Ver agenda →
            </Link>
          </div>
          <div className="space-y-1.5">
            {todayEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 text-xs text-text-secondary">
                {ev.type === 'presencial' && <MapPin size={11} className="text-blue-400 flex-shrink-0" />}
                {ev.type === 'virtual'    && <Video  size={11} className="text-emerald-400 flex-shrink-0" />}
                {ev.type === 'pagamento_a_fazer'    && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                {ev.type === 'pagamento_a_receber'  && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                <span className="text-text-primary font-medium truncate">{ev.title}</span>
                {ev.start_time && (
                  <span className="flex items-center gap-0.5 text-text-secondary/60 flex-shrink-0">
                    <Clock size={10} /> {ev.start_time.slice(0, 5)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats — na academia: cartão BI denso (número tabular + sparkline nos
          check-ins). No personal: o cartão display original. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isCheckin = stat.label === 'Check-ins'
          const content = isAcademia ? (
            <div className="bg-surface border border-surface-border rounded-xl p-4 h-full flex flex-col justify-between gap-4 transition-colors hover:border-brand-lime/40">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-xs">{stat.label}</span>
                <Icon size={15} className="text-text-secondary" />
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="text-2xl font-semibold text-text-primary tabular-nums tracking-tight leading-none">{stat.value}</div>
                {isCheckin && checkinSeries.some((v) => v > 0) && <Sparkline vals={checkinSeries} />}
              </div>
            </div>
          ) : (
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

      {isAcademiaAdmin ? (
        /* Visão institucional (owner/admin): painel BI — tendência de check-ins
           e alunos recentes — em vez da grade de módulos operacionais. */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tendência de check-ins (14 dias) */}
          <section className="lg:col-span-2 bg-surface border border-surface-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Check-ins</h2>
                <p className="text-xs text-text-secondary mt-0.5">Últimos 14 dias</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-text-primary tabular-nums leading-none">{checkinTotal}</div>
                <div className="text-xs text-text-secondary mt-0.5">no período</div>
              </div>
            </div>
            <div className="px-3 pt-4 pb-3">
              {checkinSeries.some((v) => v > 0) ? (
                <AreaChart vals={checkinSeries} />
              ) : (
                <div className="h-[176px] flex items-center justify-center text-sm text-text-secondary">
                  Sem check-ins registrados nos últimos 14 dias.
                </div>
              )}
            </div>
          </section>

          {/* Frequência de hoje */}
          <section className="bg-surface border border-surface-border rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <h2 className="text-sm font-semibold text-text-primary">Frequência de hoje</h2>
              <Link href="/dashboard/frequencia" className="text-xs font-medium text-brand-lime hover:opacity-80 transition-opacity">
                Ver histórico
              </Link>
            </div>
            {todayAttendance.length > 0 ? (
              <ul className="flex-1 divide-y divide-surface-border">
                {todayAttendance.map((a) => {
                  const initials = a.full_name.split(' ').slice(0, 2).map((n) => n.charAt(0)).join('').toUpperCase()
                  return (
                    <li key={a.student_id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-background border border-surface-border flex items-center justify-center text-[11px] font-semibold text-text-secondary flex-shrink-0 overflow-hidden">
                        {a.avatar_url
                          ? <Image src={a.avatar_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                          : initials}
                      </div>
                      <span className="text-sm text-text-primary truncate flex-1 min-w-0">{a.full_name}</span>
                      <CalendarCheck size={12} className="text-status-success flex-shrink-0" />
                      <span className="text-xs text-text-secondary tabular-nums flex-shrink-0 w-12 text-right">{timeLabel(a.attended_at)}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex-1 flex items-center justify-center px-5 py-10 text-sm text-text-secondary text-center">
                Nenhum aluno treinou hoje ainda.
              </div>
            )}
          </section>
        </div>
      ) : isAcademiaOps ? (
        /* Visão de operação (operador/gerente): atalhos + alerta de
           inadimplência (quantidade, sem valores). Sem grade de módulos. */
        <div className="space-y-4">
          {overdueCount > 0 && (
            <div className="bg-status-error/5 border border-status-error/20 rounded-xl p-4 flex items-center gap-3">
              <Receipt size={16} className="text-status-error flex-shrink-0" />
              <p className="text-sm text-text-primary">
                <span className="font-semibold text-status-error">{overdueCount}</span> aluno{overdueCount !== 1 ? 's' : ''} inadimplente{overdueCount !== 1 ? 's' : ''} — veja os detalhes em Cobrança.
              </p>
              <Link href="/dashboard/financeiro" className="ml-auto flex-shrink-0 text-xs font-medium text-brand-lime hover:opacity-80 transition-opacity">
                Abrir
              </Link>
            </div>
          )}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-text-primary">Atalhos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Alunos',   href: '/dashboard/alunos',     icon: Users },
                { label: 'Cobrança', href: '/dashboard/financeiro', icon: Receipt },
                { label: 'Estoque',  href: '/dashboard/estoque',    icon: Package },
                { label: 'Agenda',   href: '/dashboard/agenda',     icon: CalendarDays },
                { label: 'Equipe',   href: '/dashboard/equipe',     icon: UsersRound },
                { label: 'Anamnese', href: '/dashboard/anamnese',   icon: FileHeart },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="group bg-surface border border-surface-border rounded-xl p-4 flex flex-col gap-3 hover:border-brand-lime/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-surface-border bg-background text-text-secondary group-hover:text-brand-lime transition-colors">
                      <Icon size={16} />
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-tight">{s.label}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
