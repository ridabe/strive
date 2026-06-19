'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleTenantModule } from '@/app/actions/modules'

interface Props {
  tenantId: string
  moduleId: string
  enabled: boolean
  disabled?: boolean // módulo não disponível globalmente
}

export function TenantModuleToggle({ tenantId, moduleId, enabled, disabled }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    if (disabled) return
    startTransition(async () => {
      await toggleTenantModule(tenantId, moduleId, !enabled)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending || disabled}
      title={
        disabled
          ? 'Módulo indisponível globalmente'
          : enabled ? 'Desabilitar para este cliente' : 'Habilitar para este cliente'
      }
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed ${
        disabled
          ? 'bg-surface-border opacity-40'
          : enabled
          ? 'bg-brand-lime'
          : 'bg-surface-border'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
