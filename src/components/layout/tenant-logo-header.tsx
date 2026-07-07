import Image from 'next/image'
import { resolveTextColor } from '@/lib/color-contrast'

interface Props {
  logoUrl: string | null
  businessName: string
  primaryColor: string
  onPrimaryTextColor?: string | null
  /** Academia: envolve o logo numa placa sutil, valorizando a marca no menu. */
  framed?: boolean
}

export function TenantLogoHeader({ logoUrl, businessName, primaryColor, onPrimaryTextColor, framed }: Props) {
  const initial = businessName.charAt(0).toUpperCase()

  if (logoUrl) {
    return (
      <div
        className={
          framed
            ? 'flex items-center justify-center rounded-lg bg-background border border-surface-border px-3 py-2.5 min-h-[56px]'
            : 'flex items-center justify-center px-1 py-1 min-h-[48px]'
        }
      >
        <div className={`relative w-full ${framed ? 'h-11' : 'h-12'}`}>
          <Image
            src={logoUrl}
            alt={businessName}
            fill
            className="object-contain object-left"
            sizes="180px"
            priority
          />
        </div>
      </div>
    )
  }

  // Fallback com placa (academia): inicial no accent + nome em destaque.
  if (framed) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-background border border-surface-border px-3 py-2.5 min-h-[56px]">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-lg"
          style={{ background: primaryColor, color: resolveTextColor(primaryColor, onPrimaryTextColor) }}
        >
          {initial}
        </div>
        <span className="font-body font-semibold text-text-primary text-sm leading-tight truncate">
          {businessName}
        </span>
      </div>
    )
  }

  // Fallback: inicial do negócio com a cor primária do tenant
  return (
    <div className="flex items-center gap-3 min-h-[48px]">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-black text-lg"
        style={{ background: primaryColor, color: resolveTextColor(primaryColor, onPrimaryTextColor) }}
      >
        {initial}
      </div>
      <span className="font-body font-semibold text-text-primary text-sm leading-tight truncate">
        {businessName}
      </span>
    </div>
  )
}
