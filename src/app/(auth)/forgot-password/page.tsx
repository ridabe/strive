import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { requestPasswordReset } from '@/app/actions/password'
import { LogoVertical } from '@/components/logo'
import { AuthSubmitButton } from '@/components/auth/submit-button'

/**
 * Renderiza a tela pública para solicitar o envio do e-mail de recuperação.
 */
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; sent?: string }>
}) {
  const params = await searchParams
  const hasSuccessMessage = params.sent === '1' && !!params.message

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-base">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <LogoVertical size="md" glow />
        </div>

        <div className="bg-surface rounded-xl border border-surface-border p-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail size={18} className="text-brand-lime" />
            </div>
            <div>
              <h1 className="font-body font-semibold text-text-primary text-xl">
                Recuperar senha
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Informe seu e-mail para receber o link de redefinição.
              </p>
            </div>
          </div>

          {params.error && (
            <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm px-4 py-3 rounded-lg">
              {params.error}
            </div>
          )}

          {params.message && (
            <div className="bg-status-success/10 border border-status-success/30 text-status-success text-sm px-4 py-3 rounded-lg">
              {params.message}
            </div>
          )}

          {hasSuccessMessage ? (
            <div className="space-y-4">
              <div className="bg-background border border-surface-border rounded-lg px-4 py-3">
                <p className="text-sm text-text-secondary">
                  Verifique sua caixa de entrada e também a pasta de spam. O link recebido abrirá a etapa final para redefinir sua senha.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="block w-full text-center font-body font-medium text-sm text-text-primary border border-surface-border rounded-lg px-4 py-3 hover:border-brand-lime/40 hover:text-brand-lime transition-colors"
              >
                Usar outro e-mail
              </Link>
            </div>
          ) : (
            <form action={requestPasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-body font-medium text-text-secondary"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@exemplo.com"
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
                />
              </div>

              <AuthSubmitButton label="Enviar link" loadingLabel="Enviando..." />
            </form>
          )}

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
