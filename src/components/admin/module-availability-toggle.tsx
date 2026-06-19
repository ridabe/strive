'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleModuleAvailability } from '@/app/actions/modules'

interface Props {
  moduleId: string
  available: boolean
  disabled?: boolean
}

export function ModuleAvailabilityToggle({ moduleId, available, disabled }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleModuleAvailability(moduleId, !available)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending || disabled}
      title={available ? 'Desativar módulo globalmente' : 'Ativar módulo globalmente'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        available ? 'bg-brand-lime' : 'bg-surface-border'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          available ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
