'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function StudentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[StudentDetailError]', error)
  }, [error])

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <Link
        href="/dashboard/alunos"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Alunos
      </Link>

      <div className="bg-surface border border-red-500/20 rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle size={22} className="text-red-400" />
        </div>
        <div>
          <p className="font-body font-semibold text-text-primary">
            Erro ao carregar ficha do aluno
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {error.message || 'Ocorreu um erro inesperado.'}
          </p>
          {error.digest && (
            <p className="text-xs text-text-secondary/50 mt-1 font-mono">
              {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-wider hover:bg-brand-lime/90 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
