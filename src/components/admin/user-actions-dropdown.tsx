'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, KeyRound, Ban, UserCheck,
  Trash2, Loader2, Copy, Check, Mail, UserCog, ArrowRightLeft,
} from 'lucide-react'
import type { TenantOption, UserRow } from '@/app/(admin)/admin/usuarios/page'
import {
  suspendUser,
  activateUser,
  resetUserPassword,
  deleteUser,
  regularizeStudentAccess,
  resendStudentAccess,
  reassignStudentTenant,
  updateStudentRecordStatus,
} from '@/app/actions/users'

interface Props {
  user: UserRow
  tenants: TenantOption[]
}

type Modal = 'suspend' | 'activate' | 'reset' | 'delete' | 'regularize' | 'resend' | 'reassign' | 'deactivate-student' | 'activate-student' | null

/**
 * Renderiza as ações administrativas do admin global, inclusive para alunos órfãos.
 */
export function UserActionsDropdown({ user, tenants }: Props) {
  const router     = useRouter()
  const [open, setOpen]       = useState(false)
  const [modal, setModal]     = useState<Modal>(null)
  const [error, setError]     = useState<string | null>(null)
  const [tempPwd, setTempPwd] = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState(user.tenant_id ?? tenants[0]?.id ?? '')
  const [sendInviteOnRegularize, setSendInviteOnRegularize] = useState(true)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)
  const targetUserId = user.auth_user_id
  const targetStudentId = user.student_id
  const displayName = user.full_name ?? user.email ?? 'Usuário'

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    setSelectedTenantId(user.tenant_id ?? tenants[0]?.id ?? '')
  }, [tenants, user.tenant_id])

  /**
   * Fecha o modal atual e limpa estados transitórios da ação anterior.
   */
  function closeModal() {
    setModal(null)
    setError(null)
    setTempPwd(null)
    setCopied(false)
  }

  /**
   * Executa uma server action e força atualização da lista após a conclusão.
   */
  function run(fn: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  /**
   * Suspende um usuário que já possui conta de acesso ativa.
   */
  async function handleSuspend() {
    if (!targetUserId) return
    run(async () => {
      const r = await suspendUser(targetUserId)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  /**
   * Reativa um usuário previamente suspenso.
   */
  async function handleActivate() {
    if (!targetUserId) return
    run(async () => {
      const r = await activateUser(targetUserId)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  /**
   * Gera uma nova senha temporária para uma conta já regularizada.
   */
  async function handleReset() {
    if (!targetUserId) return
    run(async () => {
      const r = await resetUserPassword(targetUserId)
      if (r.error) { setError(r.error); return }
      if (r.tempPassword) setTempPwd(r.tempPassword)
    })
  }

  /**
   * Remove permanentemente a conta autenticável do usuário.
   */
  async function handleDelete() {
    if (!targetUserId) return
    run(async () => {
      const r = await deleteUser(targetUserId)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  /**
   * Regulariza um aluno órfão criando ou recompondo seu acesso no auth/perfil.
   */
  async function handleRegularize() {
    if (!targetStudentId || !selectedTenantId) return
    run(async () => {
      const r = await regularizeStudentAccess({
        studentId: targetStudentId,
        tenantId: selectedTenantId,
        sendInvite: sendInviteOnRegularize,
      })
      if (r.error) { setError(r.error); return }
      if (r.tempPassword) setTempPwd(r.tempPassword)
      else closeModal()
    })
  }

  /**
   * Reenvia o acesso do aluno com uma nova senha temporária por e-mail.
   */
  async function handleResendAccess() {
    if (!targetStudentId) return
    run(async () => {
      const r = await resendStudentAccess(targetStudentId)
      if (r.error) { setError(r.error); return }
      if (r.tempPassword) setTempPwd(r.tempPassword)
    })
  }

  /**
   * Reatribui o aluno para outro tenant/personal no contexto do admin global.
   */
  async function handleReassignTenant() {
    if (!targetStudentId || !selectedTenantId) return
    run(async () => {
      const r = await reassignStudentTenant(targetStudentId, selectedTenantId)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  /**
   * Ativa ou inativa o cadastro auxiliar do aluno quando ele ainda não tem conta válida.
   */
  async function handleStudentStatus(status: 'active' | 'inactive') {
    if (!targetStudentId) return
    run(async () => {
      const r = await updateStudentRecordStatus(targetStudentId, status)
      if (r.error) { setError(r.error); return }
      closeModal()
    })
  }

  /**
   * Copia a senha temporária exibida após reset, regularização ou reenvio.
   */
  function copyPwd() {
    if (!tempPwd) return
    navigator.clipboard.writeText(tempPwd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isSuspended = user.status === 'suspended'
  const canManageAuth = user.is_manageable && !!targetUserId
  const canManageStudent = user.role === 'student' && !!targetStudentId
  const showRegularize = canManageStudent && user.account_state !== 'managed'
  const showResendAccess = canManageStudent && user.account_state === 'managed'
  const showReassign = canManageStudent
  const showStudentDeactivate = canManageStudent && user.account_state !== 'managed' && user.status === 'active'
  const showStudentActivate = canManageStudent && user.account_state !== 'managed' && user.status === 'inactive'
  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId)

  if (!canManageAuth && !canManageStudent) {
    return <span className="text-xs text-text-secondary/60">Sem ações</span>
  }

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
          <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-surface border border-surface-border rounded-xl shadow-xl py-1 overflow-hidden">
            {showRegularize && (
              <button
                onClick={() => { setModal('regularize'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
              >
                <UserCog size={14} /> Regularizar acesso
              </button>
            )}

            {showResendAccess && (
              <button
                onClick={() => { setModal('resend'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
              >
                <Mail size={14} /> Reenviar acesso
              </button>
            )}

            {showReassign && (
              <button
                onClick={() => { setModal('reassign'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
              >
                <ArrowRightLeft size={14} /> Vincular personal
              </button>
            )}

            {canManageAuth && (
              <button
                onClick={() => { setModal('reset'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
              >
                <KeyRound size={14} /> Resetar senha
              </button>
            )}

            {showStudentActivate && (
              <button
                onClick={() => { setModal('activate-student'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-success hover:bg-background transition-colors"
              >
                <UserCheck size={14} /> Reativar cadastro
              </button>
            )}

            {showStudentDeactivate && (
              <button
                onClick={() => { setModal('deactivate-student'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-warning hover:bg-background transition-colors"
              >
                <Ban size={14} /> Desativar cadastro
              </button>
            )}

            {canManageAuth && (isSuspended ? (
              <button
                onClick={() => { setModal('activate'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-success hover:bg-background transition-colors"
              >
                <UserCheck size={14} /> Reativar conta
              </button>
            ) : (
              <button
                onClick={() => { setModal('suspend'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-warning hover:bg-background transition-colors"
              >
                <Ban size={14} /> Desativar conta
              </button>
            ))}

            {canManageAuth && <div className="border-t border-surface-border my-1" />}

            {canManageAuth && (
              <button
                onClick={() => { setModal('delete'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-error hover:bg-background transition-colors"
              >
                <Trash2 size={14} /> Deletar usuário
              </button>
            )}
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
                  <span className="text-text-primary font-medium">{displayName}</span> perderá acesso imediatamente.
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
                  <span className="text-text-primary font-medium">{displayName}</span> poderá acessar a plataforma novamente.
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
                      Nova senha temporária para <span className="text-text-primary font-medium">{displayName}</span>:
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
                      <span className="text-text-primary font-medium">{displayName}</span>.
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

            {/* Regularizar acesso */}
            {modal === 'regularize' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Regularizar acesso</h3>
                {tempPwd ? (
                  <>
                    <p className="text-sm text-text-secondary mb-3">
                      A conta foi regularizada para <span className="text-text-primary font-medium">{displayName}</span>.
                    </p>
                    <div className="flex items-center gap-2 bg-background border border-surface-border rounded-lg px-3 py-2.5 mb-2">
                      <code className="flex-1 text-brand-lime font-mono text-sm tracking-wider">{tempPwd}</code>
                      <button onClick={copyPwd} className="text-text-secondary hover:text-brand-lime transition-colors">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary mb-6">Guarde a senha provisória caso precise informar manualmente ao aluno.</p>
                    <div className="flex justify-end">
                      <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-brand-lime text-black text-sm font-semibold hover:bg-brand-lime/90 transition-colors">
                        Fechar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary mb-4">
                      Isso cria ou recompõe o acesso do aluno no auth e no perfil, mantendo o vínculo com o personal selecionado.
                    </p>
                    <label className="block text-xs text-text-secondary uppercase tracking-wider mb-1">Personal / Cliente</label>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                      className="w-full text-sm bg-background border border-surface-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-lime/50 mb-3"
                    >
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.business_name}{tenant.personal_name ? ` - ${tenant.personal_name}` : ''}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-start gap-3 text-sm text-text-secondary mb-4">
                      <input
                        type="checkbox"
                        checked={sendInviteOnRegularize}
                        onChange={(e) => setSendInviteOnRegularize(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border border-surface-border accent-brand-lime"
                      />
                      <span>Enviar credenciais por e-mail com senha provisória.</span>
                    </label>
                    {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                    <div className="flex gap-3 justify-end">
                      <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                      <button
                        onClick={handleRegularize}
                        disabled={isPending || !selectedTenantId}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-black text-sm font-semibold hover:bg-brand-lime/90 disabled:opacity-60 transition-colors"
                      >
                        {isPending && <Loader2 size={14} className="animate-spin" />}
                        Regularizar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Reenviar acesso */}
            {modal === 'resend' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Reenviar acesso</h3>
                {tempPwd ? (
                  <>
                    <p className="text-sm text-text-secondary mb-3">
                      Nova senha provisória gerada para <span className="text-text-primary font-medium">{displayName}</span>.
                    </p>
                    <div className="flex items-center gap-2 bg-background border border-surface-border rounded-lg px-3 py-2.5 mb-2">
                      <code className="flex-1 text-brand-lime font-mono text-sm tracking-wider">{tempPwd}</code>
                      <button onClick={copyPwd} className="text-text-secondary hover:text-brand-lime transition-colors">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary mb-6">O e-mail de acesso foi reenviado com a senha acima.</p>
                    <div className="flex justify-end">
                      <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-brand-lime text-black text-sm font-semibold hover:bg-brand-lime/90 transition-colors">
                        Fechar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary mb-6">
                      Uma nova senha temporária será gerada e enviada por e-mail para <span className="text-text-primary font-medium">{displayName}</span>.
                    </p>
                    {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                    <div className="flex gap-3 justify-end">
                      <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                      <button
                        onClick={handleResendAccess}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-black text-sm font-semibold hover:bg-brand-lime/90 disabled:opacity-60 transition-colors"
                      >
                        {isPending && <Loader2 size={14} className="animate-spin" />}
                        Reenviar acesso
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Vincular personal */}
            {modal === 'reassign' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Vincular a um personal</h3>
                <p className="text-sm text-text-secondary mb-4">
                  O aluno ficará vinculado ao tenant selecionado. No sistema isso define o personal responsável.
                </p>
                <label className="block text-xs text-text-secondary uppercase tracking-wider mb-1">Destino</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full text-sm bg-background border border-surface-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-lime/50 mb-3"
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.business_name}{tenant.personal_name ? ` - ${tenant.personal_name}` : ''}
                    </option>
                  ))}
                </select>
                {selectedTenant && (
                  <p className="text-xs text-text-secondary mb-4">
                    Destino atual: <span className="text-text-primary">{selectedTenant.business_name}</span>
                    {selectedTenant.personal_name ? ` (${selectedTenant.personal_name})` : ''}
                  </p>
                )}
                {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                  <button
                    onClick={handleReassignTenant}
                    disabled={isPending || !selectedTenantId}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-black text-sm font-semibold hover:bg-brand-lime/90 disabled:opacity-60 transition-colors"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Vincular
                  </button>
                </div>
              </>
            )}

            {/* Desativar cadastro */}
            {modal === 'deactivate-student' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Desativar cadastro</h3>
                <p className="text-sm text-text-secondary mb-6">
                  <span className="text-text-primary font-medium">{displayName}</span> ficará inativo no cadastro até ser reativado novamente.
                </p>
                {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                  <button
                    onClick={() => handleStudentStatus('inactive')}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-warning/10 text-status-warning border border-status-warning/20 text-sm font-semibold hover:bg-status-warning/20 disabled:opacity-60 transition-colors"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Desativar
                  </button>
                </div>
              </>
            )}

            {/* Reativar cadastro */}
            {modal === 'activate-student' && (
              <>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Reativar cadastro</h3>
                <p className="text-sm text-text-secondary mb-6">
                  <span className="text-text-primary font-medium">{displayName}</span> voltará ao status ativo no cadastro.
                </p>
                {error && <p className="text-sm text-status-error mb-4">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancelar</button>
                  <button
                    onClick={() => handleStudentStatus('active')}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-status-success/10 text-status-success border border-status-success/20 text-sm font-semibold hover:bg-status-success/20 disabled:opacity-60 transition-colors"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Reativar
                  </button>
                </div>
              </>
            )}

            {/* Deletar */}
            {modal === 'delete' && (
              <>
                <h3 className="font-display text-lg font-bold text-status-error mb-2">Deletar usuário?</h3>
                <p className="text-sm text-text-secondary mb-1">
                  Você está prestes a deletar permanentemente{' '}
                  <span className="text-text-primary font-medium">{displayName}</span>.
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
