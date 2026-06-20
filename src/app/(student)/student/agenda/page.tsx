import Link from 'next/link'
import { Calendar, ArrowLeft, Clock } from 'lucide-react'

export default function AgendaPage() {
  return (
    <div className="p-5 md:p-8 space-y-6 max-w-lg">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center flex-shrink-0">
          <Calendar size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Agenda
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Agendamentos e horários com seu personal trainer.
          </p>
        </div>
      </div>

      {/* Coming soon card */}
      <div className="bg-surface border border-surface-border rounded-2xl p-10 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
          <Calendar size={28} className="text-violet-400" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-400 text-xs font-display font-bold uppercase tracking-widest">
            <Clock size={11} />
            Em breve
          </div>
          <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
            Módulo em desenvolvimento
          </h2>
          <p className="text-sm text-text-secondary max-w-xs">
            Aqui você poderá agendar sessões, visualizar horários disponíveis e confirmar compromissos com seu personal.
          </p>
        </div>

        <ul className="w-full max-w-xs space-y-2 text-left">
          {[
            'Agendar sessão com o personal',
            'Visualizar horários disponíveis',
            'Confirmação e lembretes',
            'Histórico de sessões',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50 flex-shrink-0" />
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
