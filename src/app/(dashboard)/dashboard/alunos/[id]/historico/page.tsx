import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getStudentSessionsForPersonal } from '@/actions/workout-sessions'
import { ArrowLeft, CalendarCheck, Clock, Flame, ChevronDown, MessageSquare, Dumbbell } from 'lucide-react'

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

type SessionExercise = {
  id: string
  sets_done: number | null
  reps_done: string | null
  load_used: string | null
  feedback:  string | null
  exercises: { name: string; muscle_group: string } | null
}

type Session = {
  id:                       string
  started_at:               string
  duration_seconds:         number | null
  intensity:                string | null
  notes:                    string | null
  workout_plans:            { name: string } | null
  workout_routines:         { name: string } | null
  workout_session_exercises: SessionExercise[]
}

type Props = { params: Promise<{ id: string }> }

export default async function StudentHistoricoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('full_name')
    .eq('id', id)
    .single()

  if (!student) notFound()

  const raw      = await getStudentSessionsForPersonal(id, 30)
  const sessions = raw.map((s) => {
    const plans    = Array.isArray(s.workout_plans)    ? (s.workout_plans as { name: string }[])[0]    ?? null : s.workout_plans as { name: string } | null
    const routines = Array.isArray(s.workout_routines) ? (s.workout_routines as { name: string }[])[0] ?? null : s.workout_routines as { name: string } | null
    const exItems  = (s.workout_session_exercises ?? []) as unknown as SessionExercise[]
    return {
      ...s,
      workout_plans:             plans,
      workout_routines:          routines,
      workout_session_exercises: exItems,
    } as Session
  })

  const totalSessions = sessions.length
  const totalMinutes  = sessions.reduce((acc, s) => acc + Math.floor((s.duration_seconds ?? 0) / 60), 0)

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">
      <Link
        href={`/dashboard/alunos/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {student.full_name}
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Histórico de Treinos
        </h1>
        <p className="text-sm text-text-secondary mt-1">{student.full_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-surface-border rounded-xl p-4 text-center">
          <p className="font-display font-bold text-3xl text-text-primary">{totalSessions}</p>
          <p className="text-xs text-text-secondary mt-1">Sessões realizadas</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-xl p-4 text-center">
          <p className="font-display font-bold text-3xl text-brand-lime">{totalMinutes}</p>
          <p className="text-xs text-text-secondary mt-1">Minutos totais</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center space-y-3">
          <CalendarCheck size={32} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Nenhuma sessão ainda</p>
          <p className="text-sm text-text-secondary">O aluno ainda não completou nenhum treino.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const date = new Date(session.started_at)

            return (
              <details key={session.id} className="bg-surface border border-surface-border rounded-2xl group">
                <summary className="flex items-center gap-4 p-4 cursor-pointer list-none">
                  <div className="w-9 h-9 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                    <CalendarCheck size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {session.workout_plans?.name ?? 'Treino'}
                    </p>
                    {session.workout_routines?.name && (
                      <p className="text-xs text-text-secondary">{session.workout_routines.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium text-text-primary">
                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronDown size={14} className="text-text-secondary group-open:rotate-180 transition-transform" />
                  </div>
                </summary>

                <div className="px-4 pb-4 border-t border-surface-border pt-4 space-y-4">
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
                    <span className="text-[11px] text-text-secondary self-center sm:hidden">
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-text-secondary italic border-l-2 border-surface-border pl-3">
                      {session.notes}
                    </p>
                  )}

                  {/* Per-exercise data */}
                  {session.workout_session_exercises.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Exercícios realizados</p>
                      {session.workout_session_exercises.map((ex) => {
                        const exercise = Array.isArray(ex.exercises)
                          ? (ex.exercises as unknown as { name: string; muscle_group: string }[])[0] ?? null
                          : ex.exercises

                        return (
                          <div key={ex.id} className="bg-background border border-surface-border rounded-xl px-4 py-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Dumbbell size={13} className="text-brand-lime flex-shrink-0" />
                              <p className="text-sm font-medium text-text-primary">{exercise?.name ?? '—'}</p>
                              {exercise?.muscle_group && (
                                <span className="text-[10px] text-text-secondary bg-surface border border-surface-border px-1.5 py-0.5 rounded-md">
                                  {exercise.muscle_group}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                              {ex.sets_done != null && <span>{ex.sets_done} séries</span>}
                              {ex.reps_done        && <span>{ex.reps_done} reps</span>}
                              {ex.load_used        && <span className="font-semibold text-text-primary">{ex.load_used}</span>}
                            </div>
                            {ex.feedback && (
                              <div className="flex items-start gap-1.5">
                                <MessageSquare size={11} className="text-text-secondary/60 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-text-secondary italic">{ex.feedback}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
