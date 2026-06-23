import { Trophy, Users, Dumbbell, TrendingUp, Settings } from 'lucide-react'
import {
  getGamificationSettings,
  getAdminRanking,
  getRankingHistory,
  getTenantsForFilter,
} from '@/app/actions/gamification'
import { RankingAdminClient } from './ranking-admin-client'

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default async function AdminRankingPage() {
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const [settings, ranking, history, tenants] = await Promise.all([
    getGamificationSettings(),
    getAdminRanking(month, year),
    getRankingHistory(12),
    getTenantsForFilter(),
  ])

  // Métricas gerais do mês atual
  const totalStudents      = ranking.length
  const totalPoints        = ranking.reduce((s, r) => s + r.total_points, 0)
  const totalWorkouts      = ranking.reduce((s, r) => s + r.workouts_completed, 0)
  const avgPoints          = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <Trophy size={22} className="text-yellow-400" />
            Ranking dos Campeões
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {MONTH_NAMES[month]} {year} · Competição global de alunos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            settings?.is_active
              ? 'text-status-success bg-status-success/10 border-status-success/20'
              : 'text-text-secondary bg-surface-border/30 border-surface-border'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${settings?.is_active ? 'bg-status-success animate-pulse' : 'bg-text-secondary/40'}`} />
            {settings?.is_active ? 'Ranking Ativo' : 'Ranking Inativo'}
          </span>
        </div>
      </div>

      {/* ── Métricas do mês ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Participantes',   value: totalStudents, icon: Users,      color: 'text-blue-400   bg-blue-400/10   border-blue-400/20'   },
          { label: 'Pontos totais',   value: totalPoints.toLocaleString('pt-BR'), icon: Trophy, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
          { label: 'Treinos feitos',  value: totalWorkouts, icon: Dumbbell,   color: 'text-green-400  bg-green-400/10  border-green-400/20'  },
          { label: 'Média de pontos', value: avgPoints,     icon: TrendingUp, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-surface-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold text-text-primary truncate">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Client interativo: toggle, filtros, ranking, fechar mês ───────── */}
      <RankingAdminClient
        settings={settings}
        initialRanking={ranking}
        history={history}
        tenants={tenants}
        currentMonth={month}
        currentYear={year}
      />

      {/* ── Configurações de pontuação ─────────────────────────────────────── */}
      {settings && (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border">
            <Settings size={14} className="text-text-secondary" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Pesos de Pontuação Configurados
            </p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Treino concluído',     value: settings.pts_workout_completed    },
              { label: 'Por exercício',         value: settings.pts_exercise_completed   },
              { label: 'Treino 100%',           value: settings.pts_workout_100_percent  },
              { label: 'Aumento de carga',      value: settings.pts_load_increase        },
              { label: 'Por minuto ativo',      value: settings.pts_per_minute_active    },
              { label: 'Bônus semanal (3x)',    value: settings.pts_weekly_bonus         },
              { label: 'Consistência mensal',   value: settings.pts_monthly_consistency  },
              { label: 'Cap por sessão',        value: settings.max_pts_per_session      },
              { label: 'Cap de minutos',        value: settings.max_minutes_per_session  },
              { label: 'Duração mínima (s)',    value: settings.min_session_duration_secs},
            ].map(item => (
              <div key={item.label} className="space-y-0.5">
                <p className="text-xs text-text-secondary">{item.label}</p>
                <p className="font-body font-bold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
