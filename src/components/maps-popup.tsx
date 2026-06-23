'use client'

import { useState } from 'react'
import { ExternalLink, X, MapPin } from 'lucide-react'

interface Props {
  address:   string
  label?:    string   // texto exibido no botão trigger
  iconSize?: number
  className?: string
}

export function MapsPopup({ address, label, iconSize = 10, className = '' }: Props) {
  const [open, setOpen] = useState(false)

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=pt-BR&z=16`

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className={`flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0 font-medium ${className}`}
        title="Ver no Google Maps"
      >
        <ExternalLink size={iconSize} />
        {label && <span>{label}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: '70vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border flex-shrink-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                <span className="text-sm font-medium text-text-primary truncate">
                  {address}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Iframe do Google Maps */}
            <iframe
              src={embedUrl}
              className="flex-1 w-full border-0"
              title={`Mapa: ${address}`}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </>
  )
}
