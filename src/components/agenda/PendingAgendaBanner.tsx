import Link from 'next/link'
import { CalendarClock } from 'lucide-react'

interface Props {
  count: number
}

export function PendingAgendaBanner({ count }: Props) {
  if (count === 0) return null

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <CalendarClock size={15} className="text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-300 truncate">
          {count === 1
            ? '1 solicitação de agendamento presencial aguardando confirmação.'
            : `${count} solicitações de agendamento presencial aguardando confirmação.`}
        </p>
      </div>
      <Link
        href="/dashboard/agenda"
        className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap border border-amber-500/30 rounded-lg px-2.5 py-1 flex-shrink-0"
      >
        Ver Agenda →
      </Link>
    </div>
  )
}
