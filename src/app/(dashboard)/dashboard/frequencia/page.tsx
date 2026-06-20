import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { joinOne } from '@/lib/supabase/join'
import { CalendarCheck, Flame, ArrowRight, Users } from 'lucide-react'

// ─── Streak util ──────────────────────────────────────────────────────────────
function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) /
      86_400_000,
  )
}

function currentStreak(sorted: string[]): number {
  if (!sorted.length) return 0
  const today = new Date().toISOString().split('T')[0]
  const last  = sorted[sorted.length - 1]
  if (daysBetween(last, today) > 1) return 0
  let streak = 1
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (daysBetween(sorted[i], sorted[i + 1]) === 1) streak++
    else break
  }
  return streak
}

export default async function FrequenciaPage() {
  const supabase = await createClient()

  // Todos os alunos ativos
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, status')
    .eq('status', 'active')
    .order('full_name')

  // Todos os registros de frequência
  const { data: allRows } = await supabase
    .from('attendance')
    .select('id, attended_at, student_id, students ( id, full_name )')
    .order('attended_at', { ascending: true })

  const thisMonth = new Date().toISOString().slice(0, 7)
  const lastWeekStart = (() => {
    const d = new Date(); d.setDate(d.getDate() - 6)
    return d.toISOString().split('T')[0]
  })()
  const today = new Date().toISOString().split('T')[0]

  // Agrupa datas por student_id (deduplicadas)
  const byStudent = new Map<string, Set<string>>()
  for (const row of allRows ?? []) {
    const date = row.attended_at.substring(0, 10)
    if (!byStudent.has(row.student_id)) byStudent.set(row.student_id, new Set())
    byStudent.get(row.student_id)!.add(date)
  }

  // Stats globais
  const totalCheckIns   = [...byStudent.values()].reduce((s, d) => s + d.size, 0)
  const thisMonthTotal  = [...byStudent.values()].reduce(
    (s, dates) => s + [...dates].filter(d => d.startsWith(thisMonth)).length, 0
  )
  const activeThisWeek  = [...byStudent.values()]
    .filter(dates => [...dates].some(d => d >= lastWeekStart && d <= today))
    .length

  // Por aluno
  const studentStats = (students ?? []).map(s => {
    const dates  = byStudent.has(s.id) ? [...byStudent.get(s.id)!].sort() : []
    const streak = currentStreak(dates)
    const month  = dates.filter(d => d.startsWith(thisMonth)).length
    const last   = dates[dates.length - 1] ?? null
    return { ...s, total: dates.length, month, streak, last }
  }).sort((a, b) => b.month - a.month || b.total - a.total)

  const mostActiveThisMonth = studentStats[0]

  // Últimas 10 sessões (feed global)
  const recentFeed = (allRows ?? [])
    .slice()
    .reverse()
    .slice(0, 10)
    .map(r => ({
      id:      r.id,
      date:    r.attended_at.substring(0, 10),
      student: joinOne<{ id: string; full_name: string }>(r.students),
    }))

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Frequência
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Calendário de treinos, streaks e assiduidade dos alunos
        </p>
      </div>

      {/* Stats globais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Check-ins este mês', value: thisMonthTotal,     color: 'text-brand-lime'     },
          { label: 'Alunos esta semana', value: activeThisWeek,     color: 'text-purple-400'     },
          { label: 'Total histórico',    value: totalCheckIns,      color: 'text-text-primary'   },
          {
            label: 'Mais ativo (mês)',
            value: mostActiveThisMonth?.month > 0 ? `${mostActiveThisMonth.month}×` : '—',
            color: 'text-yellow-400',
          },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-surface-border rounded-xl p-4">
            <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tabela de alunos */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-text-secondary" />
            <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
              Alunos ativos — {thisMonth.slice(5, 7)}/{thisMonth.slice(0, 4)}
            </h2>
          </div>

          {studentStats.length === 0 ? (
            <div className="bg-surface border border-surface-border rounded-xl p-8 text-center">
              <p className="text-sm text-text-secondary">Nenhum aluno ativo encontrado.</p>
            </div>
          ) : (
            <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Aluno</th>
                    <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium">Mês</th>
                    <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Total</th>
                    <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Streak</th>
                    <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Última sessão</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {studentStats.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-border/10 group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            s.month > 0 ? 'bg-brand-lime' : 'bg-surface-border'
                          }`} />
                          <span className="text-text-primary font-medium">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`font-display font-bold text-sm ${
                          s.month >= 8 ? 'text-status-success' :
                          s.month >= 4 ? 'text-brand-lime'     :
                          s.month > 0  ? 'text-status-warning' :
                          'text-text-secondary/40'
                        }`}>
                          {s.month > 0 ? s.month : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-text-secondary hidden sm:table-cell">
                        {s.total}
                      </td>
                      <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                        {s.streak > 0 ? (
                          <span className="flex items-center gap-1 justify-end text-orange-400">
                            <Flame size={12} />
                            {s.streak}d
                          </span>
                        ) : (
                          <span className="text-text-secondary/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right text-text-secondary text-xs hidden md:table-cell">
                        {s.last
                          ? new Date(s.last + 'T12:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit', month: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/dashboard/alunos/${s.id}/frequencia`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowRight size={14} className="text-text-secondary hover:text-brand-lime transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Feed de sessões recentes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarCheck size={14} className="text-text-secondary" />
            <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
              Sessões recentes
            </h2>
          </div>

          {recentFeed.length === 0 ? (
            <div className="bg-surface border border-surface-border rounded-xl p-6 text-center">
              <p className="text-sm text-text-secondary">Nenhuma sessão registrada.</p>
            </div>
          ) : (
            <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
              {recentFeed.map((r, i) => (
                <div
                  key={r.id}
                  className={`px-4 py-3 text-sm ${i !== 0 ? 'border-t border-surface-border' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-lime flex-shrink-0" />
                    <span className="text-text-primary font-medium truncate">
                      {r.student?.full_name ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 pl-3.5">
                    {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: 'short',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
