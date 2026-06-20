import { redirect } from 'next/navigation'

// Modulo white-label foi integrado em /dashboard/ajustes
export default function ConfiguracoesPage() {
  redirect('/dashboard/ajustes#identidade-visual')
}
