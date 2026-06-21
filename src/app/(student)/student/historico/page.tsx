import { getStudentWorkoutHistory } from '@/actions/workout-sessions'
import { History, Clock, Flame, CalendarCheck } from 'lucide-react'
import Link from 'next/link'

const INTENSITY_LABEL: Record<string, string> = {
  muito_leve:    'Muito Leve',
  leve:          'Leve',
  moderado:      'Moderado',
  intenso:       'Intenso',
  muito_intenso: 'Muito Intenso',
}

const INTENSITY_COLOR: Record<string, string> = {
  muito_leve:    'text-sky-400 bg-sky-400/10 border-sky-400/20',
  leve:          'text-green-400 bg-green-400/10 border-green-400/20',
  moderado:      'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  intenso:       'text-orange-400 bg-orange-400/10 border-orange-400/20',
  muito_intenso: 'text-red-400 bg-red-400/10 border-red-400/20',
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

export default async function HistoricoPage() {
  const sessions = await getStudentWorkoutHistory(50)

  const totalSessions   = sessions.length
  const totalMinutes    = sessions.reduce((acc, s) => acc + Math.floor((s.duration_seconds ?? 0) / 60), 0)
  const avgMinutes      = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

  return (
    <div className="p-5 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
          Histórico de Treinos
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Seus treinos realizados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-surface-border rounded-xl p-3 text-center">
          <p className="font-display font-bold text-2xl text-text-primary">{totalSessions}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Treinos</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-xl p-3 text-center">
          <p className="font-display font-bold text-2xl text-text-primary">{totalMinutes}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Min total</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-xl p-3 text-center">
          <p className="font-display font-bold text-2xl text-brand-lime">{avgMinutes}</p>
          <p className="text-[11px] text-text-secondary mt-0.5">Min médio</p>
        </div>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center space-y-3">
          <History size={32} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Nenhum treino ainda</p>
          <p className="text-sm text-text-secondary">Finalize seu primeiro treino para ver o histórico aqui.</p>
          <Link href="/student/treinos" className="inline-block text-sm text-brand-lime hover:underline">
            Ir para Treinos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const plan    = Array.isArray(session.workout_plans)    ? session.workout_plans[0]    : session.workout_plans
            const routine = Array.isArray(session.workout_routines) ? session.workout_routines[0] : session.workout_routines
            const date    = new Date(session.started_at)

            return (
              <div key={session.id} className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                      <CalendarCheck size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-body font-medium text-text-primary text-sm">
                        {(plan as { name?: string } | null)?.name ?? 'Treino'}
                      </p>
                      {routine && (
                        <p className="text-xs text-text-secondary">
                          {(routine as { name?: string }).name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-text-primary">
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 text-xs text-text-secondary bg-background border border-surface-border rounded-lg px-2.5 py-1">
                    <Clock size={11} />
                    {formatDuration(session.duration_seconds)}
                  </span>
                  {session.intensity && (
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${
                      INTENSITY_COLOR[session.intensity] ?? 'text-text-secondary bg-background border-surface-border'
                    }`}>
                      <Flame size={11} />
                      {INTENSITY_LABEL[session.intensity] ?? session.intensity}
                    </span>
                  )}
                </div>

                {session.notes && (
                  <p className="text-xs text-text-secondary italic border-l-2 border-surface-border pl-3">
                    {session.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
