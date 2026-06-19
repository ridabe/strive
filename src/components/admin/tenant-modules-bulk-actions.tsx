'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, XSquare, Loader2 } from 'lucide-react'
import { enableAllModulesForTenant, disableAllModulesForTenant } from '@/app/actions/modules'

interface Props { tenantId: string }

export function TenantModulesBulkActions({ tenantId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleEnableAll() {
    startTransition(async () => {
      await enableAllModulesForTenant(tenantId)
      router.refresh()
    })
  }

  function handleDisableAll() {
    if (!confirm('Desabilitar todos os módulos deste cliente?')) return
    startTransition(async () => {
      await disableAllModulesForTenant(tenantId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {isPending && <Loader2 size={14} className="animate-spin text-text-secondary" />}
      <button
        onClick={handleEnableAll}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-brand-lime/30 text-brand-lime hover:bg-brand-lime/10 transition-colors disabled:opacity-50"
      >
        <CheckCheck size={12} /> Habilitar todos
      </button>
      <button
        onClick={handleDisableAll}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-status-error hover:border-status-error/30 transition-colors disabled:opacity-50"
      >
        <XSquare size={12} /> Desabilitar todos
      </button>
    </div>
  )
}
