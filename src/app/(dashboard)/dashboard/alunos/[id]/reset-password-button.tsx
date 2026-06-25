'use client'

import { useState } from 'react'
import { KeyRound, Loader2, Copy, Check } from 'lucide-react'
import { resetStudentPassword } from '@/actions/reset-student-password'

export function ResetPasswordButton({ studentId }: { studentId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleReset() {
    if (!confirm('Gerar nova senha provisória para este aluno?')) return
    setState('loading')
    const res = await resetStudentPassword(studentId)
    if (res.error) {
      setState('error')
    } else {
      setTempPassword(res.tempPassword ?? null)
      setState('done')
    }
  }

  async function handleCopy() {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleReset}
        disabled={state === 'loading'}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary border border-surface-border hover:border-brand-lime/30 rounded-lg px-3 py-2 transition-all disabled:opacity-50"
      >
        {state === 'loading'
          ? <Loader2 size={14} className="animate-spin" />
          : <KeyRound size={14} />}
        Gerar nova senha
      </button>

      {state === 'done' && tempPassword && (
        <div className="flex items-center gap-2 bg-brand-lime/10 border border-brand-lime/20 rounded-lg px-3 py-2">
          <code className="text-sm text-brand-lime font-mono flex-1">{tempPassword}</code>
          <button onClick={handleCopy} className="text-brand-lime hover:opacity-70 transition-opacity flex-shrink-0">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      {state === 'error' && (
        <p className="text-xs text-status-error">Erro ao gerar senha. Tente novamente.</p>
      )}
    </div>
  )
}
