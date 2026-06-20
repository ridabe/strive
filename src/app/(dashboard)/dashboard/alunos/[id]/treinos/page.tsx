import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Plus, Target, Calendar } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function AlunoTreinosPage({ params }: Props) {
  const { id: studentId } = await params
  const supabase = await createClient()

  const [{ data: student }, { data: plans }] = await Promise.all([
    supabase.from('students').select('id, full_name').eq('id', studentId).single(),
    supabase
      .from('workout_plans')
      .select('id, name, goal, status, start_date, end_date, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),
  ])

  if (!student) notFound()

  const goalColor: Record<string, string> = {
    'Hipertrofia':    'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Emagrecimento':  'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'Força':          'text-red-400 bg-red-400/10 border-red-400/20',
    'Resistência':    'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
    'Condicionamento':'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'Reabilitação':   'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        {student.full_name}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Planos de Treino
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{student.full_name}</p>
        </div>
        <Link
          href={`/dashboard/alunos/${studentId}/treinos/novo`}
          className="flex items-center gap-2 bg-brand-lime text-background font-body font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          Novo Plano
        </Link>
      </div>

      {!plans?.length ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center space-y-3">
          <ClipboardList size={32} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Nenhum plano de treino ainda</p>
          <p className="text-sm text-text-secondary">
            Crie o primeiro plano para {student.full_name}.
          </p>
          <Link
            href={`/dashboard/alunos/${studentId}/treinos/novo`}
            className="inline-flex items-center gap-2 text-sm text-brand-lime hover:underline"
          >
            <Plus size={13} /> Criar plano
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/dashboard/alunos/${studentId}/treinos/${plan.id}`}
              className="flex items-center gap-4 bg-surface border border-surface-border rounded-2xl p-4 hover:border-brand-lime/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-body font-medium text-text-primary truncate group-hover:text-brand-lime transition-colors">
                  {plan.name}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {plan.goal && (
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                      goalColor[plan.goal] ?? 'text-text-secondary bg-background border-surface-border'
                    }`}>
                      <Target size={9} />
                      {plan.goal}
                    </span>
                  )}
                  {plan.start_date && (
                    <span className="flex items-center gap-1 text-[10px] text-text-secondary bg-background border border-surface-border px-1.5 py-0.5 rounded-md">
                      <Calendar size={9} />
                      {new Date(plan.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${
                plan.status === 'active'
                  ? 'text-status-success bg-status-success/10 border-status-success/20'
                  : 'text-text-secondary bg-background border-surface-border'
              }`}>
                {plan.status === 'active' ? 'Publicado' : 'Rascunho'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
