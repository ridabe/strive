import Link from 'next/link'
import { signUpPersonal } from '@/app/actions/auth'
import { LogoVertical } from '@/components/logo'
import { AuthSubmitButton } from '@/components/auth/submit-button'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
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
              Criar conta de Personal
            </h1>
            <p className="text-text-secondary text-sm">
              Comece grátis — sem cartão de crédito
            </p>
          </div>

          {params.error && (
            <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm px-4 py-3 rounded-lg">
              {params.error}
            </div>
          )}

          <form action={signUpPersonal} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="full_name"
                className="block text-sm font-body font-medium text-text-secondary"
              >
                Seu nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder="João Silva"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="business_name"
                className="block text-sm font-body font-medium text-text-secondary"
              >
                Nome do seu negócio{' '}
                <span className="text-text-secondary/50">(opcional)</span>
              </label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                placeholder="Ex: João Silva Personal"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

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
              <label
                htmlFor="password"
                className="block text-sm font-body font-medium text-text-secondary"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

            <p className="text-xs text-text-secondary/60">
              Ao criar sua conta você concorda com os{' '}
              <Link href="/termos" className="text-brand-lime hover:underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" className="text-brand-lime hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>

            <AuthSubmitButton label="Criar minha conta" loadingLabel="Criando conta..." />
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-text-secondary">
                Já tem conta?
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="block w-full text-center font-body font-medium text-sm text-text-primary border border-surface-border rounded-lg px-4 py-3 hover:border-brand-lime/40 hover:text-brand-lime transition-colors"
          >
            Entrar
          </Link>
        </div>

        <p className="text-center text-xs text-text-secondary/50 mt-6">
          © {new Date().getFullYear()} Strive Personal. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
