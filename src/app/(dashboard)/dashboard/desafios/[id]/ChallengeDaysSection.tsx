'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays, ChevronDown, Trash2, Send, Loader2,
  Dumbbell, BookOpen, Paperclip, Lightbulb,
} from 'lucide-react'
import type { Challenge, ChallengeDay, ChallengeDayItem, ChallengeItemType } from '@/app/actions/challenges'
import {
  deleteChallengeDay, publishChallengeDay, publishAllChallengeDays, deleteChallengeDayItem,
} from '@/app/actions/challenges'
import { AddDayButton } from './AddDayButton'
import { AddDayItemButton } from './AddDayItemButton'

type DayWithItems = ChallengeDay & { items: (ChallengeDayItem & { exercise_name: string | null })[] }

interface Props {
  challenge: Challenge
  days: DayWithItems[]
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

export function ChallengeDaysSection({ challenge, days }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(new Set(days.length > 0 ? [days[0].id] : []))
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const canManage = challenge.status === 'draft' || challenge.status === 'active'
  const nextDayNumber = days.length > 0 ? Math.max(...days.map((d) => d.day_number)) + 1 : 1
  const hasDraftDays = days.some((d) => d.status === 'draft')

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handlePublishDay(dayId: string) {
    setBusyId(dayId)
    startTransition(async () => {
      await publishChallengeDay(dayId, challenge.id)
      setBusyId(null)
      router.refresh()
    })
  }

  function handleDeleteDay(dayId: string) {
    setBusyId(dayId)
    startTransition(async () => {
      await deleteChallengeDay(dayId, challenge.id)
      setBusyId(null)
      router.refresh()
    })
  }

  function handlePublishAll() {
    startTransition(async () => {
      await publishAllChallengeDays(challenge.id)
      router.refresh()
    })
  }

  function handleDeleteItem(itemId: string) {
    setBusyId(itemId)
    startTransition(async () => {
      await deleteChallengeDayItem(itemId, challenge.id)
      setBusyId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-text-secondary" />
          <h2 className="font-body font-semibold text-text-primary">
            Dias do Desafio ({days.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {challenge.release_mode === 'all_at_once' && hasDraftDays && (
            <button
              onClick={handlePublishAll}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-lime/30 text-brand-lime text-xs font-medium hover:bg-brand-lime/10 transition-colors disabled:opacity-60"
            >
              <Send size={13} />
              Publicar Todos
            </button>
          )}
          {canManage && <AddDayButton challengeId={challenge.id} nextDayNumber={nextDayNumber} />}
        </div>
      </div>

      {days.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-8 text-center space-y-2">
          <p className="text-sm text-text-primary font-medium">Nenhum dia montado ainda</p>
          <p className="text-xs text-text-secondary">
            Adicione o Dia 1 e vá montando os exercícios, dicas e arquivos de cada dia.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => {
            const isOpen = expanded.has(day.id)
            const isDayBusy = busyId === day.id
            return (
              <div key={day.id} className="bg-surface border border-surface-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(day.id)}
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
                        {day.items.length} item{day.items.length !== 1 ? 's' : ''}
                        {day.release_date ? ` · previsto ${new Date(day.release_date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      day.status === 'published'
                        ? 'text-brand-lime bg-brand-lime/10 border-brand-lime/20'
                        : 'text-text-secondary bg-surface-border/40 border-surface-border'
                    }`}>
                      {day.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                    <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-surface-border p-4 space-y-3">
                    {day.items.length === 0 ? (
                      <p className="text-xs text-text-secondary">Nenhum item adicionado neste dia.</p>
                    ) : (
                      <div className="space-y-2">
                        {day.items.map((item) => {
                          const Icon = ITEM_ICON[item.item_type]
                          return (
                            <div key={item.id} className="flex items-start justify-between gap-3 bg-background border border-surface-border rounded-lg p-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <Icon size={14} className="text-text-secondary flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-xs text-text-secondary uppercase tracking-wide">{ITEM_LABEL[item.item_type]}</p>
                                  <p className="text-sm text-text-primary">{item.exercise_name ?? item.title}</p>
                                  {item.content && (
                                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{item.content}</p>
                                  )}
                                </div>
                              </div>
                              {canManage && (
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  disabled={isPending}
                                  className="text-text-secondary hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-40"
                                >
                                  {busyId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {canManage && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <AddDayItemButton dayId={day.id} challengeId={challenge.id} />
                        <div className="flex items-center gap-2">
                          {day.status === 'draft' && (
                            <button
                              onClick={() => handlePublishDay(day.id)}
                              disabled={isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-lime/10 border border-brand-lime/20 text-brand-lime text-xs font-medium hover:bg-brand-lime/20 transition-colors disabled:opacity-60"
                            >
                              {isDayBusy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                              Publicar Dia
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDay(day.id)}
                            disabled={isPending}
                            className="text-text-secondary hover:text-red-400 transition-colors disabled:opacity-40"
                          >
                            {isDayBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
