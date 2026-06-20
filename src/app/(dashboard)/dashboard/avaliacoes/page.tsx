import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { joinOne } from '@/lib/supabase/join'
import { Ruler, TrendingUp, ArrowRight } from 'lucide-react'

export default async function AvaliacoesPage() {
  const supabase = await createClient()

  const { data: assessments } = await supabase
    .from('physical_assessments')
    .select(
      'id, assessed_at, weight, height, body_fat, student_id, students ( id, full_name )',
    )
    .order('assessed_at', { ascending: false })
    .limit(100)

  const total = assessments?.length ?? 0

  // Agrupa por aluno para contagem
  const byStudent = new Map<string, number>()
  for (const a of assessments ?? []) {
    byStudent.set(a.student_id, (byStudent.get(a.student_id) ?? 0) + 1)
  }
  const totalStudents = byStudent.size

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Avaliações Físicas
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Histórico de todas as avaliações registradas
        </p>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <div className="bg-surface border border-surface-border rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-purple-400">{total}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              avaliação{total !== 1 ? 'ões' : ''}
            </p>
          </div>
          <div className="bg-surface border border-surface-border rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-text-primary">{totalStudents}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              aluno{totalStudents !== 1 ? 's' : ''} avaliado{totalStudents !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
      {total === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center mx-auto">
            <Ruler size={22} className="text-purple-400" />
          </div>
          <div>
            <p className="font-body font-medium text-text-primary">
              Nenhuma avaliação registrada ainda
            </p>
            <p className="text-sm text-text-secondary mt-1">
              As avaliações físicas são registradas na ficha de cada aluno.
            </p>
          </div>
          <Link
            href="/dashboard/alunos"
            className="inline-flex items-center gap-2 text-sm text-brand-lime hover:opacity-80 transition-opacity mt-2"
          >
            Ir para Alunos
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
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
                <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">
                  Altura
                </th>
                <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">
                  % Gordura
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {assessments?.map((a) => {
                const student = joinOne<{ id: string; full_name: string }>(a.students)
                return (
                  <tr key={a.id} className="hover:bg-surface-border/10 group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-purple-400 flex-shrink-0" />
                        {student ? (
                          <Link
                            href={`/dashboard/alunos/${student.id}/avaliacoes`}
                            className="text-text-primary font-medium hover:text-brand-lime transition-colors"
                          >
                            {student.full_name}
                          </Link>
                        ) : (
                          <span className="text-text-primary font-medium">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">
                      {new Date(a.assessed_at + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-primary">
                      {a.weight !== null ? `${a.weight} kg` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-secondary">
                      {a.height !== null ? `${a.height} cm` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-primary">
                      {a.body_fat !== null ? `${a.body_fat}%` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {student && (
                        <Link
                          href={`/dashboard/alunos/${student.id}/avaliacoes`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-text-secondary hover:text-brand-lime flex items-center gap-1 justify-end"
                        >
                          Ver todas
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
      )}
    </div>
  )
}
