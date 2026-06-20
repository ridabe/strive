import Link from 'next/link'
import { Utensils, ArrowLeft, Clock } from 'lucide-react'

export default function NutricaoPage() {
  return (
    <div className="p-5 md:p-8 space-y-6 max-w-lg">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center flex-shrink-0">
          <Utensils size={18} className="text-green-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Nutrição
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Plano alimentar e orientações nutricionais do seu personal.
          </p>
        </div>
      </div>

      {/* Coming soon card */}
      <div className="bg-surface border border-surface-border rounded-2xl p-10 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-green-400/10 border border-green-400/20 flex items-center justify-center">
          <Utensils size={28} className="text-green-400" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-display font-bold uppercase tracking-widest">
            <Clock size={11} />
            Em breve
          </div>
          <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
            Módulo em desenvolvimento
          </h2>
          <p className="text-sm text-text-secondary max-w-xs">
            Aqui você poderá acessar seu plano alimentar, receitas e orientações nutricionais enviadas pelo seu personal.
          </p>
        </div>

        <ul className="w-full max-w-xs space-y-2 text-left">
          {[
            'Plano alimentar personalizado',
            'Distribuição de macros',
            'Refeições e horários',
            'Orientações e dicas do personal',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400/50 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/student"
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar ao início
      </Link>
    </div>
  )
}
