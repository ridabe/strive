import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { changePassword } from '@/app/actions/password'
import { LogoVertical } from '@/components/logo'
import { AuthSubmitButton } from '@/components/auth/submit-button'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default async function AlterarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params  = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('must_change_password, role')
    .eq('id', user.id)
    .single()

  const isFirstAccess = profile?.must_change_password === true

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-base">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <LogoVertical size="md" glow />
        </div>

        <div className="bg-surface rounded-xl border border-surface-border p-8 space-y-6">

          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck size={18} className="text-brand-lime" />
            </div>
            <div>
              <h1 className="font-body font-semibold text-text-primary text-lg">
                {isFirstAccess ? 'Crie sua nova senha' : 'Alterar senha'}
              </h1>
              <p className="text-text-secondary text-sm mt-0.5">
                {isFirstAccess
                  ? 'Este é seu primeiro acesso. Defina uma senha pessoal para continuar.'
                  : 'Escolha uma nova senha para sua conta.'}
              </p>
            </div>
          </div>

          {/* Aviso — só no primeiro acesso */}
          {isFirstAccess && (
            <div className="bg-brand-lime/5 border border-brand-lime/20 rounded-lg px-4 py-3">
              <p className="text-xs text-brand-lime font-medium">
                Sua senha provisória será invalidada após esta etapa.
              </p>
            </div>
          )}

          {/* Erro */}
          {params.error && (
            <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm px-4 py-3 rounded-lg">
              {params.error}
            </div>
          )}

          {/* Formulário */}
          {/* Botão voltar — só para quem não está em primeiro acesso */}
          {!isFirstAccess && (
            <Link
              href="/dashboard/ajustes"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar para Ajustes
            </Link>
          )}

          <form action={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new_password" className="block text-sm font-body font-medium text-text-secondary">
                Nova senha
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm_password" className="block text-sm font-body font-medium text-text-secondary">
                Confirmar nova senha
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="mt-1 w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-lime text-background font-body font-semibold py-2.5 rounded-lg hover:bg-brand-lime/90 transition-colors"
            >
              Alterar senha
            </button>

            {!isFirstAccess && (
              <div className="text-center">
                <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  ← Voltar ao painel
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
