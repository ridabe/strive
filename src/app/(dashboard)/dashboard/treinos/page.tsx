import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import Link from 'next/link'
import { ClipboardList, Plus, Users } from 'lucide-react'

export default async function TreinosPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('workout_plans')
    .select(`
      id, name, status, created_at,
      students ( full_name )
    `)
    .order('created_at', { ascending: false })

  const total   = plans?.length ?? 0
  const active  = plans?.filter((p) => p.status === 'active').length ?? 0

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Planos de Treino
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {total} plano{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/alunos"
          className="flex items-center gap-2 bg-brand-lime text-background font-body font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors flex-shrink-0"
          title="Selecione um aluno para criar o plano"
        >
          <Plus size={16} />
          Selecionar Aluno
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-surface-border rounded-xl p-4">
          <p className="font-body font-bold text-2xl text-text-primary">{total}</p>
          <p className="text-xs text-text-secondary">Total de planos</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-xl p-4">
          <p className="font-body font-bold text-2xl text-status-success">{active}</p>
          <p className="text-xs text-text-secondary">Planos ativos</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
          <ClipboardList size={32} className="text-text-secondary/40 mx-auto" />
          <div>
            <p className="font-body font-medium text-text-primary">Nenhum plano de treino ainda</p>
            <p className="text-sm text-text-secondary mt-1">
              Acesse a ficha de um aluno para criar o primeiro plano.
            </p>
          </div>
          <Link href="/dashboard/alunos" className="inline-flex items-center gap-2 text-sm text-brand-lime hover:underline">
            <Users size={14} /> Ver alunos
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="divide-y divide-surface-border">
            {plans?.map((plan) => {
              const student = joinOne<{ full_name: string }>(plan.students)
              return (
                <div key={plan.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-text-primary text-sm truncate">{plan.name}</p>
                    {student && (
                      <p className="text-xs text-text-secondary">{student.full_name}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    plan.status === 'active'
                      ? 'text-status-success bg-status-success/10 border-status-success/20'
                      : 'text-text-secondary bg-background border-surface-border'
                  }`}>
                    {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
