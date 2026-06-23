import { redirect } from 'next/navigation'
import { createMealPlan } from '@/app/actions/meal-plans'
import Link from 'next/link'
import { ArrowLeft, UtensilsCrossed } from 'lucide-react'

export default function NovoPlanoAlimentarPage() {
  async function handleCreate(formData: FormData) {
    'use server'
    const result = await createMealPlan(formData)
    if ('planId' in result && result.planId) {
      redirect(`/dashboard/planos-alimentares/${result.planId}`)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <Link
        href="/dashboard/planos-alimentares"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Planos Alimentares
      </Link>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <UtensilsCrossed size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Novo Plano Alimentar
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Crie o plano e depois monte as refeições e alimentos
          </p>
        </div>
      </div>

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
              placeholder="Ex: Dieta Low Carb — Emagrecimento"
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
              <option value="Emagrecimento">Emagrecimento</option>
              <option value="Hipertrofia">Hipertrofia</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Saúde Geral">Saúde Geral</option>
              <option value="Performance">Performance</option>
              <option value="Vegetariano">Vegetariano</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Meta calórica diária (kcal)
            </label>
            <input
              name="daily_calories"
              type="number"
              min={0}
              placeholder="Ex: 2000"
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Observações gerais
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Restrições, alergias, preferências..."
              className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors"
        >
          Criar Plano e Montar Refeições →
        </button>
      </form>
    </div>
  )
}
