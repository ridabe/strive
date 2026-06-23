import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UtensilsCrossed, Plus, Target, Users, ChevronRight } from 'lucide-react'

const GOAL_COLOR: Record<string, string> = {
  'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Manutenção':     'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  'Saúde Geral':    'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Performance':    'text-red-400 bg-red-400/10 border-red-400/20',
  'Vegetariano':    'text-green-400 bg-green-400/10 border-green-400/20',
}

export default async function PlanosAlimentaresPage() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('meal_plans')
    .select('id, name, goal, status, created_at, student_meal_plan_assignments ( student_id )')
    .order('created_at', { ascending: false })

  const total  = plans?.length ?? 0
  const active = plans?.filter((p) => p.status === 'active').length ?? 0

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Planos Alimentares
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {total} plano{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/planos-alimentares/novo"
          className="flex items-center gap-2 bg-brand-lime text-background font-body font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors flex-shrink-0"
        >
          <Plus size={16} />
          Novo Plano
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
          <UtensilsCrossed size={32} className="text-text-secondary/40 mx-auto" />
          <div>
            <p className="font-body font-medium text-text-primary">Nenhum plano ainda</p>
            <p className="text-sm text-text-secondary mt-1">
              Crie seu primeiro plano alimentar e depois atribua a alunos.
            </p>
          </div>
          <Link href="/dashboard/planos-alimentares/novo" className="inline-flex items-center gap-2 text-sm text-brand-lime hover:underline">
            <Plus size={13} /> Criar plano
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="divide-y divide-surface-border">
            {plans?.map((plan) => {
              const assignCount = plan.student_meal_plan_assignments?.length ?? 0
              return (
                <Link
                  key={plan.id}
                  href={`/dashboard/planos-alimentares/${plan.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-border/20 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed size={16} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-body font-medium text-text-primary text-sm truncate group-hover:text-brand-lime transition-colors">
                      {plan.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {plan.goal && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                          GOAL_COLOR[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
                        }`}>
                          <Target size={8} />
                          {plan.goal}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                        <Users size={9} />
                        {assignCount} aluno{assignCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    plan.status === 'active'
                      ? 'text-status-success bg-status-success/10 border-status-success/20'
                      : 'text-text-secondary bg-background border-surface-border'
                  }`}>
                    {plan.status === 'active' ? 'Ativo' : 'Rascunho'}
                  </span>
                  <ChevronRight size={14} className="text-text-secondary/40 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
