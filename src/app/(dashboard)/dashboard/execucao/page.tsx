import { createClient } from '@/lib/supabase/server'
import { requireAcademiaModuleAccess } from '@/lib/supabase/module-access'
import Link from 'next/link'
import { Play, Clock, Dumbbell, TrendingUp, CheckCircle2, Users } from 'lucide-react'
import { joinOne } from '@/lib/supabase/join'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(secs: number | null) {
  if (!secs) return '—'
  const m = Math.round(secs / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function intensityLabel(v: string | null) {
  const map: Record<string, string> = {
    muito_leve: 'Muito leve',
    leve: 'Leve',
    moderado: 'Moderado',
    intenso: 'Intenso',
    muito_intenso: 'Muito intenso',
  }
  return v ? (map[v] ?? v) : null
}

function intensityColor(v: string | null) {
  const map: Record<string, string> = {
    muito_leve: 'text-text-secondary',
    leve: 'text-blue-400',
    moderado: 'text-brand-lime',
    intenso: 'text-orange-400',
    muito_intenso: 'text-status-error',
  }
  return v ? (map[v] ?? 'text-text-secondary') : 'text-text-secondary'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExecucaoPage() {
  await requireAcademiaModuleAccess('execucao-do-treino')
  const supabase = await createClient()

  // Identifica o tenant do personal logado
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile }  = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user!.id)
    .single()

  const tenantId = profile?.tenant_id

  // Sessões concluídas dos últimos 90 dias
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id, started_at, finished_at, duration_seconds, intensity, notes,
      students ( id, full_name ),
      workout_routines ( name )
    `)
    .eq('tenant_id', tenantId!)
    .not('finished_at', 'is', null)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false })
    .limit(200)

  // Contagem de exercícios por sessão
  const sessionIds = (sessions ?? []).map((s) => s.id)
  const exerciseCounts: Record<string, { total: number; load_increases: number }> = {}

  if (sessionIds.length > 0) {
    const { data: exRows } = await supabase
      .from('workout_session_exercises')
      .select('session_id, completed')
      .in('session_id', sessionIds)

    ;(exRows ?? []).forEach((r) => {
      if (!exerciseCounts[r.session_id]) exerciseCounts[r.session_id] = { total: 0, load_increases: 0 }
      if (r.completed) exerciseCounts[r.session_id].total++
    })
  }

  // Métricas gerais (mês corrente)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const sessionsMes = (sessions ?? []).filter((s) => s.started_at >= monthStart)
  const totalMes    = sessionsMes.length

  const uniqueStudentsMes = new Set(
    sessionsMes.map((s) => joinOne<{ id: string; full_name: string }>(s.students)?.id).filter(Boolean)
  ).size

  const avgDurMes = sessionsMes.length > 0
    ? Math.round(sessionsMes.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0) / sessionsMes.length / 60)
    : 0

  const totalExMes = sessionsMes.reduce((acc, s) => acc + (exerciseCounts[s.id]?.total ?? 0), 0)

  // Alunos mais ativos do mês
  const studentTally: Record<string, { name: string; count: number }> = {}
  sessionsMes.forEach((s) => {
    const st = joinOne<{ id: string; full_name: string }>(s.students)
    if (!st) return
    if (!studentTally[st.id]) studentTally[st.id] = { name: st.full_name, count: 0 }
    studentTally[st.id].count++
  })
  const topStudents = Object.entries(studentTally)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
          <Play size={20} className="text-brand-lime" />
          Execução de Treinos
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Sessões concluídas pelos alunos — últimos 90 dias
        </p>
      </div>

      {/* KPIs do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sessões no mês',      value: totalMes,     icon: Play,       color: 'text-brand-lime  bg-brand-lime/10  border-brand-lime/20'   },
          { label: 'Alunos ativos',       value: uniqueStudentsMes, icon: Users, color: 'text-blue-400   bg-blue-400/10   border-blue-400/20'    },
          { label: 'Duração média',       value: avgDurMes > 0 ? `${avgDurMes}min` : '—', icon: Clock, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
          { label: 'Exercícios feitos',   value: totalExMes,   icon: Dumbbell,   color: 'text-orange-400 bg-orange-400/10 border-orange-400/20'  },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Sessões recentes */}
        <div className="lg:col-span-2 bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
            <Play size={14} className="text-text-secondary" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
              Sessões Recentes
            </p>
          </div>

          {(sessions ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-secondary text-sm gap-3">
              <Dumbbell size={32} className="opacity-20" />
              <p>Nenhuma sessão registrada nos últimos 90 dias.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {(sessions ?? []).slice(0, 50).map((s) => {
                const student = joinOne<{ id: string; full_name: string }>(s.students)
                const routine = joinOne<{ name: string }>(s.workout_routines)
                const exCount = exerciseCounts[s.id]?.total ?? 0
                const intLabel = intensityLabel(s.intensity as string | null)
                const intColor = intensityColor(s.intensity as string | null)

                return (
                  <div key={s.id} className="flex flex-col items-start gap-3 px-4 sm:px-5 py-3.5 hover:bg-surface-border/10 group sm:flex-row sm:items-center">
                    <div className="w-8 h-8 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-brand-lime" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-body font-medium text-text-primary truncate">
                          {student?.full_name ?? '—'}
                        </p>
                        {intLabel && (
                          <span className={`text-[10px] font-semibold flex-shrink-0 ${intColor}`}>
                            · {intLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        {routine?.name ?? 'Treino livre'} · {fmtDate(s.started_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-text-secondary">
                      {exCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Dumbbell size={11} />
                          {exCount}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {fmtDuration(s.duration_seconds)}
                      </span>
                    </div>

                    {student && (
                      <Link
                        href={`/dashboard/alunos/${student.id}/progresso`}
                        className="text-[11px] text-text-secondary hover:text-brand-lime transition-colors sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0"
                      >
                        Ver progresso →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alunos mais ativos */}
        <div className="space-y-4">
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border">
              <TrendingUp size={14} className="text-text-secondary" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                Mais Ativos — Este Mês
              </p>
            </div>

            {topStudents.length === 0 ? (
              <div className="px-5 py-8 text-sm text-text-secondary text-center">
                Sem dados ainda.
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {topStudents.map(([sid, data], i) => (
                  <div key={sid} className="flex items-center gap-3 px-5 py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                      i === 1 ? 'bg-gray-300/20 text-gray-300' :
                      i === 2 ? 'bg-orange-700/20 text-orange-400' :
                      'bg-surface-border/30 text-text-secondary'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-body font-medium truncate">{data.name}</p>
                    </div>
                    <span className="text-xs font-bold text-brand-lime flex-shrink-0">{data.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dica */}
          <div className="bg-brand-lime/5 border border-brand-lime/15 rounded-xl p-4">
            <p className="text-xs font-semibold text-brand-lime mb-1">O que é esta tela?</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Mostra todas as sessões de treino concluídas pelos alunos no app mobile.
              Aqui você acompanha frequência, intensidade e duração em tempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
