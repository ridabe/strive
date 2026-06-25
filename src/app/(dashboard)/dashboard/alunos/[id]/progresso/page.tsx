'use server'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProgressoAlunoClient } from './progresso-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AlunoProgressoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('full_name, status')
    .eq('id', id)
    .single()

  if (!student) notFound()

  // Registros de progresso (peso + fotos)
  const { data: progressEntries } = await supabase
    .from('student_progress')
    .select('id, recorded_at, weight, notes, photo_urls')
    .eq('student_id', id)
    .order('recorded_at', { ascending: true })

  // Sessões de treino concluídas
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id, started_at, finished_at, duration_seconds,
      workout_routines ( name )
    `)
    .eq('student_id', id)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: true })
    .limit(200)

  const sessionIds = (sessions ?? []).map((s) => s.id)

  // Exercícios executados com carga (apenas se houver sessões)
  const sessionExercises =
    sessionIds.length > 0
      ? await supabase
          .from('workout_session_exercises')
          .select('session_id, exercise_id, load_used, reps_done, sets_done, completed, exercises ( name )')
          .in('session_id', sessionIds)
          .eq('completed', true)
          .not('load_used', 'is', null)
          .gt('load_used', 0)
      : { data: [] }

  // Pontos do mês atual (gamificação)
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const { data: monthlyPoints } = await supabase
    .from('monthly_points')
    .select('total_points, workouts_completed, exercises_completed, load_increases, active_minutes')
    .eq('student_id', id)
    .eq('month', month)
    .eq('year', year)
    .single()

  const { data: badges } = await supabase
    .from('student_badges')
    .select('badge_type, earned_at, month, year')
    .eq('student_id', id)
    .order('earned_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/alunos" className="hover:text-text-primary transition-colors">Alunos</Link>
        <span>/</span>
        <Link href={`/dashboard/alunos/${id}`} className="hover:text-text-primary transition-colors">
          {student.full_name}
        </Link>
        <span>/</span>
        <span className="text-text-primary">Progresso</span>
      </div>

      <ProgressoAlunoClient
        studentName={student.full_name}
        progressEntries={(progressEntries ?? []) as {
          id: string; recorded_at: string; weight: number | null; notes: string | null; photo_urls: string[]
        }[]}
        sessions={(sessions ?? []) as unknown as {
          id: string; started_at: string; finished_at: string | null; duration_seconds: number | null;
          workout_routines: { name: string } | null
        }[]}
        sessionExercises={(sessionExercises.data ?? []) as unknown as {
          session_id: string; exercise_id: string; load_used: number | null;
          reps_done: number | null; sets_done: number | null; completed: boolean;
          exercises: { name: string } | null
        }[]}
        monthlyPoints={monthlyPoints ?? null}
        badges={(badges ?? []) as { badge_type: string; earned_at: string; month: number; year: number }[]}
        studentId={id}
      />
    </div>
  )
}
