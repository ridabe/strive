import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#06B6D4',
        dark: '#18181B',
        light: '#F4F4F5',
        text: '#3F3F46',
      },
    },
  },
  plugins: [],
}
export default config
