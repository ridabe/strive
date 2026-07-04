'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { LogoVertical } from '@/components/logo'
import { createClient } from '@/lib/supabase/client'

/**
 * Traduz erros de callback do Supabase para mensagens mais úteis ao usuário.
 */
function mapRecoveryError(params: URLSearchParams): string | null {
  const errorCode = params.get('error_code')
  const errorDescription = params.get('error_description')
  const error = params.get('error')

  if (errorCode === 'otp_expired' || error === 'access_denied') {
    return 'Este link de recuperação expirou, já foi usado ou foi invalidado antes da confirmação. Solicite um novo e-mail para continuar.'
  }

  if (errorDescription) {
    return decodeURIComponent(errorDescription.replaceAll('+', ' '))
  }

  if (error) {
    return decodeURIComponent(error.replaceAll('+', ' '))
  }

  return null
}

/**
 * Exibe a etapa intermediária do reset e só confirma o token após a ação explícita do usuário.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'error'>('loading')
  const [message, setMessage] = useState('Preparando a redefinição da sua senha...')
  const [continueUrl, setContinueUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    /**
     * Prepara o fluxo de recuperação suportando o fluxo novo e também links antigos.
     */
    async function handleRecovery() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashErrorMessage = mapRecoveryError(hashParams)
      if (hashErrorMessage) {
        if (!isMounted) return
        setStatus('error')
        setMessage(hashErrorMessage)
        return
      }

      const queryErrorMessage = mapRecoveryError(new URLSearchParams(searchParams.toString()))
      if (queryErrorMessage) {
        if (!isMounted) return
        setStatus('error')
        setMessage(queryErrorMessage)
        return
      }

      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const nextPath = searchParams.get('next') ?? '/alterar-senha'

      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        router.replace('/alterar-senha')
        return
      }

      if (tokenHash && type) {
        if (!isMounted) return
        setContinueUrl(
          `/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}` +
          `&type=${encodeURIComponent(type)}` +
          `&next=${encodeURIComponent(nextPath)}`
        )
        setStatus('ready')
        setMessage('Seu link foi recebido. Clique abaixo para continuar com a redefinição da senha.')
        return
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          router.replace('/alterar-senha')
        }
      })

      window.setTimeout(async () => {
        const { data: latestSession } = await supabase.auth.getSession()
        if (latestSession.session) {
          router.replace('/alterar-senha')
          return
        }

        if (!isMounted) return
        setStatus('error')
        setMessage('O link de recuperação é inválido ou expirou. Solicite um novo e-mail para continuar.')
      }, 1500)

      return () => {
        authListener.subscription.unsubscribe()
      }
    }

    const cleanupPromise = handleRecovery()

    return () => {
      isMounted = false
      void cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [router, searchParams, supabase])

  /**
   * Só confirma o token quando o usuário clica explicitamente na continuação do fluxo.
   */
  function handleContinue() {
    if (!continueUrl) return
    setStatus('submitting')
    setMessage('Validando seu link e abrindo a etapa final da redefinição...')
    window.location.assign(continueUrl)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-base">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <LogoVertical size="md" glow />
        </div>

        <div className="bg-surface rounded-xl border border-surface-border p-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck size={18} className="text-brand-lime" />
            </div>
            <div>
              <h1 className="font-body font-semibold text-text-primary text-xl">
                Recuperação de senha
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Estamos preparando a etapa final para você definir sua nova senha.
              </p>
            </div>
          </div>

          <div className={`rounded-lg px-4 py-3 text-sm border ${
            status === 'error'
              ? 'bg-status-error/10 border-status-error/30 text-status-error'
              : 'bg-brand-lime/10 border-brand-lime/20 text-brand-lime'
          }`}>
            <div className="flex items-center gap-2">
              {status === 'loading' || status === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{message}</span>
            </div>
          </div>

          {status === 'ready' && continueUrl && (
            <button
              type="button"
              onClick={handleContinue}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-lime px-4 py-3 text-sm font-semibold text-black hover:bg-brand-lime/90 transition-colors"
            >
              Continuar redefinição
            </button>
          )}

          {status === 'error' && (
            <p className="text-xs text-text-secondary">
              Se você abriu um e-mail antigo, encaminhado ou pré-visualizado pelo provedor, solicite um novo link para garantir um token válido.
            </p>
          )}

          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Solicitar novo link
          </Link>
        </div>
      </div>
    </div>
  )
}
