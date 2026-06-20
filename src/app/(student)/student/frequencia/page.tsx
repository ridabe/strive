import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarCheck } from 'lucide-react'
import { FrequenciaClient } from './frequencia-client'

function currentStreak(sorted: string[], today: string): number {
  if (!sorted.length) return 0
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
  const last = sorted[sorted.length - 1]
  if (last !== today && last !== yesterday) return 0
  let streak = 1
  for (let i = sorted.length - 2; i >= 0; i--) {
    const diff = Math.round(
      (new Date(sorted[i + 1] + 'T12:00:00').getTime() -
       new Date(sorted[i]     + 'T12:00:00').getTime()) / 86_400_000,
    )
    if (diff === 1) streak++
    else break
  }
  return streak
}

export default async function FrequenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) redirect('/student')

  const { data: rows } = await supabase
    .from('attendance')
    .select('attended_at')
    .eq('student_id', student.id)
    .order('attended_at', { ascending: true })

  const today    = new Date().toISOString().split('T')[0]
  const thisMonth = today.slice(0, 7)

  // Deduplica por data
  const dateSet = new Set<string>()
  for (const r of rows ?? []) dateSet.add(r.attended_at.substring(0, 10))
  const sortedDates = [...dateSet].sort()

  const thisMonthCount   = sortedDates.filter(d => d.startsWith(thisMonth)).length
  const hasCheckedInToday = dateSet.has(today)
  const streak           = currentStreak(sortedDates, today)

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-lg">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center flex-shrink-0">
          <CalendarCheck size={18} className="text-orange-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Frequência
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Seu histórico de treinos e sequência atual.
          </p>
        </div>
      </div>

      <FrequenciaClient
        attendedDates={sortedDates}
        streak={streak}
        thisMonthCount={thisMonthCount}
        totalCount={sortedDates.length}
        hasCheckedInToday={hasCheckedInToday}
        today={today}
      />
    </div>
  )
}
