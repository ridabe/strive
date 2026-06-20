import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { createWorkoutPlan } from '@/actions/workout-plans'
import Link from 'next/link'
import { ArrowLeft, Calendar, ClipboardList } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function NovoPlanoPage({ params }: Props) {
  const { id: studentId } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, goal')
    .eq('id', studentId)
    .single()

  if (!student) notFound()

  async function handleCreate(formData: FormData) {
    'use server'
    formData.set('student_id', studentId)
    const result = await createWorkoutPlan(formData)
    if (result.planId) {
      redirect(`/dashboard/alunos/${studentId}/treinos/${result.planId}`)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      {/* Voltar */}
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para {student.full_name}
      </Link>

      {/* Título */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <ClipboardList size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Novo Plano de Treino
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Para {student.full_name}
          </p>
        </div>
      </div>

      {/* Formulário de cabeçalho */}
      <form action={handleCreate} className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          Informações do plano
        </p>

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nome do plano *
            </label>
            <input
              name="name"
              required
              placeholder="Ex: Hipertrofia — Foco em Quadríceps"
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Objetivo
            </label>
            <select
              name="goal"
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
            >
              <option value="">Selecionar objetivo...</option>
              <option value="Hipertrofia">Hipertrofia</option>
              <option value="Emagrecimento">Emagrecimento</option>
              <option value="Resistência">Resistência</option>
              <option value="Força">Força</option>
              <option value="Condicionamento">Condicionamento</option>
              <option value="Reabilitação">Reabilitação</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Observações gerais
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Frequência semanal, progressão, restrições..."
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Calendar size={11} /> Início
              </label>
              <input
                name="start_date"
                type="date"
                className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Calendar size={11} /> Término
              </label>
              <input
                name="end_date"
                type="date"
                className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors"
        >
          Criar Plano e Montar Rotinas →
        </button>
      </form>
    </div>
  )
}
