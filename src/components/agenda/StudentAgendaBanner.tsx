import Link from 'next/link'
import { CalendarClock, XCircle } from 'lucide-react'

interface Props {
  pendingCount:  number
  rejectedCount: number
}

export function StudentAgendaBanner({ pendingCount, rejectedCount }: Props) {
  if (pendingCount === 0 && rejectedCount === 0) return null

  return (
    <div>
      {pendingCount > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarClock size={15} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300 truncate">
              {pendingCount === 1
                ? '1 solicitação de aula aguardando confirmação do seu personal.'
                : `${pendingCount} solicitações aguardando confirmação do seu personal.`}
            </p>
          </div>
          <Link
            href="/student/agenda"
            className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap border border-amber-500/30 rounded-lg px-2.5 py-1 flex-shrink-0"
          >
            Ver Agenda →
          </Link>
        </div>
      )}
      {rejectedCount > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <XCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 truncate">
              {rejectedCount === 1
                ? '1 solicitação de aula não foi confirmada pelo personal.'
                : `${rejectedCount} solicitações não foram confirmadas pelo personal.`}
            </p>
          </div>
          <Link
            href="/student/agenda"
            className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors whitespace-nowrap border border-red-500/30 rounded-lg px-2.5 py-1 flex-shrink-0"
          >
            Ver Agenda →
          </Link>
        </div>
      )}
    </div>
  )
}
