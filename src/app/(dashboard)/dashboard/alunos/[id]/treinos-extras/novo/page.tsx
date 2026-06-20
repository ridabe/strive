import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { createExtraWorkout } from '@/actions/extra-workouts'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function NovoTreinoExtraPage({ params }: Props) {
  const { id: studentId } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('id', studentId)
    .single()

  if (!student) notFound()

  async function handleCreate(formData: FormData) {
    'use server'
    formData.set('student_id', studentId)
    const result = await createExtraWorkout(formData)
    if (result.id) {
      redirect(`/dashboard/alunos/${studentId}/treinos-extras/${result.id}`)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <Link
        href={`/dashboard/alunos/${studentId}`}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para {student.full_name}
      </Link>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Novo Treino Extra
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Para {student.full_name}</p>
        </div>
      </div>

      <form action={handleCreate} className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          Informações do treino
        </p>

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nome *
            </label>
            <input
              name="name"
              required
              placeholder="Ex: HIIT Queima Calórica"
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Categoria
            </label>
            <select
              name="category"
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
            >
              <option value="aquecimento">Aquecimento</option>
              <option value="hiit">HIIT</option>
              <option value="mobilidade">Mobilidade</option>
              <option value="cardio">Cardio</option>
              <option value="desafio">Desafio</option>
              <option value="forca">Força</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Tags <span className="normal-case font-normal">(separadas por vírgula)</span>
            </label>
            <input
              name="tags"
              placeholder="Ex: viagem, sem equipamento, 20min"
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Instruções gerais, contexto de uso..."
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="is_template"
              value="true"
              className="w-4 h-4 rounded border border-surface-border accent-brand-lime"
            />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              Salvar como template (reutilizável para outros alunos)
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors"
        >
          Criar e Montar Exercícios →
        </button>
      </form>
    </div>
  )
}
