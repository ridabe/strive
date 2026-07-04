'use client'

import Link from 'next/link'

/**
 * Renderiza uma fallback global para erros de runtime do App Router.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-text-primary">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-8 shadow-2xl">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-lime">
                Strive Personal
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-text-primary">
                Ocorreu um erro ao carregar esta tela
              </h1>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                A aplicação encontrou uma falha inesperada. Você pode tentar recarregar esta etapa
                ou voltar para o login.
              </p>
            </div>

            {error.message && (
              <div className="mb-6 rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3 text-sm text-status-error">
                {error.message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-lg bg-brand-lime px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-brand-lime/90"
              >
                Tentar novamente
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-surface-border px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-brand-lime/40 hover:text-brand-lime"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
