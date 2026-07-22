'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { dismissTrainerNotification, type TrainerNotification } from '@/app/actions/trainer-notifications'

interface Props {
  tenantId: string
  initialNotifications: TrainerNotification[]
}

/**
 * Sino de notificacoes do personal — atualiza via realtime e permite excluir cada item.
 */
export function TrainerNotificationBell({ tenantId, initialNotifications }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const instanceId = useId()

  useEffect(() => {
    setNotifications(initialNotifications)
  }, [initialNotifications])

  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()

    async function refreshNotifications() {
      const { data } = await supabase
        .from('trainer_notifications')
        .select('id, type, title, message, student_id, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      setNotifications(data ?? [])
    }

    const channel = supabase
      .channel(`trainer-notifications:${tenantId}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainer_notifications', filter: `tenant_id=eq.${tenantId}` },
        () => {
          void refreshNotifications()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId, instanceId])

  async function handleDismiss(id: string) {
    setPendingId(id)
    const previous = notifications
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const res = await dismissTrainerNotification(id)
    if (res?.error) setNotifications(previous)
    setPendingId(null)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => setIsOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-border/40 transition-colors"
      >
        <Bell size={17} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-lime px-1 text-[10px] font-bold text-background">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar notificações"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border">
              <p className="text-sm font-body font-semibold text-text-primary">Notificações</p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-text-secondary">
                  Nenhuma notificação por aqui.
                </p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-medium text-text-primary">{n.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                      {n.type === 'agenda_pending' ? (
                        <Link
                          href="/dashboard/agenda"
                          onClick={() => setIsOpen(false)}
                          className="mt-1 inline-block text-xs text-brand-lime hover:underline"
                        >
                          Ver agenda →
                        </Link>
                      ) : n.student_id && (
                        <Link
                          href={`/dashboard/alunos/${n.student_id}/anamnese`}
                          onClick={() => setIsOpen(false)}
                          className="mt-1 inline-block text-xs text-brand-lime hover:underline"
                        >
                          Ver anamnese →
                        </Link>
                      )}
                      <p className="text-[10px] text-text-secondary/60 mt-1">
                        {new Date(n.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Excluir notificação"
                      disabled={pendingId === n.id}
                      onClick={() => void handleDismiss(n.id)}
                      className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
