import type { Metadata } from 'next'
import { Syncopate, DM_Sans } from 'next/font/google'
import './globals.css'

const syncopate = Syncopate({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-syncopate',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Strive Personal — Evolução que você vê',
  description: 'A plataforma completa para personal trainers gerenciarem alunos, prescreverem treinos e acompanharem resultados em tempo real.',
  openGraph: {
    title: 'Strive Personal',
    description: 'Evolução que você vê.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${syncopate.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
