'use client'

import { useRef, useState, useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { createTenantMember } from '@/actions/tenant-members'

export function InviteMemberForm({ canCreateStaff = false }: { canCreateStaff?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createTenantMember(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
    })
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-surface border border-surface-border rounded-xl p-4 sm:p-5 space-y-3"
    >
      <p className="font-body font-semibold text-sm text-text-primary">Convidar para a equipe</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          name="full_name"
          placeholder="Nome completo"
          required
          className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60"
        />
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          required
          className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60"
        />
        <select
          name="role"
          defaultValue="personal"
          className="bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60"
        >
          <option value="personal">Personal</option>
          {canCreateStaff && (
            <>
              <option value="operador">Operador</option>
              <option value="gerente">Gerente</option>
              <option value="admin">Admin</option>
            </>
          )}
        </select>
      </div>

      {error && <p className="text-xs text-status-error">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-brand-lime text-background font-body font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
      >
        <UserPlus size={15} />
        {isPending ? 'Enviando...' : 'Convidar'}
      </button>
    </form>
  )
}
