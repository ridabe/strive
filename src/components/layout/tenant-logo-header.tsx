import Image from 'next/image'
import { resolveTextColor } from '@/lib/color-contrast'

interface Props {
  logoUrl: string | null
  businessName: string
  primaryColor: string
  onPrimaryTextColor?: string | null
}

export function TenantLogoHeader({ logoUrl, businessName, primaryColor, onPrimaryTextColor }: Props) {
  const initial = businessName.charAt(0).toUpperCase()

  if (logoUrl) {
    return (
      <div className="flex items-center justify-center px-1 py-1 min-h-[48px]">
        <div className="relative w-full h-12">
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
