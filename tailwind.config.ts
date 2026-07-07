import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens de superfície/tipografia roteados por CSS var. O fallback é o
        // valor dark original (tema personal autônomo), definido em :root no
        // globals.css. O tema academia sobrescreve os mesmos vars sob
        // [data-theme="academia"] — sem alterar nenhuma classe de componente.
        // Tokens temáveis em formato de CANAIS "R G B" (rgb(var(--x) / <alpha-value>))
        // — obrigatório para os modificadores de opacidade do Tailwind funcionarem
        // (bg-brand-lime/10, text-text-secondary/60, etc.). As vars vivem em
        // globals.css (:root = dark; [data-theme=academia] = claro).
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          border: 'rgb(var(--color-surface-border) / <alpha-value>)',
          // Segunda camada neutra (sidebar/painéis) — dá profundidade em vez de
          // branco chapado.
          2: 'rgb(var(--color-surface-2) / <alpha-value>)',
        },
        brand: {
          // --brand-lime-rgb (canais) é injetado inline pelo layout = primary_color
          // do tenant, então o accent respeita o white-label e aceita opacidade.
          lime: 'rgb(var(--brand-lime-rgb) / <alpha-value>)',
          // brand-dark é usado só sólido (sem opacidade) — mantém o hex/color-mix.
          dark: 'var(--brand-lime-deep, #C8E600)',
        },
        max: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        status: {
          // No tema academia (claro) usam tonalidades mais escuras da mesma cor
          // para contraste AA em texto/ícone sobre tint.
          success: 'rgb(var(--color-status-success) / <alpha-value>)',
          error: 'rgb(var(--color-status-error) / <alpha-value>)',
          warning: 'rgb(var(--color-status-warning) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-syncopate)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [animate],
}

export default config
