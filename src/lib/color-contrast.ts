// Decide se um texto deve ser preto ou branco em cima de um fundo hex,
// usando a fórmula de brilho percebido (YIQ) — mais confiável que listas
// fixas de cores "claras conhecidas", que falham para qualquer tom novo
// (ex: um amarelo customizado fora da lista).
export function getReadableTextColor(hexBackground: string): '#000000' | '#FFFFFF' {
  const hex = hexBackground.replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return '#FFFFFF'

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 128 ? '#000000' : '#FFFFFF'
}

// Converte um hex (#RRGGBB ou #RGB) em canais "R G B" separados por espaço,
// formato exigido pelo Tailwind para o token `rgb(var(--x) / <alpha-value>)`
// (permite modificadores de opacidade tipo bg-brand-lime/10). Fallback: lima.
export function hexToRgbChannels(hex: string): string {
  const h = (hex ?? '').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (!/^[0-9A-Fa-f]{6}$/.test(full)) return '232 255 71'
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

// override: valor salvo pelo tenant ('#000000' | '#FFFFFF'), ou null/undefined
// para cálculo automático.
export function resolveTextColor(
  hexBackground: string,
  override?: string | null,
): '#000000' | '#FFFFFF' {
  if (override === '#000000' || override === '#FFFFFF') return override
  return getReadableTextColor(hexBackground)
}
