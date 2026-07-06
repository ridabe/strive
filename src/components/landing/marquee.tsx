// Marquee / ticker — divisor de seção com movimento contínuo.
// A animação vive em tailwind.config.ts (utilitário `animate-marquee`), gerada
// na camada de utilities do Tailwind. Componente estático, sem 'use client'.

const DEFAULT_WORDS = ['Simplifique', 'Profissionalize', 'Escale']

export function Marquee({ words = DEFAULT_WORDS }: { words?: string[] }) {
  // Sequência longa o suficiente para preencher a largura; renderizada 2x para
  // que o translateX(-50%) faça o loop parecer contínuo (sem emenda).
  const sequence = [...words, ...words, ...words, ...words]

  return (
    <div
      className="marquee-wrap relative overflow-hidden border-y border-surface-border bg-surface/30 py-3 select-none"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {sequence.map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span className="px-2 font-display text-lg font-bold uppercase tracking-tight text-text-primary/90">
                  {word}
                </span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-brand-lime/90" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
