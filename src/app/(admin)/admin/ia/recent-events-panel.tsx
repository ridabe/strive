'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'

type RecentEventItem = {
  id: string
  featureLabel: string
  featurePill: string
  providerLabel: string
  providerPill: string
  platformLabel: string
  platformPill: string
  statusLabel: string
  statusPill: string
  tenantLabel: string
  tokenLabel: string
  modelLabel: string | null
  errorMessage: string | null
  relativeTime: string
}

interface RecentEventsPanelProps {
  items: RecentEventItem[]
}

/**
 * Renderiza a lista de eventos recentes em um bloco recolhivel com paginacao incremental.
 */
export function RecentEventsPanel({ items }: RecentEventsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(10)

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])
  const hasMore = visibleCount < items.length

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="w-full px-4 sm:px-5 py-4 border-b border-surface-border flex items-center gap-2 text-left"
      >
        <Clock size={15} className="text-text-secondary" />
        <h2 className="font-body font-semibold text-text-primary text-sm">
          Eventos recentes
        </h2>
        <span className="ml-auto text-xs text-text-secondary/60">
          {items.length} evento{items.length !== 1 ? 's' : ''}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {!isOpen ? null : items.length === 0 ? (
        <p className="text-center text-text-secondary text-sm py-12">
          Nenhuma consulta registrada ainda.
        </p>
      ) : (
        <div className="divide-y divide-surface-border">
          {visibleItems.map((event) => (
            <div key={event.id} className="flex items-start gap-3 px-4 sm:px-5 py-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${event.featurePill}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-body font-medium text-text-primary truncate">
                    {event.featureLabel}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${event.providerPill}`}>
                    {event.providerLabel}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${event.platformPill}`}>
                    {event.platformLabel}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${event.statusPill}`}>
                    {event.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-text-secondary truncate">
                  {event.tenantLabel} · {event.tokenLabel}
                  {event.modelLabel ? ` · ${event.modelLabel}` : ''}
                </p>
                {event.errorMessage && (
                  <p className="text-xs text-status-error/80 truncate mt-1">{event.errorMessage}</p>
                )}
              </div>
              <p className="text-xs text-text-secondary/60 flex-shrink-0">
                {event.relativeTime}
              </p>
            </div>
          ))}

          {hasMore && (
            <div className="px-4 sm:px-5 py-4">
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + 10)}
                className="inline-flex items-center justify-center rounded-xl border border-surface-border bg-background px-4 py-2 text-sm font-medium text-text-primary transition hover:border-violet-400/30 hover:text-violet-300"
              >
                Mostrar mais 10 eventos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
