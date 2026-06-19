import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Strive Personal',
  description: 'Plataforma de gestão para personal trainers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
