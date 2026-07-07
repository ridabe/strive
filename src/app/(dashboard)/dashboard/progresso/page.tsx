import { createClient } from '@/lib/supabase/server'
import { requireAcademiaModuleAccess } from '@/lib/supabase/module-access'
import Link from 'next/link'
import { joinOne } from '@/lib/supabase/join'
import { TrendingUp, ArrowRight, StickyNote, ImageIcon } from 'lucide-react'

export default async function ProgressoDashboardPage() {
  await requireAcademiaModuleAccess('meu-progresso')
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('student_progress')
    .select(
      'id, recorded_at, weight, notes, photo_urls, student_id, students ( id, full_name )',
    )
    .order('recorded_at', { ascending: false })
    .limit(100)

  const total = entries?.length ?? 0

  // Alunos distintos com registros
  const studentSet = new Set(entries?.map((e) => e.student_id) ?? [])
  const totalStudents = studentSet.size

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Meu Progresso
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Registros de progresso enviados pelos alunos
        </p>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="bg-surface border border-surface-border rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-brand-lime">{total}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              registro{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-surface border border-surface-border rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-text-primary">{totalStudents}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              aluno{totalStudents !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {total === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <TrendingUp size={22} className="text-brand-lime" />
          </div>
          <div>
            <p className="font-body font-medium text-text-primary">
              Nenhum registro ainda
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Os alunos registram seu progresso pelo aplicativo deles.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">
                  Aluno
                </th>
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">
                  Data
                </th>
                <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">
                  Peso
                </th>
                <th className="px-5 py-3 text-xs text-text-secondary font-body font-medium text-center">
                  Conteúdo
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {entries?.map((e) => {
                const student = joinOne<{ id: string; full_name: string }>(e.students)
                return (
                  <tr key={e.id} className="hover:bg-surface-border/10 group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-brand-lime flex-shrink-0" />
                        <span className="text-text-primary font-medium">
                          {student?.full_name ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">
                      {new Date(e.recorded_at + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-primary">
                      {e.weight !== null ? `${e.weight} kg` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2 text-text-secondary">
                        {e.notes && <StickyNote size={13} />}
                        {(e.photo_urls as string[]).length > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon size={13} />
                            <span className="text-xs">{(e.photo_urls as string[]).length}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {student && (
                        <Link
                          href={`/dashboard/alunos/${student.id}/progresso`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-text-secondary hover:text-brand-lime flex items-center gap-1 justify-end"
                        >
                          Ver aluno
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
