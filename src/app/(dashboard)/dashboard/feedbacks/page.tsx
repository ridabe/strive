import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { Star, MessageSquare, Users, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { AddFeedbackButton } from './feedback-form'

interface SearchParams {
  rating?: string
  student?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-border'}
        />
      ))}
    </div>
  )
}

const RATING_LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']

export default async function FeedbacksPage({ searchParams }: Props) {
  const { rating: ratingFilter, student: studentFilter } = await searchParams
  const supabase = await createClient()

  // Todos os alunos (para o formulário e filtro)
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('status', 'active')
    .order('full_name')

  // Planos de treino ativos (para o formulário)
  const { data: workoutPlans } = await supabase
    .from('workout_plans')
    .select('id, name, student_id')
    .eq('status', 'active')
    .order('name')

  // Query base de feedbacks
  let query = supabase
    .from('workout_feedbacks')
    .select('id, rating, comment, created_at, student_id, workout_plan_id, students ( id, full_name ), workout_plans ( id, name )')
    .order('created_at', { ascending: false })
    .limit(100)

  if (ratingFilter) query = query.eq('rating', Number(ratingFilter))
  if (studentFilter) query = query.eq('student_id', studentFilter)

  const { data: feedbacks } = await query

  // Stats
  const total       = feedbacks?.length ?? 0
  const avgRating   = total
    ? feedbacks!.reduce((s, f) => s + f.rating, 0) / total
    : 0
  const uniqueStudents = new Set(feedbacks?.map(f => f.student_id) ?? []).size
  const thisWeekStart  = (() => {
    const d = new Date(); d.setDate(d.getDate() - 6)
    return d.toISOString()
  })()
  const thisWeek = feedbacks?.filter(f => f.created_at >= thisWeekStart).length ?? 0

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count:  feedbacks?.filter(f => f.rating === r).length ?? 0,
  }))

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Feedbacks
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Avaliações dos alunos sobre os treinos
          </p>
        </div>
        <AddFeedbackButton
          students={students ?? []}
          workoutPlans={workoutPlans ?? []}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total de feedbacks',
            value: total,
            color: 'text-text-primary',
            iconColor: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
            Icon: MessageSquare,
          },
          {
            label: 'Média de nota',
            value: total ? `${avgRating.toFixed(1)} ★` : '—',
            color: 'text-yellow-400',
            iconColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
            Icon: Star,
          },
          {
            label: 'Alunos avaliaram',
            value: uniqueStudents,
            color: 'text-purple-400',
            iconColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
            Icon: Users,
          },
          {
            label: 'Esta semana',
            value: thisWeek,
            color: 'text-brand-lime',
            iconColor: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
            Icon: TrendingUp,
          },
        ].map(({ label, value, color, iconColor, Icon }) => (
          <div key={label} className="bg-surface border border-surface-border rounded-xl p-4 space-y-2">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${iconColor}`}>
              <Icon size={15} />
            </div>
            <div>
              <p className={`font-display font-bold text-xl leading-tight ${color}`}>{value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lista de feedbacks */}
        <div className="lg:col-span-2 space-y-3">

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mr-1">
              Filtrar:
            </span>
            {/* Por nota */}
            {[0, 5, 4, 3, 2, 1].map(r => (
              <Link
                key={r}
                href={r === 0
                  ? (studentFilter ? `?student=${studentFilter}` : '/dashboard/feedbacks')
                  : `?rating=${r}${studentFilter ? `&student=${studentFilter}` : ''}`
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  (r === 0 && !ratingFilter) || String(r) === ratingFilter
                    ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                    : 'bg-surface border border-surface-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {r === 0 ? 'Todas' : (
                  <>
                    {r}
                    <Star size={10} className="fill-current" />
                  </>
                )}
              </Link>
            ))}

            {/* Por aluno */}
            {studentFilter && (
              <Link
                href={ratingFilter ? `?rating=${ratingFilter}` : '/dashboard/feedbacks'}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-purple-400/10 text-purple-400 border border-purple-400/20 hover:opacity-80 transition-opacity"
              >
                {students?.find(s => s.id === studentFilter)?.full_name ?? 'Aluno'}
                <span>×</span>
              </Link>
            )}
          </div>

          {/* Tabela */}
          {!feedbacks || feedbacks.length === 0 ? (
            <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
                <MessageSquare size={22} className="text-brand-lime" />
              </div>
              <p className="font-body font-medium text-text-primary">
                {ratingFilter || studentFilter ? 'Nenhum feedback com esse filtro' : 'Nenhum feedback ainda'}
              </p>
              <p className="text-sm text-text-secondary">
                Clique em &quot;Registrar Feedback&quot; para adicionar o primeiro.
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Aluno</th>
                    <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Treino</th>
                    <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium">Nota</th>
                    <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Comentário</th>
                    <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium">Data</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {feedbacks.map(fb => {
                    const student = joinOne<{ id: string; full_name: string }>(fb.students)
                    const plan    = joinOne<{ id: string; name: string }>(fb.workout_plans)
                    return (
                      <tr key={fb.id} className="hover:bg-surface-border/10 group">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`?${ratingFilter ? `rating=${ratingFilter}&` : ''}student=${fb.student_id}`}
                            className="text-text-primary font-medium hover:text-brand-lime transition-colors"
                          >
                            {student?.full_name ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary text-xs hidden sm:table-cell">
                          {plan?.name ?? <span className="text-text-secondary/40">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <StarRating rating={fb.rating} />
                            <span className="text-xs text-text-secondary">{RATING_LABELS[fb.rating]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {fb.comment ? (
                            <p className="text-xs text-text-secondary line-clamp-2 max-w-[200px]">
                              {fb.comment}
                            </p>
                          ) : (
                            <span className="text-text-secondary/40 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-text-secondary whitespace-nowrap">
                          {new Date(fb.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/dashboard/alunos/${fb.student_id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ArrowRight size={14} className="text-text-secondary hover:text-brand-lime transition-colors" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Distribuição de notas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-text-secondary" />
            <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
              Distribuição de notas
            </h2>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
            {total === 0 ? (
              <p className="text-sm text-text-secondary text-center py-4">Sem dados ainda</p>
            ) : (
              <>
                <div className="text-center pb-2 border-b border-surface-border">
                  <p className="font-display font-bold text-3xl text-yellow-400">
                    {avgRating.toFixed(1)}
                  </p>
                  <StarRating rating={Math.round(avgRating)} />
                  <p className="text-xs text-text-secondary mt-1">{total} avaliação{total !== 1 ? 'ões' : ''}</p>
                </div>

                {ratingDist.map(({ rating, count }) => (
                  <Link
                    key={rating}
                    href={count > 0
                      ? `?rating=${rating}${studentFilter ? `&student=${studentFilter}` : ''}`
                      : '#'
                    }
                    className={`flex items-center gap-2 group ${count === 0 ? 'pointer-events-none' : ''}`}
                  >
                    <span className="text-xs text-text-secondary w-4 text-right">{rating}</span>
                    <Star size={11} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 bg-background rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all group-hover:bg-yellow-300"
                        style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary w-5 text-right">{count}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Top alunos com feedbacks */}
          {total > 0 && (
            <>
              <div className="flex items-center gap-2 mt-5">
                <Users size={14} className="text-text-secondary" />
                <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
                  Por aluno
                </h2>
              </div>
              <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
                {(() => {
                  const byStudent = new Map<string, { name: string; count: number; avg: number; total: number }>()
                  for (const fb of feedbacks ?? []) {
                    const student = joinOne<{ id: string; full_name: string }>(fb.students)
                    const name = student?.full_name ?? '—'
                    const cur  = byStudent.get(fb.student_id) ?? { name, count: 0, avg: 0, total: 0 }
                    cur.count++
                    cur.total += fb.rating
                    cur.avg = cur.total / cur.count
                    byStudent.set(fb.student_id, cur)
                  }
                  return [...byStudent.entries()]
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 6)
                    .map(([sid, { name, count, avg }], i) => (
                      <Link
                        key={sid}
                        href={`?student=${sid}${ratingFilter ? `&rating=${ratingFilter}` : ''}`}
                        className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-border/10 transition-colors ${
                          i !== 0 ? 'border-t border-surface-border' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-lime flex-shrink-0" />
                          <span className="text-text-primary truncate">{name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-yellow-400 font-display font-bold">{avg.toFixed(1)}★</span>
                          <span className="text-xs text-text-secondary">{count}×</span>
                        </div>
                      </Link>
                    ))
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
