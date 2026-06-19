interface LogoIconProps {
  size?: number
  glow?: boolean
}

export function LogoIcon({ size = 72, glow = false }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size * 0.88}
      viewBox="0 0 100 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: 'drop-shadow(0 0 10px rgba(232,255,71,0.6)) drop-shadow(0 0 24px rgba(232,255,71,0.25))' } : undefined}
    >
      {/* Flat-top hexagon */}
      <polygon
        points="90,44 70,79.6 30,79.6 10,44 30,8.4 70,8.4"
        fill="#0A0A16"
        stroke="#E8FF47"
        strokeWidth="2.8"
      />
      {/* 3 ascending bars, bottom-aligned at y=72 */}
      {/* Bar 1 — short */}
      <rect x="27" y="54" width="13" height="18" rx="2.5" fill="#E8FF47" />
      {/* Bar 2 — medium */}
      <rect x="44" y="44" width="13" height="28" rx="2.5" fill="#E8FF47" />
      {/* Bar 3 — tall */}
      <rect x="61" y="35" width="13" height="37" rx="2.5" fill="#E8FF47" />
    </svg>
  )
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
}

export function LogoVertical({ size = 'md', glow = false }: LogoProps) {
  const iconSize = size === 'sm' ? 52 : size === 'lg' ? 96 : 72
  const titleSize = size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-5xl' : 'text-4xl'
  const subtitleSize = size === 'sm' ? 'text-[0.6rem] tracking-[0.25em]' : size === 'lg' ? 'text-base tracking-[0.35em]' : 'text-xs tracking-[0.3em]'

  return (
    <div className="flex flex-col items-center gap-2">
      <LogoIcon size={iconSize} glow={glow} />
      <div className="flex flex-col items-center gap-0.5">
        <span className={`font-display font-bold text-text-primary uppercase leading-none ${titleSize}`}>
          STRIVE
        </span>
        <span className={`font-display font-bold text-brand-lime uppercase leading-none ${subtitleSize}`}>
          PERSONAL
        </span>
      </div>
    </div>
  )
}

export function LogoHorizontal({ size = 'md', glow = false }: LogoProps) {
  const iconSize = size === 'sm' ? 36 : size === 'lg' ? 64 : 48
  const titleSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
  const subtitleSize = size === 'sm' ? 'text-[0.5rem] tracking-[0.2em]' : size === 'lg' ? 'text-sm tracking-[0.3em]' : 'text-[0.6rem] tracking-[0.25em]'

  return (
    <div className="flex items-center gap-3">
      <LogoIcon size={iconSize} glow={glow} />
      <div className="flex flex-col gap-0.5">
        <span className={`font-display font-bold text-text-primary uppercase leading-none ${titleSize}`}>
          STRIVE
        </span>
        <span className={`font-display font-bold text-brand-lime uppercase leading-none ${subtitleSize}`}>
          PERSONAL
        </span>
      </div>
    </div>
  )
}
