import { createClient } from '@/lib/supabase/server'
import {
  Zap, MessageSquare, Dumbbell, TrendingUp, Heart, BarChart2,
  Building2, ArrowUp, ArrowDown, Minus, Clock, Users,
} from 'lucide-react'
import { subDays, startOfDay, format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  if (b === 0) return null
  return Math.round(((a - b) / b) * 100)
}

function GrowthBadge({ current, previous }: { current: number; previous: number }) {
  const delta = pct(current, previous)
  if (delta === null) return <span className="text-xs text-text-secondary/60">—</span>
  if (delta > 0)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success"><ArrowUp size={11} />{delta}%</span>
  if (delta < 0)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-status-error"><ArrowDown size={11} />{Math.abs(delta)}%</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary"><Minus size={11} />0%</span>
}

// ─── feature config ───────────────────────────────────────────────────────────

const FEATURE_CFG = {
  generate_plan:    { label: 'Gerar Treino',       icon: Dumbbell,     bar: '#60A5FA', pill: 'text-blue-400 bg-blue-400/10 border-blue-400/20'   },
  analyze_progress: { label: 'Analisar Progresso', icon: TrendingUp,   bar: '#A78BFA', pill: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  suggest_load:     { label: 'Sugerir Cargas',     icon: Zap,          bar: '#4ADE80', pill: 'text-green-400 bg-green-400/10 border-green-400/20'  },
  motivation:       { label: 'Motivação',          icon: Heart,        bar: '#FB7185', pill: 'text-rose-400 bg-rose-400/10 border-rose-400/20'    },
  chat:             { label: 'Chat Livre',         icon: MessageSquare,bar: '#FCD34D', pill: 'text-amber-400 bg-amber-400/10 border-amber-400/20'  },
} as const

type Feature = keyof typeof FEATURE_CFG

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function IAAnalyticsPage() {
  const supabase = await createClient()
  const now      = new Date()
  const last30   = startOfDay(subDays(now, 30)).toISOString()
  const last60   = startOfDay(subDays(now, 60)).toISOString()

  // Busca o id do módulo assistente-ia
  const { data: moduleRow } = await supabase
    .from('system_modules')
    .select('id')
    .eq('slug', 'assistente-ia')
    .single()

  const moduleId = moduleRow?.id ?? null

  // Tenants com módulo habilitado
  const { data: enabledTMs } = moduleId
    ? await supabase
        .from('tenant_modules')
        .select('tenant_id')
        .eq('module_id', moduleId)
        .eq('enabled', true)
    : { data: [] }

  const tenantIds = (enabledTMs ?? []).map((tm) => tm.tenant_id)

  // Queries em paralelo
  const [
    { data: allConvs },
    { data: tenants },
    { data: convs30to60 },
  ] = await Promise.all([
    // Todas as conversas (sem limite — para analytics)
    supabase
      .from('ai_conversations')
      .select('id, tenant_id, feature_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5000),

    // Detalhes dos tenants com módulo ativo
    tenantIds.length > 0
      ? supabase
          .from('tenants')
          .select('id, business_name, logo_url, primary_color')
          .in('id', tenantIds)
          .order('business_name')
      : Promise.resolve({ data: [] }),

    // Conversas período anterior (30–60 dias) para variação
    supabase
      .from('ai_conversations')
      .select('id')
      .gte('created_at', last60)
      .lt('created_at', last30),
  ])

  const convs     = allConvs     ?? []
  const tenantMap = new Map((tenants ?? []).map((t) => [t.id, t]))
  const activeTenantCount = tenantIds.length

  // ── KPI derivados ─────────────────────────────────────────────────────────

  const totalAll      = convs.length
  const total30       = convs.filter((c) => c.created_at >= last30).length
  const total30to60   = convs30to60?.length ?? 0

  // Contagem por feature (all time)
  const byFeature = convs.reduce<Record<string, number>>((acc, c) => {
    acc[c.feature_type] = (acc[c.feature_type] ?? 0) + 1
    return acc
  }, {})

  const topFeature = (Object.entries(byFeature).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as Feature | null

  // ── Atividade nos últimos 14 dias ─────────────────────────────────────────

  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(now, 13 - i)
    return {
      label:   format(d, 'dd/MM'),
      dateStr: format(d, 'yyyy-MM-dd'),
      count:   0,
    }
  })

  convs.forEach((c) => {
    const ds = c.created_at.slice(0, 10)
    const slot = days14.find((d) => d.dateStr === ds)
    if (slot) slot.count++
  })

  const maxDay = Math.max(...days14.map((d) => d.count), 1)

  // ── Stats por tenant ──────────────────────────────────────────────────────

  const tenantStats = tenantIds.map((tid) => {
    const tc       = convs.filter((c) => c.tenant_id === tid)
    const tc30     = tc.filter((c) => c.created_at >= last30)
    const lastConv = tc[0] // já ordenado desc
    const features = tc.reduce<Record<string, number>>((acc, c) => {
      acc[c.feature_type] = (acc[c.feature_type] ?? 0) + 1
      return acc
    }, {})
    return {
      tenantId:  tid,
      name:      tenantMap.get(tid)?.business_name ?? '—',
      total:     tc.length,
      last30:    tc30.length,
      features,
      lastAt:    lastConv?.created_at ?? null,
    }
  }).sort((a, b) => b.total - a.total)

  // ── Conversas recentes ────────────────────────────────────────────────────

  const recent = convs.slice(0, 12)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
            <Zap size={14} className="text-violet-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Max Strive IA
          </h1>
        </div>
        <p className="text-text-secondary text-sm">
          Analytics de uso do módulo de Inteligência Artificial
        </p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">Total de consultas</span>
            <div className="w-8 h-8 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
              <BarChart2 size={14} className="text-violet-400" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text-primary">{totalAll}</p>
          <p className="text-xs text-text-secondary/60">todas as features</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">Últimos 30 dias</span>
            <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-blue-400" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text-primary">{total30}</p>
          <div className="flex items-center justify-between text-xs text-text-secondary/60">
            <span>vs {total30to60} anteriores</span>
            <GrowthBadge current={total30} previous={total30to60} />
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">Studios usando IA</span>
            <div className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
              <Building2 size={14} className="text-green-400" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-text-primary">{activeTenantCount}</p>
          <p className="text-xs text-text-secondary/60">módulo habilitado</p>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-text-secondary uppercase tracking-wider">Feature mais usada</span>
            <div className="w-8 h-8 rounded-lg bg-rose-400/10 border border-rose-400/20 flex items-center justify-center">
              <Zap size={14} className="text-rose-400" />
            </div>
          </div>
          {topFeature ? (
            <>
              <p className="font-display text-lg font-bold text-text-primary leading-tight">
                {FEATURE_CFG[topFeature].label}
              </p>
              <p className="text-xs text-text-secondary/60">{byFeature[topFeature]} chamadas</p>
            </>
          ) : (
            <p className="font-display text-3xl font-bold text-text-primary">—</p>
          )}
        </div>
      </div>

      {/* ── Segunda linha: features + atividade diária ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Distribuição por feature */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm flex items-center gap-2">
            <Users size={14} className="text-text-secondary" />
            Distribuição por feature
          </h2>
          {totalAll === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">Nenhuma consulta registrada.</p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(FEATURE_CFG) as Feature[]).map((feat) => {
                const count   = byFeature[feat] ?? 0
                const pctVal  = Math.round((count / totalAll) * 100)
                const Icon    = FEATURE_CFG[feat].icon
                return (
                  <div key={feat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${FEATURE_CFG[feat].pill}`}>
                        <Icon size={11} />
                        {FEATURE_CFG[feat].label}
                      </span>
                      <span className="text-sm font-display font-bold text-text-primary">
                        {count}
                        <span className="text-xs font-body font-normal text-text-secondary/60 ml-1">({pctVal}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pctVal}%`, backgroundColor: FEATURE_CFG[feat].bar }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Atividade últimos 14 dias */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm flex items-center gap-2">
            <BarChart2 size={14} className="text-text-secondary" />
            Atividade — últimos 14 dias
          </h2>
          {totalAll === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">Nenhuma atividade registrada.</p>
          ) : (
            <div className="flex items-end gap-1 h-28">
              {days14.map((day) => {
                const heightPct = Math.round((day.count / maxDay) * 100)
                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] text-text-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count || ''}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height:          `${Math.max(heightPct, day.count > 0 ? 6 : 2)}%`,
                          backgroundColor: day.count > 0 ? '#7C3AED' : '#1e1e2e',
                          opacity:         day.count > 0 ? 0.85 : 0.3,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-text-secondary/40 hidden sm:block">
                      {day.label.slice(0, 2)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Uso por tenant ────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
          <Building2 size={15} className="text-text-secondary" />
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Uso por studio
          </h2>
          <span className="ml-auto text-xs text-text-secondary/60">
            {tenantStats.length} studio{tenantStats.length !== 1 ? 's' : ''} com módulo ativo
          </span>
        </div>

        {tenantStats.length === 0 ? (
          <p className="text-center text-text-secondary text-sm py-12">
            Nenhum studio com o módulo habilitado ainda.
          </p>
        ) : (
          <div className="divide-y divide-surface-border">
            {tenantStats.map((ts, i) => (
              <div key={ts.tenantId} className="flex items-center gap-4 px-5 py-4">
                {/* Rank */}
                <span className="w-6 text-center font-display font-bold text-sm text-text-secondary/40 flex-shrink-0">
                  {i + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-body font-medium text-text-primary truncate">
                      {ts.name}
                    </p>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-text-secondary">
                      <span className="font-display font-bold text-text-primary">{ts.total}</span>
                      <span className="text-text-secondary/40">total</span>
                      <span
                        className={`font-semibold ${ts.last30 > 0 ? 'text-violet-400' : 'text-text-secondary/40'}`}
                      >
                        {ts.last30} 30d
                      </span>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(FEATURE_CFG) as Feature[])
                      .filter((f) => (ts.features[f] ?? 0) > 0)
                      .sort((a, b) => (ts.features[b] ?? 0) - (ts.features[a] ?? 0))
                      .map((feat) => {
                        const Icon = FEATURE_CFG[feat].icon
                        return (
                          <span
                            key={feat}
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${FEATURE_CFG[feat].pill}`}
                          >
                            <Icon size={9} />
                            {ts.features[feat]}×
                          </span>
                        )
                      })}
                    {ts.total === 0 && (
                      <span className="text-xs text-text-secondary/40">sem atividade</span>
                    )}
                  </div>
                </div>

                {/* Última atividade */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  {ts.lastAt ? (
                    <>
                      <p className="text-xs text-text-secondary/60 flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(ts.lastAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-text-secondary/40">—</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Conversas recentes ────────────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
          <Clock size={15} className="text-text-secondary" />
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Consultas recentes
          </h2>
        </div>

        {recent.length === 0 ? (
          <p className="text-center text-text-secondary text-sm py-12">
            Nenhuma consulta registrada ainda.
          </p>
        ) : (
          <div className="divide-y divide-surface-border">
            {recent.map((conv) => {
              const feat   = conv.feature_type as Feature
              const cfg    = FEATURE_CFG[feat] ?? FEATURE_CFG.chat
              const Icon   = cfg.icon
              const tenant = tenantMap.get(conv.tenant_id)
              return (
                <div key={conv.id} className="flex items-center gap-4 px-5 py-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.pill}`}
                  >
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-text-primary truncate">
                      {cfg.label}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {tenant?.business_name ?? conv.tenant_id.slice(0, 8) + '…'}
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary/60 flex-shrink-0">
                    {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
