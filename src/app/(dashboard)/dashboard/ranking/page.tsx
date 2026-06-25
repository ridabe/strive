import { createClient } from '@/lib/supabase/server'
import { Trophy, Medal, Star, Dumbbell, TrendingUp, Zap, Clock, Users } from 'lucide-react'

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const BADGE_META: Record<string, { label: string; color: string }> = {
  foco_total:          { label: 'Foco Total',          color: 'text-blue-400   bg-blue-400/10   border-blue-400/20'   },
  evolucao_aco:        { label: 'Evolução de Aço',     color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  consistencia_maxima: { label: 'Consistência Máxima', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  top_10:              { label: 'Top 10',              color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  campeao_mes:         { label: 'Campeão do Mês',      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  disciplina:          { label: 'Disciplina',          color: 'text-green-400  bg-green-400/10  border-green-400/20'  },
  treino_completo:     { label: 'Treino Completo',     color: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20' },
}

function MedalIcon({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-xl">🥇</span>
  if (pos === 2) return <span className="text-xl">🥈</span>
  if (pos === 3) return <span className="text-xl">🥉</span>
  return (
    <span className="w-7 h-7 rounded-full bg-surface-border/40 flex items-center justify-center text-xs font-display font-bold text-text-secondary">
      {pos}
    </span>
  )
}

export default async function RankingDashboardPage() {
  const supabase = await createClient()

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  // Tenant do personal logado
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user!.id)
    .single()

  const tenantId = profile?.tenant_id

  // Configuração de gamificação
  const { data: settings } = await supabase
    .from('gamification_settings')
    .select('is_active')
    .single()

  // Ranking global do mês atual (top 100)
  const { data: globalRanking } = await supabase
    .from('monthly_points')
    .select(`
      student_id, total_points, workouts_completed, exercises_completed,
      load_increases, active_minutes,
      students (
        id, full_name, avatar_url,
        tenants ( id, business_name )
      )
    `)
    .eq('month', month)
    .eq('year', year)
    .order('total_points', { ascending: false })
    .order('workouts_completed', { ascending: false })
    .limit(100)

  type RankRow = typeof globalRanking extends (infer T)[] | null ? T : never

  const withPosition = (globalRanking ?? []).map((row: RankRow, idx) => ({
    ...row,
    rank_position: idx + 1,
  }))

  // Alunos do tenant (para filtrar ranking próprio)
  const { data: myStudents } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('tenant_id', tenantId!)
    .eq('status', 'active')

  const myStudentIds = new Set((myStudents ?? []).map((s) => s.id))

  const myRanking    = withPosition.filter((r) => myStudentIds.has(r.student_id))
  const globalTop    = withPosition.slice(0, 50)

  // Badges dos alunos do tenant no mês atual
  const { data: badges } = await supabase
    .from('student_badges')
    .select('student_id, badge_type')
    .in('student_id', Array.from(myStudentIds))
    .eq('month', month)
    .eq('year', year)

  const badgeByStudent: Record<string, string[]> = {}
  ;(badges ?? []).forEach((b) => {
    if (!badgeByStudent[b.student_id]) badgeByStudent[b.student_id] = []
    badgeByStudent[b.student_id].push(b.badge_type)
  })

  // Histórico de campeões (últimos 6 meses)
  const { data: history } = await supabase
    .from('monthly_ranking_snapshots')
    .select('month, year, rankings, closed_at')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(6)

  // Stats gerais do mês
  const totalParticipants = globalRanking?.length ?? 0
  const myParticipants    = myRanking.length
  const myBestPos         = myRanking[0]?.rank_position ?? null

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <Trophy size={22} className="text-yellow-400" />
            Ranking
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {MONTH_NAMES[month]} {year} · Competição global entre alunos
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
          settings?.is_active
            ? 'text-status-success bg-status-success/10 border-status-success/20'
            : 'text-text-secondary bg-surface-border/30 border-surface-border'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${settings?.is_active ? 'bg-status-success animate-pulse' : 'bg-text-secondary/40'}`} />
          {settings?.is_active ? 'Ranking Ativo' : 'Ranking Inativo'}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Participantes globais', value: totalParticipants, icon: Users,      color: 'text-blue-400   bg-blue-400/10   border-blue-400/20'   },
          { label: 'Meus alunos no rank',   value: myParticipants,   icon: Trophy,     color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
          { label: 'Minha melhor posição',  value: myBestPos ? `#${myBestPos}` : '—', icon: Medal, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
          { label: 'Badges conquistadas',   value: badges?.length ?? 0, icon: Star,    color: 'text-green-400  bg-green-400/10  border-green-400/20'  },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-surface-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Meus alunos no ranking */}
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
            <Users size={14} className="text-text-secondary" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Meus Alunos — Posição Global
            </p>
          </div>

          {myRanking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary text-sm gap-3">
              <Dumbbell size={32} className="opacity-20" />
              <div className="text-center">
                <p>Nenhum aluno participando ainda.</p>
                <p className="text-xs mt-1">Os alunos ganham pontos ao concluir treinos no app.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-surface-border max-h-[480px] overflow-y-auto">
              {myRanking.map((r) => {
                type StudentRow = { id: string; full_name: string; avatar_url: string | null; tenants: { id: string; business_name: string } | null } | null
                const st = (r.students as unknown) as StudentRow
                const studentBadges = badgeByStudent[r.student_id] ?? []
                return (
                  <div key={r.student_id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-border/10">
                    <MedalIcon pos={r.rank_position} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-body font-semibold text-text-primary">{st?.full_name ?? '—'}</p>
                        {studentBadges.slice(0, 2).map((bt) => {
                          const m = BADGE_META[bt]
                          return m ? (
                            <span key={bt} className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${m.color}`}>
                              {m.label}
                            </span>
                          ) : null
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-text-secondary">
                        <span className="flex items-center gap-0.5"><Dumbbell size={10} /> {r.workouts_completed}</span>
                        <span className="flex items-center gap-0.5"><TrendingUp size={10} /> {r.load_increases} cargas</span>
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {r.active_minutes}min</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-bold text-brand-lime text-lg">{r.total_points.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-text-secondary">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ranking global top 50 */}
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
            <Trophy size={14} className="text-yellow-400" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Top 50 Global
            </p>
          </div>

          {globalTop.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary text-sm gap-3">
              <Trophy size={32} className="opacity-20" />
              <p>Sem dados para este mês ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border max-h-[480px] overflow-y-auto">
              {globalTop.map((r) => {
                type StudentRow = { id: string; full_name: string; avatar_url: string | null; tenants: { id: string; business_name: string } | null } | null
                const st = (r.students as unknown) as StudentRow
                const isMyStudent = myStudentIds.has(r.student_id)
                return (
                  <div key={r.student_id} className={`flex items-center gap-3 px-5 py-3 ${isMyStudent ? 'bg-brand-lime/5' : 'hover:bg-surface-border/10'}`}>
                    <MedalIcon pos={r.rank_position} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-body font-medium text-text-primary truncate">{st?.full_name ?? '—'}</p>
                        {isMyStudent && (
                          <span className="text-[9px] text-brand-lime bg-brand-lime/10 border border-brand-lime/20 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                            meu aluno
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate">{st?.tenants?.business_name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs text-text-secondary">
                      <span className="flex items-center gap-0.5"><Dumbbell size={10} /> {r.workouts_completed}</span>
                      <span className="font-display font-bold text-text-primary">{r.total_points.toLocaleString('pt-BR')} pts</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Histórico de campeões */}
      {(history ?? []).length > 0 && (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
            <Star size={14} className="text-text-secondary" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Hall da Fama — Campeões Anteriores
            </p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(history ?? []).map((snap) => {
              type RankingEntry = { position: number; student_name: string; trainer_name: string; points: number }
              const top3 = ((snap.rankings as unknown) as RankingEntry[]).slice(0, 3)
              return (
                <div key={`${snap.year}-${snap.month}`} className="bg-background border border-surface-border rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                    {MONTH_NAMES[snap.month]} {snap.year}
                  </p>
                  {top3.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-base">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-body font-medium truncate">{entry.student_name}</p>
                        <p className="text-xs text-text-secondary truncate">{entry.trainer_name}</p>
                      </div>
                      <span className="text-xs font-bold text-brand-lime flex-shrink-0">{entry.points.toLocaleString('pt-BR')} pts</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Link para admin */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Zap size={12} />
        <span>Administradores podem gerenciar o ranking e fechar meses em</span>
        <a href="/admin/ranking" className="text-brand-lime hover:underline font-semibold">Admin → Ranking</a>
      </div>

    </div>
  )
}
