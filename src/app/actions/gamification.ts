'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type GamificationSettings = {
  id: string
  is_active: boolean
  pts_workout_completed: number
  pts_exercise_completed: number
  pts_workout_100_percent: number
  pts_load_increase: number
  pts_weekly_bonus: number
  pts_monthly_consistency: number
  pts_per_minute_active: number
  max_minutes_per_session: number
  max_pts_per_session: number
  min_session_duration_secs: number
  ranking_timezone: string
  updated_at: string | null
}

export type RankingEntry = {
  student_id: string
  student_name: string
  student_avatar: string | null
  trainer_name: string | null
  tenant_id: string | null
  rank_position: number
  total_points: number
  workouts_completed: number
  exercises_completed: number
  load_increases: number
  active_minutes: number
  weekly_bonuses: number
  consistency_bonuses: number
  month: number
  year: number
}

export type StudentRankingCard = {
  studentId: string
  month: number
  year: number
  myPoints: {
    total_points: number
    workouts_completed: number
    exercises_completed: number
    load_increases: number
    active_minutes: number
  } | null
  myRank: number | null
  totalStudents: number
  pointsToNext: number | null
  badges: Array<{ badge_type: string; earned_at: string }>
}

export type BadgeType =
  | 'foco_total'
  | 'evolucao_aco'
  | 'consistencia_maxima'
  | 'top_10'
  | 'campeao_mes'
  | 'disciplina'
  | 'treino_completo'

// ─── Leitura de configurações ─────────────────────────────────────────────────

export async function getGamificationSettings(): Promise<GamificationSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gamification_settings')
    .select('*')
    .single()
  return data
}

// ─── Atualizar configurações (apenas global_admin) ────────────────────────────

export async function updateGamificationSettings(
  updates: Partial<Omit<GamificationSettings, 'id' | 'updated_at'>>,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'global_admin') return { error: 'Sem permissão' }

  const { error } = await supabase
    .from('gamification_settings')
    .update({ ...updates, updated_at: new Date().toISOString(), updated_by: user.id })
    .not('id', 'is', null)

  if (error) return { error: error.message }

  revalidatePath('/admin/ranking')
  revalidatePath('/student/ranking')
  return { success: true }
}

// ─── Processar gamificação após treino concluído ──────────────────────────────
// Chamado internamente por finishWorkoutSession — nunca exposto diretamente ao cliente.

export async function processWorkoutGamification(sessionId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // 1. Verificar se gamificação está ativa
    const { data: settings } = await supabase
      .from('gamification_settings')
      .select('*')
      .single()
    if (!settings?.is_active) return

    // 2. Buscar sessão completa
    const { data: session } = await supabase
      .from('workout_sessions')
      .select(`
        id, student_id, tenant_id, started_at, finished_at, duration_seconds,
        workout_routine_id,
        workout_session_exercises (
          id, exercise_id, workout_item_id, sets_done, load_used
        )
      `)
      .eq('id', sessionId)
      .not('finished_at', 'is', null)
      .single()

    if (!session) return

    // 3. Anti-abuso: duração mínima
    const durationSecs = session.duration_seconds ?? 0
    if (durationSecs < settings.min_session_duration_secs) return

    const finishedAt = new Date(session.finished_at as string)
    const month = finishedAt.getMonth() + 1
    const year  = finishedAt.getFullYear()
    const studentId = session.student_id

    // 4. Verificar se já processou esta sessão (idempotência)
    const { count: alreadyProcessed } = await supabase
      .from('gamification_events')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('event_type', 'workout_completed')
    if ((alreadyProcessed ?? 0) > 0) return

    const exercises = session.workout_session_exercises ?? []
    const completedExercises = exercises.filter(
      (e: { sets_done: number | null; exercise_id: string | null }) =>
        e.sets_done && e.sets_done > 0,
    )

    // 5. Total planejado na rotina
    let totalPlanned = 0
    if (session.workout_routine_id) {
      const { count } = await supabase
        .from('workout_items')
        .select('id', { count: 'exact', head: true })
        .eq('routine_id', session.workout_routine_id)
      totalPlanned = count ?? 0
    }

    type EventInsert = {
      student_id: string
      session_id: string
      event_type: string
      points: number
      metadata: Record<string, unknown>
      event_month: number
      event_year: number
    }

    const events: EventInsert[] = []

    // ── Treino concluído (+50)
    events.push({
      student_id: studentId,
      session_id: sessionId,
      event_type: 'workout_completed',
      points: settings.pts_workout_completed,
      metadata: { duration_seconds: durationSecs },
      event_month: month,
      event_year: year,
    })

    // ── Exercícios concluídos (+5 cada)
    if (completedExercises.length > 0) {
      events.push({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'exercise_completed',
        points: completedExercises.length * settings.pts_exercise_completed,
        metadata: { count: completedExercises.length },
        event_month: month,
        event_year: year,
      })
    }

    // ── Treino 100% completo (+30)
    if (totalPlanned > 0 && completedExercises.length >= totalPlanned) {
      events.push({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'workout_100_percent',
        points: settings.pts_workout_100_percent,
        metadata: { planned: totalPlanned, completed: completedExercises.length },
        event_month: month,
        event_year: year,
      })
    }

    // ── Minutos ativos (cap anti-abuso)
    const activeMinutes = Math.min(
      Math.floor(durationSecs / 60),
      settings.max_minutes_per_session,
    )
    if (activeMinutes > 0 && settings.pts_per_minute_active > 0) {
      events.push({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'active_minutes',
        points: activeMinutes * settings.pts_per_minute_active,
        metadata: { minutes: activeMinutes },
        event_month: month,
        event_year: year,
      })
    }

    // ── Aumento de carga (+20 por exercício com evolução)
    let hasLoadIncrease = false
    for (const exercise of completedExercises) {
      const ex = exercise as { exercise_id: string | null; load_used: string | null }
      if (!ex.load_used || !ex.exercise_id) continue
      const currentLoad = parseFloat(ex.load_used.replace(/[^0-9.]/g, ''))
      if (isNaN(currentLoad) || currentLoad <= 0) continue

      const { data: prevRow } = await supabase
        .from('workout_session_exercises')
        .select('load_used, workout_sessions!inner(student_id, finished_at)')
        .eq('exercise_id', ex.exercise_id)
        .eq('workout_sessions.student_id', studentId)
        .not('workout_sessions.finished_at', 'is', null)
        .neq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!prevRow?.load_used) continue
      const prevLoad = parseFloat((prevRow.load_used as string).replace(/[^0-9.]/g, ''))
      if (isNaN(prevLoad) || prevLoad <= 0) continue

      if (currentLoad <= prevLoad) continue

      const ratio = (currentLoad - prevLoad) / prevLoad
      const isSuspicious = ratio > 2.0 // > 200% de aumento é suspeito

      events.push({
        student_id: studentId,
        session_id: sessionId,
        event_type: 'load_increased',
        points: isSuspicious ? 0 : settings.pts_load_increase,
        metadata: {
          exercise_id: ex.exercise_id,
          prev_load: prevLoad,
          new_load: currentLoad,
          increase_pct: Math.round(ratio * 100),
          suspicious: isSuspicious,
        },
        event_month: month,
        event_year: year,
        ...(isSuspicious ? { is_suspicious: true } : {}),
      })
      if (!isSuspicious) hasLoadIncrease = true
    }

    // ── Aplicar cap de pontos por sessão
    const totalBeforeCap = events.reduce((s, e) => s + e.points, 0)
    if (totalBeforeCap > settings.max_pts_per_session) {
      const ratio = settings.max_pts_per_session / totalBeforeCap
      for (const e of events) {
        e.points = Math.floor(e.points * ratio)
      }
    }

    // ── Inserir eventos
    if (events.length > 0) {
      await supabase.from('gamification_events').insert(events)
    }

    // ── Bônus semanal: 3+ treinos na semana (sem já ter recebido este bônus)
    const weekStart = getWeekStart(finishedAt)
    const weekEnd   = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const [{ count: weekCount }, { count: weekBonusGiven }] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .not('finished_at', 'is', null)
        .gte('started_at', weekStart.toISOString())
        .lt('started_at', weekEnd.toISOString()),
      supabase
        .from('gamification_events')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('event_type', 'weekly_bonus')
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString()),
    ])

    if ((weekCount ?? 0) >= 3 && (weekBonusGiven ?? 0) === 0) {
      await supabase.from('gamification_events').insert({
        student_id:  studentId,
        session_id:  sessionId,
        event_type:  'weekly_bonus',
        points:      settings.pts_weekly_bonus,
        metadata:    { workouts_this_week: weekCount },
        event_month: month,
        event_year:  year,
      })
      await awardBadge(supabase, studentId, 'foco_total', month, year)
    }

    // ── Bônus de consistência mensal: 4 semanas com 3+ treinos
    const { count: consistencyAlreadyGiven } = await supabase
      .from('gamification_events')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('event_type', 'monthly_consistency')
      .eq('event_month', month)
      .eq('event_year', year)

    if ((consistencyAlreadyGiven ?? 0) === 0) {
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd   = new Date(year, month, 0)
      const isConsistent = await checkMonthlyConsistency(supabase, studentId, monthStart, monthEnd)
      if (isConsistent) {
        await supabase.from('gamification_events').insert({
          student_id:  studentId,
          session_id:  sessionId,
          event_type:  'monthly_consistency',
          points:      settings.pts_monthly_consistency,
          metadata:    { month, year },
          event_month: month,
          event_year:  year,
        })
        await awardBadge(supabase, studentId, 'consistencia_maxima', month, year)
        await awardBadge(supabase, studentId, 'disciplina', month, year)
      }
    }

    // ── Atualizar aggregate de pontos mensais
    await updateMonthlyPoints(supabase, studentId, month, year, session.tenant_id as string | null)

    // ── Conceder badges adicionais
    if (totalPlanned > 0 && completedExercises.length >= totalPlanned) {
      await awardBadge(supabase, studentId, 'treino_completo', month, year)
    }
    if (hasLoadIncrease) {
      await awardBadge(supabase, studentId, 'evolucao_aco', month, year)
    }

    // ── Verificar Top 10
    const { data: topRows } = await supabase
      .from('monthly_points')
      .select('student_id, total_points')
      .eq('month', month)
      .eq('year', year)
      .order('total_points', { ascending: false })
      .limit(10)

    const myEntry = topRows?.find((r: { student_id: string }) => r.student_id === studentId)
    const isTop10 = !!myEntry
    if (isTop10) {
      await awardBadge(supabase, studentId, 'top_10', month, year)
    }

    revalidatePath('/student/ranking')
    revalidatePath('/admin/ranking')
  } catch {
    // Erros de gamificação não devem quebrar o fluxo do treino
  }
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

async function checkMonthlyConsistency(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<boolean> {
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('started_at')
    .eq('student_id', studentId)
    .not('finished_at', 'is', null)
    .gte('started_at', monthStart.toISOString())
    .lte('started_at', monthEnd.toISOString())

  if (!sessions || sessions.length < 12) return false

  let qualifyingWeeks = 0
  const cursor = new Date(monthStart)
  while (cursor <= monthEnd) {
    const weekEnd = new Date(cursor)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const count = sessions.filter((s: { started_at: string }) => {
      const d = new Date(s.started_at)
      return d >= cursor && d < weekEnd
    }).length
    if (count >= 3) qualifyingWeeks++
    cursor.setDate(cursor.getDate() + 7)
    if (qualifyingWeeks >= 4) return true
  }
  return qualifyingWeeks >= 4
}

async function awardBadge(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  badgeType: BadgeType,
  month: number,
  year: number,
) {
  const { count } = await supabase
    .from('student_badges')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('badge_type', badgeType)
    .eq('month', month)
    .eq('year', year)

  if ((count ?? 0) === 0) {
    await supabase.from('student_badges').insert({
      student_id: studentId,
      badge_type: badgeType,
      month,
      year,
    })
  }
}

async function updateMonthlyPoints(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  month: number,
  year: number,
  tenantId?: string | null,
) {
  const { data: events } = await supabase
    .from('gamification_events')
    .select('event_type, points, metadata')
    .eq('student_id', studentId)
    .eq('event_month', month)
    .eq('event_year', year)
    .eq('is_suspicious', false)

  if (!events) return

  type EvRow = { event_type: string; points: number; metadata: Record<string, unknown> }
  const rows = events as EvRow[]

  const totalPoints        = rows.reduce((s, e) => s + e.points, 0)
  const workoutsCompleted  = rows.filter(e => e.event_type === 'workout_completed').length
  const exercisesCompleted = rows
    .filter(e => e.event_type === 'exercise_completed')
    .reduce((s, e) => s + ((e.metadata?.count as number) ?? 1), 0)
  const loadIncreases     = rows.filter(e => e.event_type === 'load_increased').length
  const activeMinutes     = rows
    .filter(e => e.event_type === 'active_minutes')
    .reduce((s, e) => s + ((e.metadata?.minutes as number) ?? 0), 0)
  const weeklyBonuses     = rows.filter(e => e.event_type === 'weekly_bonus').length
  const consistencyBonuses = rows.filter(e => e.event_type === 'monthly_consistency').length

  await supabase.from('monthly_points').upsert(
    {
      student_id:          studentId,
      month,
      year,
      total_points:        totalPoints,
      workouts_completed:  workoutsCompleted,
      exercises_completed: exercisesCompleted,
      load_increases:      loadIncreases,
      active_minutes:      activeMinutes,
      weekly_bonuses:      weeklyBonuses,
      consistency_bonuses: consistencyBonuses,
      last_calculated_at:  new Date().toISOString(),
      ...(tenantId ? { tenant_id: tenantId } : {}),
    },
    { onConflict: 'student_id,month,year' },
  )
}

// ─── Ranking atual ────────────────────────────────────────────────────────────

export async function getCurrentRanking(limit = 50): Promise<RankingEntry[]> {
  const supabase = await createClient()
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const { data } = await supabase
    .from('monthly_points')
    .select(`
      student_id, month, year, total_points, workouts_completed,
      exercises_completed, load_increases, active_minutes,
      weekly_bonuses, consistency_bonuses,
      students (
        id, full_name, avatar_url,
        tenants ( id, business_name )
      )
    `)
    .eq('month', month)
    .eq('year', year)
    .order('total_points', { ascending: false })
    .order('workouts_completed', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((row, idx) => {
    const s = (row.students as unknown) as {
      id: string
      full_name: string
      avatar_url: string | null
      tenants: { id: string; business_name: string } | null
    } | null
    return {
      student_id:          row.student_id,
      student_name:        s?.full_name ?? 'Aluno',
      student_avatar:      s?.avatar_url ?? null,
      trainer_name:        s?.tenants?.business_name ?? null,
      tenant_id:           s?.tenants?.id ?? null,
      rank_position:       idx + 1,
      total_points:        row.total_points,
      workouts_completed:  row.workouts_completed,
      exercises_completed: row.exercises_completed,
      load_increases:      row.load_increases,
      active_minutes:      row.active_minutes,
      weekly_bonuses:      row.weekly_bonuses,
      consistency_bonuses: row.consistency_bonuses,
      month:               row.month,
      year:                row.year,
    }
  })
}

// ─── Card do aluno no ranking ─────────────────────────────────────────────────

export async function getMyRankingCard(): Promise<StudentRankingCard | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!student) return null

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const [{ data: myPoints }, { count: totalStudents }, { data: badges }] = await Promise.all([
    supabase
      .from('monthly_points')
      .select('total_points, workouts_completed, exercises_completed, load_increases, active_minutes')
      .eq('student_id', student.id)
      .eq('month', month)
      .eq('year', year)
      .single(),
    supabase
      .from('monthly_points')
      .select('id', { count: 'exact', head: true })
      .eq('month', month)
      .eq('year', year),
    supabase
      .from('student_badges')
      .select('badge_type, earned_at')
      .eq('student_id', student.id)
      .eq('month', month)
      .eq('year', year),
  ])

  // Calcular posição
  let myRank: number | null = null
  let pointsToNext: number | null = null

  if (myPoints) {
    const { count: aboveMe } = await supabase
      .from('monthly_points')
      .select('id', { count: 'exact', head: true })
      .eq('month', month)
      .eq('year', year)
      .gt('total_points', myPoints.total_points)
    myRank = (aboveMe ?? 0) + 1

    if (myRank > 1) {
      const { data: nextUp } = await supabase
        .from('monthly_points')
        .select('total_points')
        .eq('month', month)
        .eq('year', year)
        .order('total_points', { ascending: false })
        .range(myRank - 2, myRank - 2)
        .single()
      if (nextUp) {
        pointsToNext = nextUp.total_points - myPoints.total_points + 1
      }
    }
  }

  return {
    studentId:     student.id,
    month,
    year,
    myPoints:      myPoints ?? null,
    myRank,
    totalStudents: totalStudents ?? 0,
    pointsToNext,
    badges:        (badges ?? []) as Array<{ badge_type: string; earned_at: string }>,
  }
}

// ─── Histórico de campeões ────────────────────────────────────────────────────

export async function getRankingHistory(limit = 6) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('monthly_ranking_snapshots')
    .select('id, month, year, closed_at, champion_id, rankings')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ─── Fechar ranking do mês (admin) ───────────────────────────────────────────

export async function closeMonthlyRanking(month: number, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'global_admin') return { error: 'Sem permissão' }

  const { data: ranking } = await supabase
    .from('monthly_points')
    .select(`
      total_points, workouts_completed,
      students ( id, full_name, tenants ( business_name ) )
    `)
    .eq('month', month)
    .eq('year', year)
    .order('total_points', { ascending: false })
    .order('workouts_completed', { ascending: false })

  if (!ranking || ranking.length === 0) return { error: 'Nenhum dado para fechar' }

  type SnapRow = {
    total_points: number
    workouts_completed: number
    students: {
      id: string
      full_name: string
      tenants: { business_name: string } | null
    } | null
  }

  const rows = (ranking as unknown) as SnapRow[]
  const rankings = rows.map((r, idx) => ({
    position:           idx + 1,
    student_id:         r.students?.id,
    student_name:       r.students?.full_name,
    trainer_name:       r.students?.tenants?.business_name ?? null,
    points:             r.total_points,
    workouts_completed: r.workouts_completed,
  }))

  const champion = rows[0]
  const championId = champion?.students?.id ?? null

  const { error: snapError } = await supabase
    .from('monthly_ranking_snapshots')
    .upsert(
      {
        month,
        year,
        closed_at:   new Date().toISOString(),
        closed_by:   user.id,
        rankings,
        champion_id: championId,
      },
      { onConflict: 'month,year' },
    )

  if (snapError) return { error: snapError.message }

  // Badge de campeão do mês
  if (championId) {
    const { count } = await supabase
      .from('student_badges')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', championId)
      .eq('badge_type', 'campeao_mes')
      .eq('month', month)
      .eq('year', year)
    if ((count ?? 0) === 0) {
      await supabase.from('student_badges').insert({
        student_id: championId,
        badge_type: 'campeao_mes',
        month,
        year,
      })
    }
  }

  revalidatePath('/admin/ranking')
  revalidatePath('/student/ranking')
  return { success: true, positions: rankings.length }
}

// ─── Admin: ranking filtrado ──────────────────────────────────────────────────

export async function getAdminRanking(month: number, year: number, tenantId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'global_admin') return []

  const { data } = await supabase
    .from('monthly_points')
    .select(`
      student_id, total_points, workouts_completed, exercises_completed,
      load_increases, active_minutes, weekly_bonuses, consistency_bonuses,
      students (
        id, full_name, avatar_url,
        tenants ( id, business_name )
      )
    `)
    .eq('month', month)
    .eq('year', year)
    .order('total_points', { ascending: false })
    .order('workouts_completed', { ascending: false })

  if (!data) return []

  type AdminRow = {
    student_id: string
    total_points: number
    workouts_completed: number
    exercises_completed: number
    load_increases: number
    active_minutes: number
    weekly_bonuses: number
    consistency_bonuses: number
    students: {
      id: string
      full_name: string
      avatar_url: string | null
      tenants: { id: string; business_name: string } | null
    } | null
  }

  let result = (data as unknown) as AdminRow[]

  if (tenantId) {
    result = result.filter(r => r.students?.tenants?.id === tenantId)
  }

  return result.map((r, idx) => ({
    rank_position:       idx + 1,
    student_id:          r.student_id,
    student_name:        r.students?.full_name ?? 'Aluno',
    student_avatar:      r.students?.avatar_url ?? null,
    trainer_name:        r.students?.tenants?.business_name ?? null,
    tenant_id:           r.students?.tenants?.id ?? null,
    total_points:        r.total_points,
    workouts_completed:  r.workouts_completed,
    exercises_completed: r.exercises_completed,
    load_increases:      r.load_increases,
    active_minutes:      r.active_minutes,
    weekly_bonuses:      r.weekly_bonuses,
    consistency_bonuses: r.consistency_bonuses,
  }))
}

// ─── Admin: recalcular pontos de um aluno (correção manual) ──────────────────

export async function recalculateStudentPoints(studentId: string, month: number, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'global_admin') return { error: 'Sem permissão' }

  await updateMonthlyPoints(supabase, studentId, month, year)
  revalidatePath('/admin/ranking')
  return { success: true }
}

// ─── Admin: listar tenants para filtro ───────────────────────────────────────

export async function getTenantsForFilter() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'global_admin') return []

  const { data } = await supabase
    .from('tenants')
    .select('id, business_name')
    .order('business_name')
  return data ?? []
}
