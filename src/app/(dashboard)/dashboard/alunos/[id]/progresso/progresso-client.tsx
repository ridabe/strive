'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  TrendingUp, Dumbbell, ImageIcon, StickyNote,
  Trophy, Flame, Zap, Star, Target, Award, Clock,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ProgressEntry {
  id: string
  recorded_at: string
  weight: number | null
  notes: string | null
  photo_urls: string[]
}

interface Session {
  id: string
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  workout_routines: { name: string } | null
}

interface SessionExercise {
  session_id: string
  exercise_id: string
  load_used: number | null
  reps_done: number | null
  sets_done: number | null
  completed: boolean
  exercises: { name: string } | null
}

interface MonthlyPoints {
  total_points: number
  workouts_completed: number
  exercises_completed: number
  load_increases: number
  active_minutes: number
}

interface Badge {
  badge_type: string
  earned_at: string
  month: number
  year: number
}

interface Props {
  studentName: string
  studentId: string
  progressEntries: ProgressEntry[]
  sessions: Session[]
  sessionExercises: SessionExercise[]
  monthlyPoints: MonthlyPoints | null
  badges: Badge[]
}

// ─── Badge visual ─────────────────────────────────────────────────────────────

const BADGE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  foco_total:           { label: 'Foco Total',           icon: Target, color: 'text-blue-400   bg-blue-400/10   border-blue-400/20'   },
  evolucao_aco:         { label: 'Evolução de Aço',      icon: Zap,    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  consistencia_maxima:  { label: 'Consistência Máxima',  icon: Flame,  color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  top_10:               { label: 'Top 10',               icon: Star,   color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  campeao_mes:          { label: 'Campeão do Mês',       icon: Trophy, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  disciplina:           { label: 'Disciplina',           icon: Award,  color: 'text-green-400  bg-green-400/10  border-green-400/20'  },
  treino_completo:      { label: 'Treino Completo',      icon: Dumbbell, color: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDuration(secs: number | null) {
  if (!secs) return '—'
  const m = Math.round(secs / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({
  points,
  color = '#E8FF47',
  height = 120,
  label,
  unit = '',
}: {
  points: { x: string; y: number }[]
  color?: string
  height?: number
  label: string
  unit?: string
}) {
  if (points.length < 2) return (
    <div className="flex flex-col items-center justify-center h-32 text-text-secondary text-sm gap-2">
      <TrendingUp size={28} className="opacity-30" />
      <span>Registros insuficientes para o gráfico</span>
    </div>
  )

  const W = 600
  const H = height
  const PAD = { t: 16, b: 28, l: 44, r: 16 }

  const ys = points.map((p) => p.y)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rangeY = maxY - minY || 1

  const toX = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const toY = (v: number) => PAD.t + (1 - (v - minY) / rangeY) * (H - PAD.t - PAD.b)

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ')
  const areaD = `${pathD} L${toX(points.length - 1).toFixed(1)},${(H - PAD.b).toFixed(1)} L${toX(0).toFixed(1)},${(H - PAD.b).toFixed(1)} Z`

  const yTicks = [minY, minY + rangeY / 2, maxY]

  // X labels: show first, last, and evenly spaced (max 5)
  const xStep = Math.max(1, Math.floor(points.length / 4))
  const xIndices = Array.from({ length: points.length }, (_, i) => i).filter(
    (i) => i === 0 || i === points.length - 1 || i % xStep === 0,
  )

  return (
    <div>
      <p className="text-xs text-text-secondary font-body font-semibold uppercase tracking-widest mb-2">{label}</p>
      <div className="w-full overflow-hidden rounded-xl bg-background border border-surface-border">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: `${height}px` }}>
          {/* Grid lines */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD.l} y1={toY(v).toFixed(1)}
                x2={W - PAD.r} y2={toY(v).toFixed(1)}
                stroke="#ffffff10" strokeWidth="1"
              />
              <text x={PAD.l - 6} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#ffffff40" fontFamily="monospace">
                {v % 1 === 0 ? v : v.toFixed(1)}{unit}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <clipPath id={`clip-${label}`}>
              <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
            </clipPath>
          </defs>
          <path d={areaD} fill={`url(#grad-${label})`} clipPath={`url(#clip-${label})`} />

          {/* Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#clip-${label})`} />

          {/* Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={toX(i).toFixed(1)}
              cy={toY(p.y).toFixed(1)}
              r="3"
              fill={color}
              stroke="#000"
              strokeWidth="1.5"
              clipPath={`url(#clip-${label})`}
            />
          ))}

          {/* X labels */}
          {xIndices.map((i) => (
            <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#ffffff40" fontFamily="monospace">
              {new Date(points[i].x + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ─── Bar Chart (frequência mensal) ───────────────────────────────────────────

function FrequencyBars({ sessions }: { sessions: Session[] }) {
  const monthlyMap = useMemo(() => {
    const map: Record<string, number> = {}
    sessions.forEach((s) => {
      const d = new Date(s.started_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map[key] = (map[key] ?? 0) + 1
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  }, [sessions])

  if (monthlyMap.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-text-secondary text-sm gap-2">
      <Dumbbell size={28} className="opacity-30" />
      <span>Nenhuma sessão registrada ainda</span>
    </div>
  )

  const max = Math.max(...monthlyMap.map(([, v]) => v))

  return (
    <div>
      <p className="text-xs text-text-secondary font-body font-semibold uppercase tracking-widest mb-2">Frequência Mensal</p>
      <div className="bg-background border border-surface-border rounded-xl p-4">
        <div className="flex items-end gap-1.5 h-24">
          {monthlyMap.map(([key, count]) => {
            const [yr, mo] = key.split('-')
            const label = new Date(Number(yr), Number(mo) - 1, 1)
              .toLocaleDateString('pt-BR', { month: 'short' })
              .replace('.', '')
            const pct = (count / max) * 100
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-brand-lime opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  {count}x
                </span>
                <div className="w-full rounded-t-sm bg-brand-lime/20 relative overflow-hidden" style={{ height: '72px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-brand-lime rounded-t-sm transition-all duration-500"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] text-text-secondary">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Load Progression per Exercise ───────────────────────────────────────────

function LoadProgressionChart({
  sessionExercises,
  sessions,
}: {
  sessionExercises: SessionExercise[]
  sessions: Session[]
}) {
  const sessionDateMap = useMemo(() => {
    const map: Record<string, string> = {}
    sessions.forEach((s) => { map[s.id] = s.started_at })
    return map
  }, [sessions])

  const exerciseMap = useMemo(() => {
    const map: Record<string, { name: string; points: { x: string; y: number }[] }> = {}
    sessionExercises.forEach((se) => {
      if (!se.load_used || !se.exercises) return
      const date = sessionDateMap[se.session_id]
      if (!date) return
      if (!map[se.exercise_id]) {
        map[se.exercise_id] = { name: se.exercises.name, points: [] }
      }
      map[se.exercise_id].points.push({ x: date.split('T')[0], y: se.load_used })
    })
    // Sort each exercise's points by date and keep max 50 points
    Object.values(map).forEach((ex) => {
      ex.points.sort((a, b) => a.x.localeCompare(b.x))
      ex.points = ex.points.slice(-50)
    })
    // Return top exercises by number of data points
    return Object.entries(map)
      .filter(([, ex]) => ex.points.length >= 2)
      .sort(([, a], [, b]) => b.points.length - a.points.length)
      .slice(0, 6)
  }, [sessionExercises, sessionDateMap])

  const [selected, setSelected] = useState<string | null>(null)

  if (exerciseMap.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-text-secondary text-sm gap-2">
      <Dumbbell size={28} className="opacity-30" />
      <span>Nenhum dado de carga disponível ainda</span>
    </div>
  )

  const activeId   = selected ?? exerciseMap[0][0]
  const activeData = exerciseMap.find(([id]) => id === activeId)

  return (
    <div className="space-y-3">
      {/* Exercise selector */}
      <div className="flex flex-wrap gap-2">
        {exerciseMap.map(([id, ex]) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-body font-medium border transition-all',
              activeId === id
                ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/30'
                : 'text-text-secondary border-surface-border hover:border-text-secondary/30 hover:text-text-primary',
            )}
          >
            {ex.name}
            <span className="ml-1 opacity-50">({ex.points.length})</span>
          </button>
        ))}
      </div>

      {activeData && (
        <>
          <LineChart
            points={activeData[1].points}
            color="#E8FF47"
            height={140}
            label={`Carga — ${activeData[1].name}`}
            unit=" kg"
          />
          {/* Delta info */}
          {activeData[1].points.length >= 2 && (() => {
            const first = activeData[1].points[0].y
            const last  = activeData[1].points[activeData[1].points.length - 1].y
            const delta = +(last - first).toFixed(1)
            const pct   = first > 0 ? +((delta / first) * 100).toFixed(0) : 0
            return (
              <div className="flex gap-3">
                <div className="flex-1 bg-background border border-surface-border rounded-xl p-3">
                  <p className="text-xs text-text-secondary">Carga inicial</p>
                  <p className="font-display font-bold text-lg text-text-primary">{first} kg</p>
                </div>
                <div className="flex-1 bg-background border border-surface-border rounded-xl p-3">
                  <p className="text-xs text-text-secondary">Carga atual</p>
                  <p className="font-display font-bold text-lg text-text-primary">{last} kg</p>
                </div>
                <div className="flex-1 bg-background border border-surface-border rounded-xl p-3">
                  <p className="text-xs text-text-secondary">Evolução</p>
                  <p className={cn(
                    'font-display font-bold text-lg',
                    delta > 0 ? 'text-status-success' : delta < 0 ? 'text-status-error' : 'text-text-secondary',
                  )}>
                    {delta > 0 ? '+' : ''}{delta} kg ({pct > 0 ? '+' : ''}{pct}%)
                  </p>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

// ─── Session History List ─────────────────────────────────────────────────────

function SessionList({ sessions }: { sessions: Session[] }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = [...sessions].sort((a, b) => b.started_at.localeCompare(a.started_at))
  const visible = expanded ? sorted : sorted.slice(0, 8)

  if (sessions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-text-secondary text-sm gap-2">
      <Dumbbell size={28} className="opacity-30" />
      <span>Nenhuma sessão de treino registrada</span>
    </div>
  )

  return (
    <div className="space-y-2">
      {visible.map((s) => (
        <div key={s.id} className="bg-background border border-surface-border rounded-xl px-4 py-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
            <Dumbbell size={16} className="text-brand-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-text-primary truncate">
              {s.workout_routines?.name ?? 'Treino livre'}
            </p>
            <p className="text-xs text-text-secondary">
              {new Date(s.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary flex-shrink-0">
            <Clock size={12} />
            {fmtDuration(s.duration_seconds)}
          </div>
        </div>
      ))}
      {sorted.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-text-secondary hover:text-text-primary py-2 flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? <><ChevronUp size={13} /> Mostrar menos</> : <><ChevronDown size={13} /> Ver mais {sorted.length - 8} sessões</>}
        </button>
      )}
    </div>
  )
}

// ─── Photos section ───────────────────────────────────────────────────────────

function PhotosSection({ entries }: { entries: ProgressEntry[] }) {
  const withPhotos = entries.filter((e) => e.photo_urls.length > 0)
  if (withPhotos.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-text-secondary text-sm gap-2">
      <ImageIcon size={28} className="opacity-30" />
      <span>Nenhuma foto enviada ainda</span>
    </div>
  )

  return (
    <div className="space-y-4">
      {[...withPhotos].reverse().map((entry) => (
        <div key={entry.id} className="space-y-2">
          <p className="text-xs text-text-secondary">{fmtDate(entry.recorded_at)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {entry.photo_urls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-square rounded-lg overflow-hidden border border-surface-border hover:border-brand-lime/40 transition-colors"
              >
                <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-200" unoptimized />
              </a>
            ))}
          </div>
          {entry.notes && <p className="text-sm text-text-primary">{entry.notes}</p>}
        </div>
      ))}
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

type Tab = 'overview' | 'cargas' | 'sessoes' | 'fotos'

export function ProgressoAlunoClient({
  studentName,
  progressEntries,
  sessions,
  sessionExercises,
  monthlyPoints,
  badges,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview')

  // Computed stats
  const withWeight    = progressEntries.filter((e) => e.weight !== null)
  const weightPoints  = withWeight.map((e) => ({ x: e.recorded_at, y: e.weight! }))
  const weightDelta   = withWeight.length > 1 ? +(withWeight[withWeight.length - 1].weight! - withWeight[0].weight!).toFixed(1) : null
  const totalPhotos   = progressEntries.reduce((acc, e) => acc + e.photo_urls.length, 0)
  const avgDuration   = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.duration_seconds ?? 0), 0) / sessions.length / 60)
    : 0

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão Geral',   icon: TrendingUp },
    { id: 'cargas',   label: 'Cargas',         icon: Dumbbell  },
    { id: 'sessoes',  label: 'Sessões',        icon: Clock     },
    { id: 'fotos',    label: 'Fotos',          icon: ImageIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Progresso
        </h1>
        <p className="text-text-secondary text-sm mt-1">{studentName}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Peso atual',
            value: withWeight.length ? `${withWeight[withWeight.length - 1].weight} kg` : '—',
            sub: weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg total` : undefined,
            color: 'text-brand-lime',
          },
          {
            label: 'Treinos',
            value: sessions.length,
            sub: `~${avgDuration}min/sessão`,
            color: 'text-blue-400',
          },
          {
            label: 'Pontos do mês',
            value: monthlyPoints?.total_points?.toLocaleString('pt-BR') ?? '0',
            sub: `${monthlyPoints?.workouts_completed ?? 0} treinos`,
            color: 'text-yellow-400',
          },
          {
            label: 'Fotos',
            value: totalPhotos,
            sub: `${progressEntries.length} registros`,
            color: 'text-text-primary',
          },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-surface-border rounded-xl p-4">
            <p className={`font-display font-bold text-2xl ${card.color}`}>{card.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{card.label}</p>
            {card.sub && <p className="text-[10px] text-text-secondary/60 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.slice(0, 8).map((b, i) => {
            const meta = BADGE_META[b.badge_type]
            if (!meta) return null
            const Icon = meta.icon
            return (
              <div
                key={i}
                className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-semibold border', meta.color)}
                title={`${meta.label} — ${new Date(b.earned_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
              >
                <Icon size={11} />
                {meta.label}
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:flex gap-1 bg-surface border border-surface-border rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-semibold transition-all sm:flex-1',
              tab === id
                ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Peso ao longo do tempo */}
            {weightPoints.length >= 2 ? (
              <LineChart points={weightPoints} color="#E8FF47" height={150} label="Evolução de Peso" unit=" kg" />
            ) : (
              <div className="bg-surface border border-surface-border rounded-xl p-5">
                <p className="text-xs text-text-secondary font-body font-semibold uppercase tracking-widest mb-3">Evolução de Peso</p>
                <p className="text-sm text-text-secondary">Registros insuficientes (mínimo 2 para o gráfico).</p>
              </div>
            )}

            {/* Frequência mensal */}
            <FrequencyBars sessions={sessions} />

            {/* Métricas de gamificação do mês */}
            {monthlyPoints && (
              <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border">
                  <Trophy size={14} className="text-yellow-400" />
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Desempenho do Mês</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-surface-border sm:border-t-0 sm:divide-x divide-surface-border">
                  {[
                    { label: 'Pontos',       value: monthlyPoints.total_points.toLocaleString('pt-BR'), icon: Trophy,   color: 'text-yellow-400' },
                    { label: 'Treinos',      value: monthlyPoints.workouts_completed, icon: Dumbbell, color: 'text-brand-lime' },
                    { label: 'Exercícios',   value: monthlyPoints.exercises_completed, icon: Zap,     color: 'text-blue-400'   },
                    { label: '+Cargas',      value: monthlyPoints.load_increases,      icon: TrendingUp, color: 'text-green-400' },
                    { label: 'Min. ativos',  value: monthlyPoints.active_minutes,      icon: Clock,   color: 'text-purple-400' },
                  ].map((m) => {
                    const Icon = m.icon
                    return (
                      <div key={m.label} className="flex flex-col items-center py-4 gap-1">
                        <Icon size={16} className={m.color} />
                        <p className={`font-display font-bold text-xl ${m.color}`}>{m.value}</p>
                        <p className="text-[10px] text-text-secondary">{m.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'cargas' && (
          <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Dumbbell size={14} className="text-brand-lime" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Evolução de Cargas por Exercício</p>
            </div>
            <LoadProgressionChart sessionExercises={sessionExercises} sessions={sessions} />
          </div>
        )}

        {tab === 'sessoes' && (
          <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-text-secondary" />
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                  Histórico de Sessões ({sessions.length})
                </p>
              </div>
              {sessions.length > 0 && (
                <p className="text-xs text-text-secondary">
                  Duração média: <span className="text-text-primary font-semibold">{avgDuration}min</span>
                </p>
              )}
            </div>
            <SessionList sessions={sessions} />
          </div>
        )}

        {tab === 'fotos' && (
          <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-text-secondary" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                Fotos de Progresso ({totalPhotos})
              </p>
            </div>
            <PhotosSection entries={progressEntries} />
          </div>
        )}
      </div>
    </div>
  )
}
