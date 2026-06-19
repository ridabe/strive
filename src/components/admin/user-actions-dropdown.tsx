'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, KeyRound, Ban, UserCheck,
  Trash2, Loader2, Copy, Check,
} from 'lucide-react'
import type { UserRow } from '@/app/(admin)/admin/usuarios/page'
import { suspendUser, activateUser, resetUserPassword, deleteUser } from '@/app/actions/users'

interface Props { user: UserRow }

type Modal = 'suspend' | 'activate' | 'reset' | 'delete' | null

export function UserActionsDropdown({ user }: Props) {
  const router     = useRouter()
  const [open, setOpen]       = useState(false)
  const [modal, setModal]     = useState<Modal>(null)
  const [error, setError]     = useState<string | null>(null)
  const [tempPwd, setTempPwd] = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function closeModal() {
    setModal(null)
    setError(null)
    setTempPwd(null)
    setCopied(false)
  }

  function run(fn: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  async function handleSuspend() {
    run(async () => {
      const r = await suspendUser(user.id)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  async function handleActivate() {
    run(async () => {
      const r = await activateUser(user.id)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  async function handleReset() {
    run(async () => {
      const r = await resetUserPassword(user.id)
      if (r.error) { setError(r.error); return }
      if (r.tempPassword) setTempPwd(r.tempPassword)
    })
  }

  async function handleDelete() {
    run(async () => {
      const r = await deleteUser(user.id)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  function copyPwd() {
    if (!tempPwd) return
    navigator.clipboard.writeText(tempPwd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isSuspended = user.status === 'suspended'

  return (
    <>
      {/* Trigger */}
      <div className="relative inline-block" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-surface border border-surface-border rounded-xl shadow-xl py-1 overflow-hidden">
            <button
              onClick={() => { setModal('reset'); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
            >
              <KeyRound size={14} /> Resetar senha
            </button>

            {isSuspended ? (
              <button
                onClick={() => { setModal('activate'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-success hover:bg-background transition-colors"
              >
                <UserCheck size={14} /> Reativar
              </button>
            ) : (
              <button
                onClick={() => { setModal('suspend'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-warning hover:bg-background transition-colors"
              >
                <Ban size={14} /> Suspender
              </button>
            )}

            <div className="border-t border-surface-border my-1" />

            <button
              onClick={() => { setModal('delete'); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-error hover:bg-background transition-colors"
            >
              <Trash2 size={14} /> Deletar usuário
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative bg-surface border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-2xl">

            {/* Suspender */}
            {modal === 'suspend' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Suspender usuário?</h3>
                <p className="text-sm text-text-secondary mb-1">
                  <span className="text-text-primary font-medium">{user.full_name ?? user.email}</span> perderá acesso imediatamente.
                </p>
                <p className="text-sm text-text-secondary mb-6">O acesso pode ser restaurado a qualquer momento.</p>
                {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                  <button
                    onClick={handleSuspend}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-warning/10 text-status-warning border border-status-warning/20 text-sm font-semibold hover:bg-status-warning/20 disabled:opacity-60 transition-colors"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Suspender
                  </button>
                </div>
              </>
            )}

            {/* Reativar */}
            {modal === 'activate' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Reativar usuário?</h3>
                <p className="text-sm text-text-secondary mb-6">
                  <span className="text-text-primary font-medium">{user.full_name ?? user.email}</span> poderá acessar a plataforma novamente.
                </p>
                {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                  <button
                    onClick={handleActivate}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-success/10 text-status-success border border-status-success/20 text-sm font-semibold hover:bg-status-success/20 disabled:opacity-60 transition-colors"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Reativar
                  </button>
                </div>
              </>
            )}

            {/* Resetar senha */}
            {modal === 'reset' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Resetar senha</h3>
                {tempPwd ? (
                  <>
                    <p className="text-sm text-text-secondary mb-3">
                      Nova senha temporária para <span className="text-text-primary font-medium">{user.full_name ?? user.email}</span>:
                    </p>
                    <div className="flex items-center gap-2 bg-background border border-surface-border rounded-lg px-3 py-2.5 mb-2">
                      <code className="flex-1 text-brand-lime font-mono text-sm tracking-wider">{tempPwd}</code>
                      <button onClick={copyPwd} className="text-text-secondary hover:text-brand-lime transition-colors">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary mb-6">O usuário deverá alterar a senha no primeiro acesso.</p>
                    <div className="flex justify-end">
                      <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-brand-lime text-black text-sm font-semibold hover:bg-brand-lime/90 transition-colors">
                        Fechar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary mb-6">
                      Uma senha temporária será gerada para{' '}
                      <span className="text-text-primary font-medium">{user.full_name ?? user.email}</span>.
                      O usuário deverá alterá-la no próximo acesso.
                    </p>
                    {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                    <div className="flex gap-3 justify-end">
                      <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                      <button
                        onClick={handleReset}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-black text-sm font-semibold hover:bg-brand-lime/90 disabled:opacity-60 transition-colors"
                      >
                        {isPending && <Loader2 size={14} className="animate-spin" />}
                        Gerar senha
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Deletar */}
            {modal === 'delete' && (
              <>
                <h3 className="font-display text-lg font-bold text-status-error mb-2">Deletar usuário?</h3>
                <p className="text-sm text-text-secondary mb-1">
                  Você está prestes a deletar permanentemente{' '}
                  <span className="text-text-primary font-medium">{user.full_name ?? user.email}</span>.
                </p>
                <p className="text-sm text-status-error/80 mb-6">Esta ação não pode ser desfeita.</p>
                {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-error text-white text-sm font-semibold hover:bg-status-error/90 disabled:opacity-60 transition-colors"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Deletar permanentemente
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
