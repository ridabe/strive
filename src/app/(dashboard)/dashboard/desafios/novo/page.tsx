import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import { NovoDesafioForm } from './novo-desafio-form'

export default function NovoDesafioPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl">
      <Link
        href="/dashboard/desafios"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para Desafios
      </Link>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <Trophy size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Novo Desafio
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Defina as regras. Você adiciona os participantes no próximo passo.
          </p>
        </div>
      </div>

      <NovoDesafioForm />
    </div>
  )
}
