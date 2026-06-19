'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface AuthSubmitButtonProps {
  label: string
  loadingLabel?: string
}

export function AuthSubmitButton({ label, loadingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 font-body font-semibold text-sm bg-brand-lime text-text-inverse px-4 py-3 rounded-lg hover:bg-brand-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {loadingLabel ?? label}
        </>
      ) : (
        label
      )}
    </button>
  )
}
