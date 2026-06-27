import { Trophy, Medal, Star, Flame, Zap, Target, Shield, Crown, TrendingUp, Dumbbell, Clock } from 'lucide-react'
import { getGamificationSettings, getCurrentRanking, getMyRankingCard, getRankingHistory } from '@/app/actions/gamification'

// ─── Configuração de badges ───────────────────────────────────────────────────
const BADGE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  foco_total:           { label: 'Foco Total',         icon: Flame,      color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  evolucao_aco:         { label: 'Evolução de Aço',    icon: TrendingUp, color: 'text-blue-400   bg-blue-400/10   border-blue-400/30'   },
  consistencia_maxima:  { label: 'Consistência Máx.',  icon: Shield,     color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  top_10:               { label: 'Top 10',             icon: Star,       color: 'text-brand-lime bg-brand-lime/10 border-brand-lime/30' },
  campeao_mes:          { label: 'Campeão do Mês',     icon: Crown,      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  disciplina:           { label: 'Disciplina',         icon: Target,     color: 'text-cyan-400   bg-cyan-400/10   border-cyan-400/30'   },
  treino_completo:      { label: 'Treino Completo',    icon: Zap,        color: 'text-green-400  bg-green-400/10  border-green-400/30'  },
}

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function BadgeChip({ type }: { type: string }) {
  const cfg = BADGE_CONFIG[type]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function Medal1() {
  return (
    <div className="w-10 h-10 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center flex-shrink-0">
      <span className="text-yellow-400 font-display font-black text-sm">1</span>
    </div>
  )
}
function Medal2() {
  return (
    <div className="w-9 h-9 rounded-full bg-zinc-400/20 border-2 border-zinc-400 flex items-center justify-center flex-shrink-0">
      <span className="text-zinc-400 font-display font-black text-sm">2</span>
    </div>
  )
}
function Medal3() {
  return (
    <div className="w-8 h-8 rounded-full bg-orange-700/20 border-2 border-orange-700 flex items-center justify-center flex-shrink-0">
      <span className="text-orange-700 font-display font-black text-xs">3</span>
    </div>
  )
}

// ─── Componente de posição no ranking ─────────────────────────────────────────
function RankMedal({ position }: { position: number }) {
  if (position === 1) return <Medal1 />
  if (position === 2) return <Medal2 />
  if (position === 3) return <Medal3 />
  return (
    <div className="w-8 h-8 rounded-full bg-surface-border/40 flex items-center justify-center flex-shrink-0">
      <span className="text-text-secondary font-body font-bold text-xs">{position}</span>
    </div>
  )
}

// ─── Motivational messages ────────────────────────────────────────────────────
function getMotivationalMessage(rank: number | null, total: number, pointsToNext: number | null): string {
  if (!rank) return 'Complete seu primeiro treino para entrar no ranking!'
  if (rank === 1) return '🏆 Você é o líder do ranking! Mantenha o ritmo!'
  if (rank <= 3) return `🥇 Você está no Top 3! Só faltam ${pointsToNext ?? '?'} pts para subir!`
  if (rank <= 10) return `⭐ Você está no Top 10! Continue assim!`
  if (pointsToNext && pointsToNext < 50) return `🔥 Você está quase no Top ${rank - 1}! Faltam só ${pointsToNext} pts!`
  if (rank <= Math.ceil(total / 2)) return `💪 Você está na metade superior! Continue treinando para subir!`
  return `🎯 Continue treinando para subir no ranking! Faltam ${pointsToNext ?? '?'} pts para o próximo.`
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default async function StudentRankingPage() {
  const [settings, ranking, myCard, history] = await Promise.all([
    getGamificationSettings(),
    getCurrentRanking(50),
    getMyRankingCard(),
    getRankingHistory(3),
  ])

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  // ── Módulo desativado ─────────────────────────────────────────────────────
  if (!settings?.is_active) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-surface-border/30 flex items-center justify-center">
          <Trophy size={36} className="text-text-secondary/40" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black text-text-primary uppercase tracking-widest">
            Ranking dos Campeões
          </h1>
          <p className="text-text-secondary text-sm mt-2 max-w-xs mx-auto">
            O ranking ainda não foi ativado. Em breve a competição começa!
          </p>
        </div>
        <div className="bg-surface border border-surface-border rounded-xl p-5 max-w-sm w-full text-left space-y-2">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-widest">O que esperar</p>
          {[
            'Competição mensal com alunos de toda a plataforma',
            'Pontos por treinos, evolução de carga e consistência',
            'Badges exclusivos e pódio dos campeões',
            'Destaque especial para o 1º, 2º e 3º lugar',
          ].map((item, i) => (
            <p key={i} className="text-sm text-text-secondary flex items-start gap-2">
              <Star size={12} className="text-brand-lime mt-0.5 flex-shrink-0" />
              {item}
            </p>
          ))}
        </div>
      </div>
    )
  }

  const top3   = ranking.slice(0, 3)
  const others = ranking.slice(3)
  const motivational = getMotivationalMessage(myCard?.myRank ?? null, myCard?.totalStudents ?? 0, myCard?.pointsToNext ?? null)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
            <Trophy size={22} className="text-yellow-400" />
            Ranking dos Campeões
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {MONTH_NAMES[month]} {year} · {ranking.length} participante{ranking.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Meu Card ───────────────────────────────────────────────────────── */}
      {myCard && (
        <div className="bg-gradient-to-br from-brand-lime/10 via-surface to-surface border border-brand-lime/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-brand-lime font-semibold uppercase tracking-widest">Minha posição</p>
            {myCard.myRank && myCard.myRank <= 3 && (
              <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                🏆 Top 3!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-lime/10 border-2 border-brand-lime/30 flex items-center justify-center flex-shrink-0">
              {myCard.myRank ? (
                <span className="font-display font-black text-2xl text-brand-lime">
                  #{myCard.myRank}
                </span>
              ) : (
                <Trophy size={24} className="text-brand-lime/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-black text-3xl text-text-primary">
                {myCard.myPoints?.total_points ?? 0}
                <span className="text-sm font-body font-normal text-text-secondary ml-1">pts</span>
              </p>
              {myCard.myRank ? (
                <p className="text-xs text-text-secondary mt-0.5">
                  {myCard.myRank}º de {myCard.totalStudents} participantes
                  {myCard.pointsToNext && ` · faltam ${myCard.pointsToNext} pts para subir`}
                </p>
              ) : (
                <p className="text-xs text-text-secondary mt-0.5">Nenhum treino concluído ainda este mês</p>
              )}
            </div>
          </div>

          {/* Stats rápidos */}
          {myCard.myPoints && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'Treinos', value: myCard.myPoints.workouts_completed, icon: Dumbbell },
                { label: 'Exercícios', value: myCard.myPoints.exercises_completed, icon: Target },
                { label: 'Minutos', value: myCard.myPoints.active_minutes, icon: Clock },
              ].map(stat => (
                <div key={stat.label} className="bg-surface-border/20 rounded-xl p-3 text-center">
                  <stat.icon size={14} className="text-text-secondary mx-auto mb-1" />
                  <p className="font-body font-bold text-text-primary text-lg">{stat.value}</p>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Badges do mês */}
          {myCard.badges.length > 0 && (
            <div>
              <p className="text-xs text-text-secondary mb-2">Badges conquistadas este mês</p>
              <div className="flex flex-wrap gap-1.5">
                {myCard.badges.map(b => <BadgeChip key={b.badge_type} type={b.badge_type} />)}
              </div>
            </div>
          )}

          {/* Mensagem motivacional */}
          <p className="text-xs text-text-secondary/80 bg-surface-border/20 rounded-lg px-3 py-2 italic">
            {motivational}
          </p>
        </div>
      )}

      {/* ── Campeão do mês anterior ────────────────────────────────────────── */}
      {history.length > 0 && (() => {
        const last = history[0]
        const firstEntry = (last.rankings as Array<{
          position: number
          student_name: string
          trainer_name: string | null
          points: number
        }>)?.[0]
        if (!firstEntry) return null
        return (
          <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center flex-shrink-0">
              <Crown size={20} className="text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest">
                Campeão — {MONTH_NAMES[last.month]} {last.year}
              </p>
              <p className="font-body font-bold text-text-primary text-sm truncate">{firstEntry.student_name}</p>
              <p className="text-xs text-text-secondary">{firstEntry.points.toLocaleString('pt-BR')} pts · {firstEntry.trainer_name}</p>
            </div>
          </div>
        )
      })()}

      {/* ── Pódio Top 3 ────────────────────────────────────────────────────── */}
      {top3.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Medal size={12} />
            Pódio — {MONTH_NAMES[month]}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 2º lugar */}
            {top3[1] ? (
              <div className="bg-zinc-400/5 border border-zinc-400/20 rounded-xl p-4 flex flex-col items-center gap-2 mt-4">
                <Medal2 />
                <div className="text-center">
                  <p className="font-body font-bold text-text-primary text-sm leading-tight truncate max-w-full">
                    {top3[1].student_name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-zinc-400 font-bold">{top3[1].total_points.toLocaleString('pt-BR')} pts</p>
                  <p className="text-xs text-text-secondary/50 truncate">{top3[1].trainer_name}</p>
                </div>
              </div>
            ) : <div />}

            {/* 1º lugar — destaque maior */}
            {top3[0] && (
              <div className="bg-yellow-400/5 border border-yellow-400/30 rounded-xl p-4 flex flex-col items-center gap-2 ring-1 ring-yellow-400/20">
                <Trophy size={16} className="text-yellow-400" />
                <Medal1 />
                <div className="text-center">
                  <p className="font-body font-bold text-text-primary text-sm leading-tight truncate max-w-full">
                    {top3[0].student_name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-yellow-400 font-bold">{top3[0].total_points.toLocaleString('pt-BR')} pts</p>
                  <p className="text-xs text-text-secondary/50 truncate">{top3[0].trainer_name}</p>
                </div>
              </div>
            )}

            {/* 3º lugar */}
            {top3[2] ? (
              <div className="bg-orange-700/5 border border-orange-700/20 rounded-xl p-4 flex flex-col items-center gap-2 mt-8">
                <Medal3 />
                <div className="text-center">
                  <p className="font-body font-bold text-text-primary text-sm leading-tight truncate max-w-full">
                    {top3[2].student_name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-orange-700 font-bold">{top3[2].total_points.toLocaleString('pt-BR')} pts</p>
                  <p className="text-xs text-text-secondary/50 truncate">{top3[2].trainer_name}</p>
                </div>
              </div>
            ) : <div />}
          </div>
        </div>
      )}

      {/* ── Ranking completo ────────────────────────────────────────────────── */}
      {ranking.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center">
          <Trophy size={32} className="text-text-secondary/30 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Nenhum treino registrado ainda este mês.</p>
          <p className="text-text-secondary/60 text-xs mt-1">Complete um treino para entrar no ranking!</p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex flex-col gap-1 px-4 py-3 border-b border-surface-border sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Classificação Geral
            </p>
            <p className="text-xs text-text-secondary">{ranking.length} alunos</p>
          </div>

          <div className="divide-y divide-surface-border">
            {ranking.map((entry) => {
              const isMe = myCard?.studentId === entry.student_id
              return (
                <div
                  key={entry.student_id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors sm:px-5 sm:items-center ${
                    isMe ? 'bg-brand-lime/5 border-l-2 border-brand-lime' : 'hover:bg-surface-border/10'
                  }`}
                >
                  <RankMedal position={entry.rank_position} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-body font-semibold truncate ${isMe ? 'text-brand-lime' : 'text-text-primary'}`}>
                        {entry.student_name}
                        {isMe && <span className="ml-1 text-xs font-normal">(você)</span>}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary/60 truncate">{entry.trainer_name}</p>
                  </div>

                  <div className="text-right flex-shrink-0 self-center">
                    <p className={`font-body font-bold text-sm ${isMe ? 'text-brand-lime' : 'text-text-primary'}`}>
                      {entry.total_points.toLocaleString('pt-BR')}
                      <span className="text-xs font-normal text-text-secondary ml-0.5">pts</span>
                    </p>
                    <p className="text-xs text-text-secondary/50">{entry.workouts_completed} treinos</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Histórico de campeões ──────────────────────────────────────────── */}
      {history.length > 1 && (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Campeões Anteriores</p>
          </div>
          <div className="divide-y divide-surface-border">
            {history.slice(1).map((snap) => {
              const top = (snap.rankings as Array<{
                position: number
                student_name: string
                points: number
              }>)?.[0]
              if (!top) return null
              return (
                <div key={snap.id} className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:gap-4">
                  <Crown size={14} className="text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">{top.student_name}</p>
                    <p className="text-xs text-text-secondary">{MONTH_NAMES[snap.month]} {snap.year}</p>
                  </div>
                  <p className="text-sm font-bold text-text-primary flex-shrink-0">
                    {top.points.toLocaleString('pt-BR')} pts
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Como ganhar pontos ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Como Ganhar Pontos</p>
        </div>
        <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:p-5">
          {[
            { label: 'Treino concluído',      pts: `+${settings.pts_workout_completed}`,   icon: Dumbbell   },
            { label: 'Treino 100% completo',  pts: `+${settings.pts_workout_100_percent}`, icon: Target     },
            { label: 'Por exercício feito',   pts: `+${settings.pts_exercise_completed}`,  icon: Zap        },
            { label: 'Aumento de carga',      pts: `+${settings.pts_load_increase}`,       icon: TrendingUp },
            { label: 'Por minuto ativo',      pts: `+${settings.pts_per_minute_active}`,   icon: Clock      },
            { label: 'Bônus 3x/semana',       pts: `+${settings.pts_weekly_bonus}`,        icon: Flame      },
            { label: 'Consistência 4 semanas',pts: `+${settings.pts_monthly_consistency}`, icon: Shield     },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon size={14} className="text-brand-lime flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-secondary truncate">{item.label}</p>
                <p className="text-xs font-bold text-brand-lime">{item.pts} pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
