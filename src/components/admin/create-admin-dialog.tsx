'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, ShieldCheck } from 'lucide-react'
import { createGlobalAdmin } from '@/app/actions/users'

export function CreateAdminDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function close() {
    setOpen(false)
    setError(null)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const r = await createGlobalAdmin(formData)
      if (r.error) {
        setError(r.error)
        return
      }
      router.refresh()
      close()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-brand-lime text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors flex-shrink-0"
      >
        <Plus size={16} />
        Novo admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <div className="relative bg-surface border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
                  <ShieldCheck size={15} className="text-brand-lime" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary">Novo admin global</h3>
              </div>
              <button onClick={close} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-5">
              O novo admin receberá acesso completo à plataforma. Uma senha temporária será gerada — o usuário deverá alterá-la no primeiro acesso.
            </p>

            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="adm-name" className="block text-sm font-medium text-text-secondary">
                  Nome completo <span className="text-status-error">*</span>
                </label>
                <input
                  id="adm-name"
                  name="full_name"
                  required
                  placeholder="Ex: João Silva"
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adm-email" className="block text-sm font-medium text-text-secondary">
                  E-mail <span className="text-status-error">*</span>
                </label>
                <input
                  id="adm-email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@exemplo.com"
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 disabled:opacity-60 transition-colors"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  Criar admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
