'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2, RefreshCw, ShieldOff, ShieldCheck,
  AlertTriangle, Send, Loader2,
} from 'lucide-react'
import {
  deleteClient,
  suspendClient,
  activateClient,
  resendWelcomeEmail,
} from '@/app/actions/clients'

interface Props {
  tenantId: string
  tenantName: string
  status: 'active' | 'inactive' | 'suspended'
}

type Dialog = 'delete' | 'resend' | 'suspend' | null

export function ClientDetailActions({ tenantId, tenantName, status }: Props) {
  const router = useRouter()
  const [dialog, setDialog]       = useState<Dialog>(null)
  const [feedback, setFeedback]   = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function closeDialog() {
    setDialog(null)
    setFeedback(null)
  }

  async function handleDelete() {
    startTransition(async () => {
      await deleteClient(tenantId) // redireciona internamente
    })
  }

  async function handleResend() {
    startTransition(async () => {
      const result = await resendWelcomeEmail(tenantId)
      if (result?.error) {
        setFeedback(result.error)
      } else {
        setFeedback('E-mail enviado com sucesso!')
        setTimeout(closeDialog, 1500)
      }
    })
  }

  async function handleToggleStatus() {
    startTransition(async () => {
      const fn = status === 'active' ? suspendClient : activateClient
      const result = await fn(tenantId)
      if (result?.error) {
        setFeedback(result.error)
      } else {
        closeDialog()
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* Barra de ações */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Reenviar senha */}
        <button
          onClick={() => setDialog('resend')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors text-sm font-body"
        >
          <Send size={15} />
          Reenviar acesso
        </button>

        {/* Suspender / Ativar */}
        <button
          onClick={() => setDialog('suspend')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors text-sm font-body ${
            status === 'active'
              ? 'border-status-warning/30 text-status-warning hover:border-status-warning/60 hover:bg-status-warning/5'
              : 'border-status-success/30 text-status-success hover:border-status-success/60 hover:bg-status-success/5'
          }`}
        >
          {status === 'active'
            ? <><ShieldOff size={15} /> Suspender</>
            : <><ShieldCheck size={15} /> Reativar</>
          }
        </button>

        {/* Deletar */}
        <button
          onClick={() => setDialog('delete')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-status-error/30 text-status-error hover:border-status-error/60 hover:bg-status-error/5 transition-colors text-sm font-body"
        >
          <Trash2 size={15} />
          Deletar cliente
        </button>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && closeDialog()}
        >
          <div className="bg-surface border border-surface-border rounded-2xl p-6 w-full max-w-sm space-y-4">

            {/* ── Deletar ── */}
            {dialog === 'delete' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-status-error" />
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-text-primary">Deletar cliente</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      Isso removerá permanentemente <strong className="text-text-primary">{tenantName}</strong>,
                      todos os usuários e dados associados. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>

                {feedback && (
                  <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2">
                    {feedback}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeDialog}
                    disabled={isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-status-error text-white font-semibold text-sm hover:bg-status-error/80 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Deletar
                  </button>
                </div>
              </>
            )}

            {/* ── Reenviar ── */}
            {dialog === 'resend' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                    <RefreshCw size={18} className="text-brand-lime" />
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-text-primary">Reenviar acesso</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      Uma nova senha temporária será gerada e enviada por e-mail para{' '}
                      <strong className="text-text-primary">{tenantName}</strong>.
                      O cliente precisará alterar a senha no próximo login.
                    </p>
                  </div>
                </div>

                {feedback && (
                  <p className={`text-sm rounded-lg px-3 py-2 border ${
                    feedback.includes('sucesso')
                      ? 'text-status-success bg-status-success/10 border-status-success/20'
                      : 'text-status-error bg-status-error/10 border-status-error/20'
                  }`}>
                    {feedback}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeDialog}
                    disabled={isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Enviar
                  </button>
                </div>
              </>
            )}

            {/* ── Suspender / Reativar ── */}
            {dialog === 'suspend' && (
              <>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    status === 'active'
                      ? 'bg-status-warning/10 border border-status-warning/20'
                      : 'bg-status-success/10 border border-status-success/20'
                  }`}>
                    {status === 'active'
                      ? <ShieldOff size={18} className="text-status-warning" />
                      : <ShieldCheck size={18} className="text-status-success" />
                    }
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-text-primary">
                      {status === 'active' ? 'Suspender cliente' : 'Reativar cliente'}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {status === 'active'
                        ? `O acesso de "${tenantName}" será bloqueado. Os dados são preservados.`
                        : `O acesso de "${tenantName}" será restaurado.`}
                    </p>
                  </div>
                </div>

                {feedback && (
                  <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2">
                    {feedback}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeDialog}
                    disabled={isPending}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={isPending}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                      status === 'active'
                        ? 'bg-status-warning text-black hover:bg-status-warning/80'
                        : 'bg-status-success text-black hover:bg-status-success/80'
                    }`}
                  >
                    {isPending
                      ? <Loader2 size={14} className="animate-spin" />
                      : status === 'active' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />
                    }
                    {status === 'active' ? 'Suspender' : 'Reativar'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
