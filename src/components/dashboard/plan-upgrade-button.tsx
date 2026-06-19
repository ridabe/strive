'use client'

import { useTransition } from 'react'
import { startSubscriptionCheckout } from '@/app/actions/billing'
import { Loader2 } from 'lucide-react'

interface Props {
  planSlug: 'pro' | 'premium'
  label:    string
  variant?: 'primary' | 'outline'
}

export function PlanUpgradeButton({ planSlug, label, variant = 'primary' }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => {
      startSubscriptionCheckout(planSlug)
    })
  }

  const base = 'inline-flex items-center justify-center gap-2 w-full text-sm font-body font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50'
  const styles = variant === 'primary'
    ? `${base} bg-brand-lime text-text-inverse hover:bg-brand-dark`
    : `${base} border border-brand-lime/40 text-brand-lime hover:bg-brand-lime/10`

  return (
    <button onClick={handleClick} disabled={isPending} className={styles}>
      {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
      {isPending ? 'Redirecionando...' : label}
    </button>
  )
}
