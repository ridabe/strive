'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { createModule } from '@/app/actions/modules'

const CATEGORIES = [
  { value: 'treinos',         label: 'Treinos' },
  { value: 'acompanhamento',  label: 'Acompanhamento' },
  { value: 'financeiro',      label: 'Financeiro' },
  { value: 'comunicacao',     label: 'Comunicação / Conteúdo' },
  { value: 'whitelabel',      label: 'White-label' },
  { value: 'futuro',          label: 'Futuro' },
]

const STATUSES = [
  { value: 'active',       label: 'Ativo' },
  { value: 'beta',         label: 'Beta' },
  { value: 'coming_soon',  label: 'Em breve' },
]

export function CreateModuleDialog() {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createModule(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 transition-colors"
      >
        <Plus size={15} /> Novo módulo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h2 className="font-body font-semibold text-text-primary">Novo módulo</h2>
              <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-body font-medium text-text-secondary">
                  Nome <span className="text-status-error">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ex: Agendamento Online"
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-body font-medium text-text-secondary">Descrição</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Descreva brevemente o que este módulo oferece..."
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-body font-medium text-text-secondary">
                    Categoria <span className="text-status-error">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-body font-medium text-text-secondary">Status</label>
                  <select
                    name="status"
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60 transition-colors"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-body font-medium text-text-secondary">
                  Ícone{' '}
                  <span className="text-text-secondary/50 font-normal">
                    (nome do ícone Lucide, ex: Dumbbell)
                  </span>
                </label>
                <input
                  name="icon"
                  type="text"
                  placeholder="Ex: Calendar, Star, Zap..."
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Criar módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
