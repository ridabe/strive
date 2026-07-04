'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { X, Download, Smartphone, QrCode } from 'lucide-react'

const MAX_VIOLET = '#7C3AED' // cor exclusiva do Max, só para avatar/glow (DESIGN.md)

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function AndroidInstallPrompt({ storeUrl, enabled }: { storeUrl: string | null; enabled: boolean }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !storeUrl) return

    const key = 'strive-android-prompt-dismissed'
    if (localStorage.getItem(key)) return
    if (isStandalone()) return

    const android = isAndroid()
    const desktop = !isMobile()
    if (!android && !desktop) return

    setIsDesktop(desktop)
    if (desktop) {
      QRCode.toDataURL(storeUrl, { margin: 1, width: 160, color: { dark: '#0E0E1A', light: '#E8FF47' } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null))
    }

    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [storeUrl, enabled])

  function dismiss(permanent = false) {
    setVisible(false)
    setDismissed(true)
    if (permanent) {
      localStorage.setItem('strive-android-prompt-dismissed', '1')
    }
  }

  if (!enabled || !visible || dismissed || !storeUrl) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex justify-center ${isDesktop ? 'items-center' : 'items-end'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => dismiss(false)}
    >
      <div
        className={`w-full max-w-md mx-4 rounded-2xl overflow-hidden animate-slide-up ${isDesktop ? '' : 'mb-4'}`}
        style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${MAX_VIOLET}30 0%, transparent 70%)` }}
              />
              <Image
                src="/max-avatar.png"
                alt="Max Strive"
                width={48}
                height={48}
                className="relative z-10 object-contain"
                style={{ filter: `drop-shadow(0 0 10px ${MAX_VIOLET}55)` }}
              />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Max Strive</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isDesktop ? 'Baixe o app no seu celular' : 'Baixe o app na Play Store'}
              </p>
            </div>
          </div>
          <button
            type="button"
            title="Fechar"
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
            {isDesktop ? 'Continue no app pelo seu celular' : 'Use o app nativo no seu Android'}
          </p>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isDesktop
              ? 'Aponte a câmera do seu celular Android para o QR code abaixo e baixe o app na Play Store.'
              : 'Acesso mais rápido, notificações e melhor experiência direto na sua tela inicial.'}
          </p>

          {isDesktop ? (
            <div className="flex justify-center py-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR code para baixar o app na Play Store"
                  width={160}
                  height={160}
                  className="rounded-xl"
                />
              ) : (
                <div
                  className="w-40 h-40 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  <QrCode size={32} color="rgba(255,255,255,0.4)" />
                </div>
              )}
            </div>
          ) : (
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
          )}
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
