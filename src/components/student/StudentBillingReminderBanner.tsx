'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Wallet, AlertCircle, X } from 'lucide-react'

interface Props {
  pendingCount: number
  overdueCount: number
  totalOpen: number
}

/**
 * Lembrete de cobrança em aberto para o aluno.
 *
 * Diferente do StudentAgendaBanner, este NÃO persiste "visto" no localStorage
 * — o pedido é que o aluno seja avisado TODA VEZ que acessar o app/portal
 * enquanto houver cobrança pendente/atrasada, até que o personal dê baixa.
 * O botão de fechar só esconde o banner durante a sessão atual (state em
 * memória); ao recarregar a página ou abrir de novo, ele volta a aparecer
 * se a cobrança continuar em aberto.
 */
export function StudentBillingReminderBanner({ pendingCount, overdueCount, totalOpen }: Props) {
  const [dismissedThisSession, setDismissedThisSession] = useState(false)

  const totalCount = pendingCount + overdueCount
  if (totalCount === 0 || dismissedThisSession) return null

  const isOverdue = overdueCount > 0
  const amountLabel = `R$ ${totalOpen.toFixed(2).replace('.', ',')}`

  return (
    <div
      className={
        isOverdue
          ? 'bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
          : 'bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
      }
    >
      <div className="flex items-start gap-2 min-w-0">
        {isOverdue
          ? <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          : <Wallet size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />}
        <p className={isOverdue ? 'text-sm text-red-300' : 'text-sm text-amber-300'}>
          {isOverdue
            ? `Você tem ${overdueCount === 1 ? 'uma cobrança atrasada' : `${overdueCount} cobranças atrasadas`} (${amountLabel} em aberto).`
            : `Você tem ${pendingCount === 1 ? 'uma mensalidade pendente' : `${pendingCount} mensalidades pendentes`} (${amountLabel} em aberto).`}
        </p>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link
          href="/student/financeiro"
          className={
            isOverdue
              ? 'text-xs font-medium text-red-400 hover:text-red-300 transition-colors whitespace-nowrap border border-red-500/30 rounded-lg px-2.5 py-1 flex-shrink-0'
              : 'text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap border border-amber-500/30 rounded-lg px-2.5 py-1 flex-shrink-0'
          }
        >
          Ver Financeiro →
        </Link>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={() => setDismissedThisSession(true)}
          className={
            isOverdue
              ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors'
              : 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors'
          }
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
