'use client'

import { useEffect, useState } from 'react'
import { X, Share, PlusSquare, Smartphone } from 'lucide-react'

type DeviceType = 'ios' | 'android' | null

function detectDevice(): DeviceType {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) {
    return 'ios'
  }
  if (/Android/.test(ua)) return 'android'
  return null
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function IOSInstallPrompt() {
  const [device, setDevice] = useState<DeviceType>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const key = 'strive-pwa-prompt-dismissed'
    if (localStorage.getItem(key)) return
    if (isStandalone()) return

    const detected = detectDevice()
    if (detected === 'ios') {
      setDevice('ios')
      // Delay para não mostrar imediatamente ao abrir a página
      const timer = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss(permanent = false) {
    setVisible(false)
    setDismissed(true)
    if (permanent) {
      localStorage.setItem('strive-pwa-prompt-dismissed', '1')
    }
  }

  if (!visible || dismissed || device !== 'ios') return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => dismiss(false)}
    >
      <div
        className="w-full max-w-md mx-4 mb-4 rounded-2xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            {/* App icon mini */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl"
              style={{ backgroundColor: '#0E0E1A', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              S
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Strive Personal</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Adicione à tela de início
              </p>
            </div>
          </div>
          <button
            onClick={() => dismiss(true)}
            className="p-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <X size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-white text-sm font-medium mb-1">
            Use como um app nativo no seu iPhone
          </p>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Sem precisar baixar nada da App Store. Acesso rápido direto da tela inicial.
          </p>

          {/* Steps */}
          <div className="space-y-3">
            <Step
              number={1}
              icon={<Share size={18} color="#ffffff" />}
              text={
                <>
                  Toque no ícone{' '}
                  <span className="font-semibold text-white">Compartilhar</span>{' '}
                  <Share size={12} className="inline" color="#fff" />{' '}
                  na barra inferior do Safari
                </>
              }
            />
            <Step
              number={2}
              icon={<PlusSquare size={18} color="#ffffff" />}
              text={
                <>
                  Role a lista e toque em{' '}
                  <span className="font-semibold text-white">
                    &quot;Adicionar à Tela de Início&quot;
                  </span>
                </>
              }
            />
            <Step
              number={3}
              icon={<Smartphone size={18} color="#ffffff" />}
              text={
                <>
                  Confirme tocando em{' '}
                  <span className="font-semibold text-white">&quot;Adicionar&quot;</span>{' '}
                  — pronto, o app aparece na sua tela!
                </>
              }
            />
          </div>

          {/* Safari indicator */}
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ backgroundColor: '#006CFF', color: '#fff' }}
            >
              ⓢ
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Disponível apenas no{' '}
              <span className="text-white font-medium">Safari</span>. Se estiver em outro browser,
              abra este site no Safari primeiro.
            </p>
          </div>
        </div>

        {/* Arrow indicator pointing down to share button */}
        <div
          className="mx-5 mb-5 rounded-xl flex items-center justify-center gap-2 py-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="text-white text-xs font-medium">Toque em</span>
          <div
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Share size={12} color="#ffffff" />
            <span className="text-white text-xs font-semibold">Compartilhar</span>
          </div>
          <span className="text-white text-xs font-medium">abaixo</span>
          <span className="text-white animate-bounce">↓</span>
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  icon,
  text,
}: {
  number: number
  icon: React.ReactNode
  text: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
      >
        {number}
      </div>
      <div
        className="flex-1 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="flex-shrink-0">{icon}</div>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {text}
        </p>
      </div>
    </div>
  )
}
