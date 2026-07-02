'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function AndroidInstallPrompt({ storeUrl }: { storeUrl: string | null }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!storeUrl) return

    const key = 'strive-android-prompt-dismissed'
    if (localStorage.getItem(key)) return
    if (isStandalone()) return
    if (!isAndroid()) return

    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [storeUrl])

  function dismiss(permanent = false) {
    setVisible(false)
    setDismissed(true)
    if (permanent) {
      localStorage.setItem('strive-android-prompt-dismissed', '1')
    }
  }

  if (!visible || dismissed || !storeUrl) return null

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
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl"
              style={{ backgroundColor: '#0E0E1A', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              S
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Strive Personal</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Baixe o app na Play Store
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
            Use o app nativo no seu Android
          </p>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Acesso mais rápido, notificações e melhor experiência direto na sua tela inicial.
          </p>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => dismiss(true)}
            className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm"
            style={{ backgroundColor: '#E8FF47', color: '#0E0E1A' }}
          >
            <Download size={16} />
            Baixar na Play Store
          </a>
        </div>

        {/* Indicator */}
        <div
          className="mx-5 mb-5 rounded-xl flex items-center justify-center gap-2 py-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Smartphone size={14} color="rgba(255,255,255,0.6)" />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Disponível para dispositivos Android
          </span>
        </div>
      </div>
    </div>
  )
}
