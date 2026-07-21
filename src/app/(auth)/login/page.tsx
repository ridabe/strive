import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { LogoVertical } from '@/components/logo'
import { AuthSubmitButton } from '@/components/auth/submit-button'
import { PasswordInput } from '@/components/auth/password-input'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-base">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <LogoVertical size="md" glow />
        </div>

        {/* Card */}
        <div className="bg-surface rounded-xl border border-surface-border p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="font-body font-semibold text-text-primary text-xl">
              Entrar na plataforma
            </h1>
            <p className="text-text-secondary text-sm">
              Acesse seu painel de gestão
            </p>
          </div>

          {/* Erros / mensagens */}
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

          {/* Formulário */}
          <form action={signIn} className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-body font-medium text-text-secondary"
                >
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-lime hover:text-brand-dark transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>

            <AuthSubmitButton label="Entrar" loadingLabel="Entrando..." />
          </form>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-text-secondary">
                Novo por aqui?
              </span>
            </div>
          </div>

          <Link
            href="/register"
            className="block w-full text-center font-body font-medium text-sm text-text-primary border border-surface-border rounded-lg px-4 py-3 hover:border-brand-lime/40 hover:text-brand-lime transition-colors"
          >
            Criar conta de Personal Trainer
          </Link>
        </div>

        <p className="text-center text-xs text-text-secondary/50 mt-6">
          © {new Date().getFullYear()} Strive Personal. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
