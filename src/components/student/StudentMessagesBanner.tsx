'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StudentMessagesBannerProps {
  studentId: string
  initialUnreadCount: number
  initialLatestTitle: string | null
}

/**
 * Mantem visivel no web do aluno um aviso de novas mensagens do personal.
 */
export function StudentMessagesBanner({
  studentId,
  initialUnreadCount,
  initialLatestTitle,
}: StudentMessagesBannerProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [latestTitle, setLatestTitle] = useState(initialLatestTitle)

  useEffect(() => {
    setUnreadCount(initialUnreadCount)
    setLatestTitle(initialLatestTitle)
  }, [initialUnreadCount, initialLatestTitle, studentId])

  useEffect(() => {
    if (!studentId) return

    const supabase = createClient()

    /**
     * Recalcula o contador e o titulo mais recente para manter o banner sincronizado.
     */
    async function refreshUnreadMessages() {
      const { data } = await supabase
        .from('student_messages')
        .select('id, title')
        .eq('student_id', studentId)
        .is('read_at', null)
        .order('created_at', { ascending: false })

      const items = data ?? []
      setUnreadCount(items.length)
      setLatestTitle(items[0]?.title ?? null)
    }

    const channel = supabase
      .channel(`student-web-messages:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_messages',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          void refreshUnreadMessages()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [studentId])

  if (unreadCount <= 0) return null

  return (
    <Link
      href="/student/mensagens"
      className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-left transition-all hover:border-violet-400/40 hover:bg-violet-400/15 md:mx-6"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/15 text-violet-300">
        <Bell size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-body font-semibold text-text-primary">
          {unreadCount === 1 ? 'Voce tem 1 mensagem nova' : `Voce tem ${unreadCount} mensagens novas`}
        </p>
        <p className="text-xs text-text-secondary">
          {latestTitle ? `${latestTitle} - toque para abrir sua caixa.` : 'Abra sua caixa para ler o recado do personal.'}
        </p>
      </div>
      <ChevronRight size={15} className="flex-shrink-0 text-violet-300" />
    </Link>
  )
}
