'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarClock, X, XCircle, CalendarCheck } from 'lucide-react'

interface Props {
  pendingCount:   number
  rejectedCount:  number
  confirmedCount: number
  latestNoticeAt: string | null
}

const STORAGE_KEY = 'student-agenda-last-seen-notice-at'

/**
 * Persiste localmente a ultima notificacao de agenda visualizada pelo aluno.
 */
function markAgendaNoticeAsSeen(value: string | null) {
  if (!value || typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, value)
}

/**
 * Exibe o banner superior da agenda apenas enquanto houver atualizacao
 * ainda nao visualizada pelo aluno.
 */
export function StudentAgendaBanner({ pendingCount, rejectedCount, confirmedCount, latestNoticeAt }: Props) {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setDismissed(false)
    if (pendingCount === 0 && rejectedCount === 0 && confirmedCount === 0) {
      setIsVisible(false)
      return
    }

    if (!latestNoticeAt || typeof window === 'undefined') {
      setIsVisible(true)
      return
    }

    const lastSeen = window.localStorage.getItem(STORAGE_KEY)
    setIsVisible(!lastSeen || lastSeen < latestNoticeAt)
  }, [latestNoticeAt, pendingCount, rejectedCount, confirmedCount])

  useEffect(() => {
    if (pathname !== '/student/agenda' || !latestNoticeAt) return
    markAgendaNoticeAsSeen(latestNoticeAt)
    setIsVisible(false)
    setDismissed(true)
  }, [latestNoticeAt, pathname])

  if ((pendingCount === 0 && rejectedCount === 0 && confirmedCount === 0) || !isVisible || dismissed) return null

  return (
    <div>
      {confirmedCount > 0 && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <CalendarCheck size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300">
              {confirmedCount === 1
                ? '1 solicitação de aula foi confirmada pelo seu personal.'
                : `${confirmedCount} solicitações foram confirmadas pelo seu personal.`}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              href="/student/agenda"
              onClick={() => markAgendaNoticeAsSeen(latestNoticeAt)}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap border border-emerald-500/30 rounded-lg px-2.5 py-1 flex-shrink-0"
            >
              Ver Agenda →
            </Link>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => {
                markAgendaNoticeAsSeen(latestNoticeAt)
                setDismissed(true)
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {pendingCount > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <CalendarClock size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300">
              {pendingCount === 1
                ? '1 solicitação de aula aguardando confirmação do seu personal.'
                : `${pendingCount} solicitações aguardando confirmação do seu personal.`}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              href="/student/agenda"
              onClick={() => markAgendaNoticeAsSeen(latestNoticeAt)}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap border border-amber-500/30 rounded-lg px-2.5 py-1 flex-shrink-0"
            >
              Ver Agenda →
            </Link>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => {
                markAgendaNoticeAsSeen(latestNoticeAt)
                setDismissed(true)
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {rejectedCount > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              {rejectedCount === 1
                ? '1 solicitação de aula não foi confirmada pelo personal.'
                : `${rejectedCount} solicitações não foram confirmadas pelo personal.`}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              href="/student/agenda"
              onClick={() => markAgendaNoticeAsSeen(latestNoticeAt)}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors whitespace-nowrap border border-red-500/30 rounded-lg px-2.5 py-1 flex-shrink-0"
            >
              Ver Agenda →
            </Link>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => {
                markAgendaNoticeAsSeen(latestNoticeAt)
                setDismissed(true)
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
