import type { Metadata } from 'next'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Strive Personal - Gestão de Personal Trainers',
  description: 'Plataforma SaaS para gerenciamento profissional de personal trainers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-light text-text">{children}</body>
    </html>
  )
}
