'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Flag, CheckCircle2, Circle, Loader2, MessageSquareText,
  Dumbbell, BookOpen, Paperclip, Lightbulb, ChevronDown,
} from 'lucide-react'
import type { StudentActiveChallenge, ChallengeMessage, ChallengeItemType } from '@/app/actions/challenges'
import { markItemComplete } from '@/app/actions/challenges'

interface Props {
  challenge: StudentActiveChallenge
  messages: ChallengeMessage[]
}

const ITEM_ICON: Record<ChallengeItemType, typeof Dumbbell> = {
  exercise: Dumbbell,
  reading: BookOpen,
  file: Paperclip,
  tip: Lightbulb,
}

const ITEM_LABEL: Record<ChallengeItemType, string> = {
  exercise: 'Exercício',
  reading: 'Leitura',
  file: 'Arquivo',
  tip: 'Recado',
}

export function StudentChallengeActiveView({ challenge, messages }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedDay, setExpandedDay] = useState<string | null>(challenge.days[0]?.id ?? null)

  const sortedDays = [...challenge.days].sort((a, b) => b.day_number - a.day_number)

  function handleMarkComplete(itemId: string) {
    setBusyId(itemId)
    startTransition(async () => {
      await markItemComplete(itemId)
      setBusyId(null)
      router.refresh()
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
      {challenge.cover_image_url && (
        <div className="relative aspect-[1200/630] w-full rounded-xl overflow-hidden">
          <Image src={challenge.cover_image_url} alt={challenge.name} fill unoptimized className="object-cover" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <Flag size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            {challenge.name}
          </h1>
          {challenge.description && (
            <p className="text-sm text-text-secondary mt-1">{challenge.description}</p>
          )}
        </div>
      </div>

      {(challenge.rules || challenge.prizes) && (
        <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
          {challenge.rules && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Regras</p>
              <p className="text-sm text-text-primary whitespace-pre-line">{challenge.rules}</p>
            </div>
          )}
          {challenge.prizes && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Premiações</p>
              <p className="text-sm text-text-primary whitespace-pre-line">{challenge.prizes}</p>
            </div>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquareText size={15} className="text-text-secondary" />
            <h2 className="text-sm font-body font-semibold text-text-primary">Dicas do personal</h2>
          </div>
          <div className="space-y-2">
            {messages.slice(0, 5).map((m) => (
              <div key={m.id} className="bg-surface border border-surface-border rounded-lg p-3">
                <p className="text-sm text-text-primary whitespace-pre-line">{m.message}</p>
                <p className="text-[11px] text-text-secondary/60 mt-1">
                  {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sortedDays.length === 0 ? (
          <div className="bg-surface border border-surface-border rounded-xl p-8 text-center">
            <p className="text-sm text-text-secondary">Seu personal ainda não liberou nenhum dia.</p>
          </div>
        ) : (
          sortedDays.map((day) => {
            const isOpen = expandedDay === day.id
            const completedCount = day.items.filter((i) => i.completed).length
            return (
              <div key={day.id} className="bg-surface border border-surface-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedDay(isOpen ? null : day.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 text-xs font-display font-bold text-brand-lime bg-brand-lime/10 border border-brand-lime/20 rounded-lg w-8 h-8 flex items-center justify-center">
                      {day.day_number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {day.title || `Dia ${day.day_number}`}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {completedCount}/{day.items.length} concluído{day.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-text-secondary transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-surface-border p-4 space-y-2">
                    {day.items.length === 0 ? (
                      <p className="text-xs text-text-secondary">Nenhum item neste dia ainda.</p>
                    ) : (
                      day.items.map((item) => {
                        const Icon = ITEM_ICON[item.item_type]
                        return (
                          <div key={item.id} className="flex items-start gap-3 bg-background border border-surface-border rounded-lg p-3">
                            <button
                              onClick={() => !item.completed && handleMarkComplete(item.id)}
                              disabled={isPending || item.completed}
                              className="flex-shrink-0 mt-0.5 disabled:opacity-100"
                            >
                              {busyId === item.id ? (
                                <Loader2 size={18} className="animate-spin text-text-secondary" />
                              ) : item.completed ? (
                                <CheckCircle2 size={18} className="text-brand-lime" />
                              ) : (
                                <Circle size={18} className="text-text-secondary" />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <Icon size={12} className="text-text-secondary" />
                                <p className="text-xs text-text-secondary uppercase tracking-wide">{ITEM_LABEL[item.item_type]}</p>
                              </div>
                              <p className={`text-sm ${item.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                {item.title}
                              </p>
                              {item.content && (
                                <p className="text-xs text-text-secondary mt-0.5">{item.content}</p>
                              )}
                              {item.file_url && (
                                <a
                                  href={item.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-brand-lime hover:underline mt-1 inline-block"
                                >
                                  Abrir arquivo
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
