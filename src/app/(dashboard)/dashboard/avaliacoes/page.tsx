import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { Ruler, TrendingUp } from 'lucide-react'

export default async function AvaliacoesPage() {
  const supabase = await createClient()

  const { data: assessments } = await supabase
    .from('physical_assessments')
    .select(`
      id, assessed_at, weight, body_fat,
      students ( full_name )
    `)
    .order('assessed_at', { ascending: false })
    .limit(50)

  const total = assessments?.length ?? 0

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Avaliações Físicas
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {total} avaliação{total !== 1 ? 'ões' : ''} registrada{total !== 1 ? 's' : ''}
        </p>
      </div>

      {total === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
          <Ruler size={32} className="text-text-secondary/40 mx-auto" />
          <div>
            <p className="font-body font-medium text-text-primary">Nenhuma avaliação registrada ainda</p>
            <p className="text-sm text-text-secondary mt-1">
              As avaliações físicas serão cadastradas na ficha de cada aluno.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Aluno</th>
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Data</th>
                <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">Peso (kg)</th>
                <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">% Gordura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {assessments?.map((a) => {
                const student = joinOne<{ full_name: string }>(a.students)
                return (
                  <tr key={a.id} className="hover:bg-surface-border/10">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-purple-400 flex-shrink-0" />
                        <span className="text-text-primary font-medium">{student?.full_name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">
                      {new Date(a.assessed_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-primary">
                      {a.weight ? `${a.weight} kg` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-primary">
                      {a.body_fat ? `${a.body_fat}%` : '—'}
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
