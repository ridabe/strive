'use client'

import { trackContentLibraryItemUsage } from '@/actions/content-library'

interface Props {
  itemId: string
  href: string
  event: 'canva_open' | 'download'
  className: string
  children: React.ReactNode
}

export function TrackedLink({ itemId, href, event, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => { trackContentLibraryItemUsage(itemId, event) }}
    >
      {children}
    </a>
  )
}
