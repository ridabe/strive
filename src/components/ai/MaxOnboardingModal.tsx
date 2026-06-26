'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, EyeOff, ArrowRight, Zap, MessageSquare, CheckCircle, User } from 'lucide-react'

const MAX_COLOR = '#7C3AED'
const STORAGE_PREFIX = 'max_onboarding_seen_'

const DESCRIPTION =
  'Olá! Sou a Max Strive — sua nova parceira de inteligência artificial.\n\n' +
  'Fui criada para ajudar você a treinar seus alunos com mais inteligência, ' +
  'velocidade e personalização. Vou analisar dados, criar planos e sugerir ' +
  'estratégias em segundos.'

const STEPS = [
  {
    icon: User,
    label: 'Abra o perfil de um aluno e clique em "Consultar Max Strive IA"',
  },
  {
    icon: Zap,
    label: 'Escolha uma ação: gerar treino, analisar progresso, sugerir cargas ou motivar',
  },
  {
    icon: MessageSquare,
    label: 'Use o chat para conversar livremente e personalizar ainda mais',
  },
  {
    icon: CheckCircle,
    label: 'Planos gerados são salvos automaticamente no perfil do aluno',
  },
]

interface Props {
  userId: string
}

export function MaxOnboardingModal({ userId }: Props) {
  const [open, setOpen]               = useState(false)
  const [typedText, setTypedText]     = useState('')
  const [typingDone, setTypingDone]   = useState(false)
  const [shownSteps, setShownSteps]   = useState(0)
  const hasChecked                    = useRef(false)

  // ── Check localStorage ────────────────────────────────────────────────────
  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true
    const seen = localStorage.getItem(STORAGE_PREFIX + userId)
    if (!seen) setOpen(true)
  }, [userId])

  // ── Typewriter ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    let index = 0
    const id = setInterval(() => {
      if (index < DESCRIPTION.length) {
        setTypedText(DESCRIPTION.slice(0, index + 1))
        index++
      } else {
        clearInterval(id)
        setTimeout(() => setTypingDone(true), 400)
      }
    }, 20)
    return () => clearInterval(id)
  }, [open])

  // ── Steps cascade ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!typingDone) return
    let count = 0
    const showNext = () => {
      if (count >= STEPS.length) return
      count++
      setShownSteps(count)
      setTimeout(showNext, 220)
    }
    setTimeout(showNext, 300)
  }, [typingDone])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleNeverAgain() {
    localStorage.setItem(STORAGE_PREFIX + userId, '1')
    setOpen(false)
  }

  function handleDismissSession() {
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border overflow-hidden"
        style={{
          background: 'var(--bg-surface, #111)',
          borderColor: `${MAX_COLOR}44`,
          boxShadow: `0 0 80px ${MAX_COLOR}22, 0 24px 48px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismissSession}
          className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-border/50 transition-all"
        >
          <X size={14} />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-2 flex flex-col items-center">

          {/* Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase mb-5"
            style={{ color: MAX_COLOR, borderColor: `${MAX_COLOR}30`, background: `${MAX_COLOR}10` }}
          >
            <Zap size={10} />
            Novo módulo disponível
          </div>

          {/* Avatar */}
          <div className="relative w-32 h-32 mb-5 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${MAX_COLOR}25 0%, transparent 70%)` }}
            />
            <div
              className="absolute w-28 h-28 rounded-full border"
              style={{ borderColor: `${MAX_COLOR}25`, background: `${MAX_COLOR}10` }}
            />
            <div
              className="absolute w-24 h-24 rounded-full"
              style={{ background: `${MAX_COLOR}15` }}
            />
            <Image
              src="/max-avatar.png"
              alt="Max Strive IA"
              width={96}
              height={96}
              className="relative z-10 object-contain"
              style={{ filter: `drop-shadow(0 0 16px ${MAX_COLOR}60)` }}
            />
          </div>

          {/* Title */}
          <h2
            className="font-display text-2xl font-bold uppercase tracking-widest text-center text-text-primary"
          >
            Conheça a Max
          </h2>
          <p
            className="text-xs font-semibold uppercase tracking-widest text-center mt-1 mb-5"
            style={{ color: MAX_COLOR }}
          >
            Assistente de IA para te auxiliar no treinamento de alunos.
          </p>

          {/* Terminal box — typewriter */}
          <div
            className="w-full rounded-xl border overflow-hidden mb-5"
            style={{ borderColor: `${MAX_COLOR}20`, background: 'var(--bg-background, #0a0a0f)' }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center gap-1.5 px-3.5 py-2.5 border-b"
              style={{ borderColor: `${MAX_COLOR}15`, background: `${MAX_COLOR}06` }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-2 text-[10px] text-text-secondary/50 font-mono">
                max@strive ~ assistente-ia
              </span>
            </div>
            {/* Terminal text */}
            <p className="p-4 text-sm text-text-primary leading-relaxed font-mono whitespace-pre-wrap">
              {typedText}
              {!typingDone && (
                <span className="inline-block w-[9px] h-[15px] ml-0.5 align-middle animate-[maxCursor_0.9s_step-end_infinite]"
                  style={{ background: MAX_COLOR }}
                />
              )}
            </p>
          </div>

          {/* Steps — apenas os já revelados são montados no DOM */}
          {shownSteps > 0 && (
            <div className="w-full mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-3">
                Como usar
              </p>
              <div className="space-y-2.5">
                {STEPS.slice(0, shownSteps).map((step, idx) => {
                  const Icon = step.icon
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 animate-[maxSlideIn_0.3s_ease-out]"
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: `${MAX_COLOR}20`, color: MAX_COLOR }}
                      >
                        {idx + 1}
                      </span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border"
                        style={{
                          background: `${MAX_COLOR}10`,
                          borderColor: `${MAX_COLOR}25`,
                          color: MAX_COLOR,
                        }}
                      >
                        <Icon size={13} />
                      </div>
                      <p className="text-sm text-text-primary leading-snug flex-1 pt-0.5">
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-surface-border bg-surface">
          <button
            type="button"
            onClick={handleNeverAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-surface-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-surface-border/80 transition-all"
          >
            <EyeOff size={13} />
            Não mostrar mais
          </button>
          <button
            type="button"
            onClick={handleDismissSession}
            className="flex-[1.4] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: MAX_COLOR }}
          >
            Explorar agora
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
