'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, PauseCircle, PlayCircle, ExternalLink, Pencil } from 'lucide-react'
import { suspendClient, activateClient } from '@/app/actions/clients'

// Reaproveita suspendClient/activateClient (src/app/actions/clients.ts) —
// operam genericamente sobre `tenants` por id, sem depender de tenant_type.
interface AcademiaActionsProps {
  tenantId: string
  tenantName: string
  currentStatus: string
}

export function AcademiaActions({ tenantId, tenantName, currentStatus }: AcademiaActionsProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isSuspended = currentStatus === 'suspended'

  function handleToggleStatus() {
    setOpen(false)
    const confirmed = confirm(
      isSuspended
        ? `Reativar a academia "${tenantName}"?`
        : `Suspender a academia "${tenantName}"? Todos os personais e admins perderão acesso.`
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = isSuspended
        ? await activateClient(tenantId)
        : await suspendClient(tenantId)

      if ('error' in result && result.error) {
        alert(`Erro: ${result.error}`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background transition-colors disabled:opacity-40"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 bottom-8 z-20 bg-surface border border-surface-border rounded-xl shadow-xl py-1 min-w-[180px]">
            <button
              onClick={handleToggleStatus}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-left transition-colors ${
                isSuspended
                  ? 'text-status-success hover:bg-status-success/10'
                  : 'text-status-error hover:bg-status-error/10'
              }`}
            >
              {isSuspended ? (
                <><PlayCircle size={15} /> Reativar academia</>
              ) : (
                <><PauseCircle size={15} /> Suspender academia</>
              )}
            </button>
            <div className="border-t border-surface-border my-1" />
            <a
              href={`/admin/academias/${tenantId}`}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
              onClick={() => setOpen(false)}
            >
              <ExternalLink size={15} /> Ver detalhes
            </a>
            <a
              href={`/admin/academias/${tenantId}`}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
              onClick={() => setOpen(false)}
            >
              <Pencil size={15} /> Editar
            </a>
          </div>
        </>
      )}
    </div>
  )
}
