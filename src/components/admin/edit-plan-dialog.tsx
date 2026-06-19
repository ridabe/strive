'use client'

import { useState, useTransition } from 'react'
import { updatePlan } from '@/app/actions/plans'
import { Pencil, X, Loader2, Plus, Trash2 } from 'lucide-react'

interface Plan {
  id: string
  slug: string
  name: string
  description: string | null
  price_brl: number
  max_students: number
  features: string[]
  is_active: boolean
}

export function EditPlanDialog({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [features, setFeatures] = useState<string[]>(plan.features)
  const [newFeature, setNewFeature] = useState('')

  const isDefaultPlan = ['free', 'pro', 'premium'].includes(plan.slug)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('features', JSON.stringify(features))

    startTransition(async () => {
      const result = await updatePlan(plan.id, fd)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  function addFeature() {
    const f = newFeature.trim()
    if (!f) return
    setFeatures(prev => [...prev, f])
    setNewFeature('')
  }

  function removeFeature(idx: number) {
    setFeatures(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg border border-surface-border hover:border-brand-lime/30"
      >
        <Pencil size={12} />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-border">
              <div>
                <h2 className="font-display font-bold text-text-primary">
                  Editar plano {plan.name}
                </h2>
                {isDefaultPlan && (
                  <p className="text-xs text-status-warning mt-0.5">
                    Alterações de limite afetarão todos os tenants neste plano.
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-wider">
                  Nome do plano
                </label>
                <input
                  name="name"
                  defaultValue={plan.name}
                  required
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 transition-colors"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-wider">
                  Descrição
                </label>
                <textarea
                  name="description"
                  defaultValue={plan.description ?? ''}
                  rows={2}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 transition-colors resize-none"
                />
              </div>

              {/* Preço + Limite lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-wider">
                    Preço (R$/mês)
                  </label>
                  <input
                    name="price_brl"
                    type="number"
                    min={0}
                    defaultValue={plan.price_brl}
                    required
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-wider">
                    Limite de alunos
                  </label>
                  <input
                    name="max_students"
                    type="number"
                    min={1}
                    defaultValue={plan.max_students}
                    required
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 transition-colors"
                    placeholder="9999 = ilimitado"
                  />
                  <p className="text-xs text-text-secondary/60">9999 = ilimitado</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-wider">
                  Funcionalidades incluídas
                </label>
                <div className="space-y-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-text-primary bg-background border border-surface-border rounded-lg px-3 py-2">
                        {f}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-text-secondary/50 hover:text-status-error transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Adicionar feature */}
                <div className="flex gap-2">
                  <input
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="Nova funcionalidade..."
                    className="flex-1 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-lime border border-brand-lime/30 rounded-lg px-3 py-2 hover:bg-brand-lime/10 transition-colors"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-lime text-text-inverse text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
