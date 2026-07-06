// Marquee / ticker — divisor de seção com movimento contínuo.
// Identidade "performance terminal": palavras em texto-contorno (ghost), o lima
// aparece apenas nos pontos separadores — energia com raridade (DESIGN.md).
// Componente estático: a animação é 100% CSS (ver globals.css .animate-marquee),
// por isso não precisa de 'use client'.

const DEFAULT_WORDS = ['Simplifique', 'Profissionalize', 'Escale']

export function Marquee({ words = DEFAULT_WORDS }: { words?: string[] }) {
  // Sequência longa o suficiente para preencher a largura; renderizada 2x para
  // que o translateX(-50%) faça o loop parecer contínuo (sem emenda).
  const sequence = [...words, ...words, ...words, ...words]

  return (
    <div
      className="marquee-wrap relative overflow-hidden border-y border-surface-border bg-surface/30 py-5 select-none"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {sequence.map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span
                  className="px-6 font-display text-2xl font-bold uppercase tracking-tight text-transparent sm:text-3xl"
                  style={{ WebkitTextStroke: '1px #2A2A45' }}
                >
                  {word}
                </span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
