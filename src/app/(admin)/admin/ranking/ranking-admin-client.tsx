'use client'

import { useState, useTransition } from 'react'
import {
  Trophy, Crown, Medal, Users, ChevronDown, Lock, Unlock,
  RefreshCw, CheckCircle2, AlertTriangle, Flame, TrendingUp,
  Zap, Target, Shield, Star, Clock, Dumbbell,
} from 'lucide-react'
import {
  updateGamificationSettings,
  closeMonthlyRanking,
  type GamificationSettings,
} from '@/app/actions/gamification'

type RankRow = {
  rank_position: number
  student_id: string
  student_name: string
  student_avatar: string | null
  trainer_name: string | null
  tenant_id: string | null
  total_points: number
  workouts_completed: number
  exercises_completed: number
  load_increases: number
  active_minutes: number
  weekly_bonuses: number
  consistency_bonuses: number
}

type SnapRow = {
  id: string
  month: number
  year: number
  closed_at: string
  champion_id: string | null
  rankings: unknown
}

type Tenant = { id: string; business_name: string }

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const BADGE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  foco_total:          { label: 'Foco Total',        icon: Flame,      color: 'text-orange-400' },
  evolucao_aco:        { label: 'Evolução de Aço',   icon: TrendingUp, color: 'text-blue-400'   },
  consistencia_maxima: { label: 'Consistência Máx.', icon: Shield,     color: 'text-purple-400' },
  top_10:              { label: 'Top 10',            icon: Star,       color: 'text-brand-lime' },
  campeao_mes:         { label: 'Campeão',           icon: Crown,      color: 'text-yellow-400' },
  disciplina:          { label: 'Disciplina',        icon: Target,     color: 'text-cyan-400'   },
  treino_completo:     { label: '100% Completo',     icon: Zap,        color: 'text-green-400'  },
}

function RankMedal({ pos }: { pos: number }) {
  if (pos === 1) return (
    <div className="w-8 h-8 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center flex-shrink-0">
      <span className="text-yellow-400 font-display font-black text-xs">1</span>
    </div>
  )
  if (pos === 2) return (
    <div className="w-8 h-8 rounded-full bg-zinc-400/20 border-2 border-zinc-400 flex items-center justify-center flex-shrink-0">
      <span className="text-zinc-400 font-display font-black text-xs">2</span>
    </div>
  )
  if (pos === 3) return (
    <div className="w-8 h-8 rounded-full bg-orange-700/20 border-2 border-orange-700 flex items-center justify-center flex-shrink-0">
      <span className="text-orange-700 font-display font-black text-xs">3</span>
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-full bg-surface-border/40 flex items-center justify-center flex-shrink-0">
      <span className="text-text-secondary font-body font-bold text-xs">{pos}</span>
    </div>
  )
}

interface Props {
  settings: GamificationSettings | null
  initialRanking: RankRow[]
  history: SnapRow[]
  tenants: Tenant[]
  currentMonth: number
  currentYear: number
}

export function RankingAdminClient({
  settings,
  initialRanking,
  history,
  tenants,
  currentMonth,
  currentYear,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive]       = useState(settings?.is_active ?? false)
  const [filterTenant, setFilterTenant] = useState<string>('')
  const [closingMonth, setClosingMonth] = useState(currentMonth)
  const [closingYear, setClosingYear]   = useState(currentYear)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const ranking = filterTenant
    ? initialRanking.filter(r => r.tenant_id === filterTenant)
    : initialRanking

  // ── Toggle gamificação ────────────────────────────────────────────────────
  function handleToggle() {
    const next = !isActive
    startTransition(async () => {
      const result = await updateGamificationSettings({ is_active: next })
      if (result.error) {
        setFeedback({ type: 'error', msg: result.error })
      } else {
        setIsActive(next)
        setFeedback({
          type: 'success',
          msg: next
            ? 'Ranking ativado! A contagem de pontos foi iniciada.'
            : 'Ranking desativado. Pontuação pausada e módulo ocultado dos alunos.',
        })
      }
    })
  }

  // ── Fechar mês ────────────────────────────────────────────────────────────
  function handleClose() {
    const confirmed = window.confirm(
      `Fechar ranking de ${MONTH_NAMES[closingMonth]} ${closingYear}?\n\n` +
      `Isso salvará o Top 3, concederá badge de Campeão ao 1º lugar e encerrará o mês oficialmente.`,
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await closeMonthlyRanking(closingMonth, closingYear)
      if (result.error) {
        setFeedback({ type: 'error', msg: result.error })
      } else {
        setFeedback({
          type: 'success',
          msg: `Ranking de ${MONTH_NAMES[closingMonth]} ${closingYear} fechado com ${result.positions} posições registradas!`,
        })
      }
    })
  }

  return (
    <div className="space-y-5">

      {/* ── Feedback ─────────────────────────────────────────────────────────── */}
      {feedback && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          feedback.type === 'success'
            ? 'bg-status-success/5 border-status-success/20 text-status-success'
            : 'bg-status-error/5 border-status-error/20 text-status-error'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle2 size={16} className="flex-shrink-0" />
            : <AlertTriangle size={16} className="flex-shrink-0" />
          }
          <p className="text-sm">{feedback.msg}</p>
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Painel de controle ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Toggle ativo/inativo */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            {isActive ? <Unlock size={16} className="text-status-success" /> : <Lock size={16} className="text-text-secondary" />}
            <p className="text-sm font-semibold text-text-primary">Status da Gamificação</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {isActive
              ? 'O ranking está ativo. Alunos estão acumulando pontos e o módulo aparece na navegação deles.'
              : 'O ranking está desativado. Nenhum ponto é contabilizado e o módulo não aparece para os alunos.'
            }
          </p>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isActive
                ? 'bg-status-error/10 text-status-error border border-status-error/20 hover:bg-status-error/20'
                : 'bg-status-success/10 text-status-success border border-status-success/20 hover:bg-status-success/20'
            } disabled:opacity-50`}
          >
            {isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
            {isActive ? 'Desativar Ranking' : 'Ativar Ranking'}
          </button>
        </div>

        {/* Fechar mês */}
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-yellow-400" />
            <p className="text-sm font-semibold text-text-primary">Fechar Ranking do Mês</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Registra oficialmente o Top 3, concede o badge de Campeão ao 1º lugar e salva o snapshot histórico.
          </p>
          <div className="flex gap-2">
            <select
              value={closingMonth}
              onChange={e => setClosingMonth(Number(e.target.value))}
              className="flex-1 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
            >
              {MONTH_NAMES.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={closingYear}
              onChange={e => setClosingYear(Number(e.target.value))}
              className="w-24 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
            >
              {[currentYear - 1, currentYear].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-all disabled:opacity-50"
          >
            {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Crown size={14} />}
            Fechar e Registrar Campeão
          </button>
        </div>
      </div>

      {/* ── Filtro por personal / tenant ─────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Filtrar por Personal</p>
          <select
            value={filterTenant}
            onChange={e => setFilterTenant(e.target.value)}
            className="flex-1 min-w-[200px] bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
          >
            <option value="">Todos os personais ({initialRanking.length} alunos)</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>
                {t.business_name} ({initialRanking.filter(r => r.tenant_id === t.id).length} alunos)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Ranking atual ─────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Ranking Atual — {MONTH_NAMES[currentMonth]} {currentYear}
            </p>
          </div>
          <p className="text-xs text-text-secondary">{ranking.length} alunos</p>
        </div>

        {ranking.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={32} className="text-text-secondary/20 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">
              {filterTenant ? 'Nenhum aluno deste personal no ranking.' : 'Nenhum aluno no ranking ainda.'}
            </p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-5 py-2 border-b border-surface-border/50 bg-surface-border/10">
              <span className="text-xs text-text-secondary/50 w-8 text-center">#</span>
              <span className="text-xs text-text-secondary/50">Aluno</span>
              <span className="text-xs text-text-secondary/50 w-16 text-center hidden sm:block">Treinos</span>
              <span className="text-xs text-text-secondary/50 w-16 text-center hidden md:block">Exercícios</span>
              <span className="text-xs text-text-secondary/50 w-16 text-center hidden lg:block">Cargas+</span>
              <span className="text-xs text-text-secondary/50 w-20 text-right">Pontos</span>
            </div>

            <div className="divide-y divide-surface-border max-h-[600px] overflow-y-auto">
              {ranking.map((row) => (
                <div
                  key={row.student_id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-5 py-3 hover:bg-surface-border/10 transition-colors ${
                    row.rank_position <= 3 ? 'bg-yellow-400/2' : ''
                  }`}
                >
                  <RankMedal pos={row.rank_position} />
                  <div className="min-w-0">
                    <p className="text-sm font-body font-semibold text-text-primary truncate">{row.student_name}</p>
                    <p className="text-xs text-text-secondary/60 truncate">{row.trainer_name}</p>
                  </div>
                  <span className="text-sm text-text-secondary w-16 text-center hidden sm:block">{row.workouts_completed}</span>
                  <span className="text-sm text-text-secondary w-16 text-center hidden md:block">{row.exercises_completed}</span>
                  <span className="text-sm text-text-secondary w-16 text-center hidden lg:block">{row.load_increases}</span>
                  <span className={`font-body font-bold text-sm w-20 text-right ${
                    row.rank_position === 1 ? 'text-yellow-400' :
                    row.rank_position === 2 ? 'text-zinc-400'   :
                    row.rank_position === 3 ? 'text-orange-700' : 'text-text-primary'
                  }`}>
                    {row.total_points.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Histórico de meses fechados ──────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border">
            <Crown size={14} className="text-yellow-400" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Histórico de Campeões
            </p>
          </div>
          <div className="divide-y divide-surface-border">
            {history.map((snap) => {
              type SnapEntry = { position: number; student_name: string; trainer_name: string | null; points: number }
              const top3 = (snap.rankings as SnapEntry[])?.slice(0, 3) ?? []
              return (
                <details key={snap.id} className="group">
                  <summary className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-surface-border/10 list-none">
                    <Crown size={14} className="text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {MONTH_NAMES[snap.month]} {snap.year}
                      </p>
                      {top3[0] && (
                        <p className="text-xs text-text-secondary/60 truncate">
                          🥇 {top3[0].student_name} · {top3[0].points.toLocaleString('pt-BR')} pts
                        </p>
                      )}
                    </div>
                    <ChevronDown size={14} className="text-text-secondary/40 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-5 pb-4 space-y-2">
                    {top3.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary font-medium truncate">{entry.student_name}</p>
                          <p className="text-xs text-text-secondary/60">{entry.trainer_name}</p>
                        </div>
                        <p className="text-sm font-bold text-text-primary flex-shrink-0">
                          {entry.points.toLocaleString('pt-BR')} pts
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Análise: mais ativos e maior evolução ─────────────────────────────── */}
      {initialRanking.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Mais ativos (mais treinos) */}
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
              <Dumbbell size={13} className="text-blue-400" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Mais Ativos</p>
            </div>
            <div className="divide-y divide-surface-border">
              {[...initialRanking]
                .sort((a, b) => b.workouts_completed - a.workouts_completed)
                .slice(0, 5)
                .map((r, i) => (
                  <div key={r.student_id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-text-secondary/50 w-4">{i + 1}.</span>
                    <p className="text-xs text-text-primary font-medium flex-1 truncate">{r.student_name}</p>
                    <span className="text-xs font-bold text-blue-400">{r.workouts_completed}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Maior evolução (mais load increases) */}
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
              <TrendingUp size={13} className="text-green-400" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Maior Evolução</p>
            </div>
            <div className="divide-y divide-surface-border">
              {[...initialRanking]
                .sort((a, b) => b.load_increases - a.load_increases)
                .slice(0, 5)
                .map((r, i) => (
                  <div key={r.student_id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-text-secondary/50 w-4">{i + 1}.</span>
                    <p className="text-xs text-text-primary font-medium flex-1 truncate">{r.student_name}</p>
                    <span className="text-xs font-bold text-green-400">{r.load_increases}x</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Personais com mais alunos no ranking */}
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
              <Users size={13} className="text-purple-400" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Por Personal</p>
            </div>
            <div className="divide-y divide-surface-border">
              {Object.entries(
                initialRanking.reduce<Record<string, number>>((acc, r) => {
                  const key = r.trainer_name ?? 'Sem personal'
                  acc[key] = (acc[key] ?? 0) + 1
                  return acc
                }, {}),
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-text-secondary/50 w-4">{i + 1}.</span>
                    <p className="text-xs text-text-primary font-medium flex-1 truncate">{name}</p>
                    <span className="text-xs font-bold text-purple-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
