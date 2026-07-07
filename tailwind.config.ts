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
        background: 'var(--color-bg, #0E0E1A)',
        surface: {
          DEFAULT: 'var(--color-surface, #1A1A2E)',
          border: 'var(--color-surface-border, #2A2A45)',
          // Segunda camada neutra (sidebar/painéis) — levemente distinta da
          // superfície dos cards, para dar profundidade em vez de branco chapado.
          2: 'var(--color-surface-2, #1A1A2E)',
        },
        brand: {
          // --brand-lime é injetado inline pelo layout = primary_color do tenant
          // (default #E8FF47), então o accent passa a respeitar o white-label.
          lime: 'var(--brand-lime, #E8FF47)',
          dark: 'var(--brand-lime-deep, #C8E600)',
        },
        max: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
        },
        text: {
          primary: 'var(--color-text-primary, #FFFFFF)',
          secondary: 'var(--color-text-secondary, #B0B0C3)',
          inverse: 'var(--color-text-inverse, #000000)',
        },
        status: {
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
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
