'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Play, Trash2, Loader2, Users, Scale, Percent } from 'lucide-react'
import type { Challenge, ChallengeParticipant, ChallengeDay, ChallengeDayItem, ChallengeMessage, ParticipantTracking } from '@/app/actions/challenges'
import { startChallenge, removeParticipant } from '@/app/actions/challenges'
import { AddParticipantButton } from './AddParticipantButton'
import { ChallengeDaysSection } from './ChallengeDaysSection'
import { ChallengeCoverUpload } from './ChallengeCoverUpload'
import { ChallengeMessagesSection } from './ChallengeMessagesSection'
import { ChallengeTrackingSection } from './ChallengeTrackingSection'
import { EditChallengeButton } from './EditChallengeButton'
import { DeleteChallengeButton } from './DeleteChallengeButton'
import { FinalDataButton } from './FinalDataButton'
import { FinishChallengeButton } from './FinishChallengeButton'
import { PublishResultsButton } from './PublishResultsButton'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  finished: 'Aguardando publicação',
  published: 'Publicado',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-text-secondary bg-surface-border/40 border-surface-border',
  active: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
  finished: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  published: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

type ParticipantRow = ChallengeParticipant & { student_name: string; student_email: string | null }
type DayWithItems = ChallengeDay & { items: (ChallengeDayItem & { exercise_name: string | null })[] }

interface Props {
  challenge: Challenge
  participants: ParticipantRow[]
  availableStudents: { id: string; full_name: string; email: string | null }[]
  days: DayWithItems[]
  messages: ChallengeMessage[]
  tracking: ParticipantTracking[]
}

export function ChallengeDetailClient({ challenge, participants, availableStudents, days, messages, tracking }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  function handleStart() {
    setError('')
    startTransition(async () => {
      const result = await startChallenge(challenge.id)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function handleRemove(participantId: string) {
    setRemovingId(participantId)
    startTransition(async () => {
      await removeParticipant(participantId, challenge.id)
      setRemovingId(null)
      router.refresh()
    })
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      <Link
        href="/dashboard/desafios"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para Desafios
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
            <Trophy size={18} className="text-brand-lime" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
                {challenge.name}
              </h1>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLE[challenge.status]}`}>
                {STATUS_LABELS[challenge.status]}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {challenge.duration_days} dias · liberação {challenge.release_mode === 'progressive' ? 'progressiva' : 'de uma vez'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <EditChallengeButton challenge={challenge} />
          <DeleteChallengeButton
            challengeId={challenge.id}
            challengeName={challenge.name}
            isActive={challenge.status === 'active'}
          />
          {challenge.status === 'draft' && (
            <button
              onClick={handleStart}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              Iniciar Desafio
            </button>
          )}
          {challenge.status === 'active' && <FinishChallengeButton challengeId={challenge.id} />}
          {challenge.status === 'finished' && <PublishResultsButton challengeId={challenge.id} />}
        </div>
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <ChallengeCoverUpload challengeId={challenge.id} coverImageUrl={challenge.cover_image_url} canEdit />

      {(challenge.description || challenge.rules || challenge.prizes) && (
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
          {challenge.description && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Descrição</p>
              <p className="text-sm text-text-primary whitespace-pre-line">{challenge.description}</p>
            </div>
          )}
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

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-text-secondary" />
            <h2 className="font-body font-semibold text-text-primary">
              Participantes ({participants.length})
            </h2>
          </div>
          {challenge.status === 'draft' && (
            <AddParticipantButton challengeId={challenge.id} availableStudents={availableStudents} />
          )}
        </div>

        {participants.length === 0 ? (
          <div className="bg-surface border border-surface-border rounded-xl p-8 text-center space-y-2">
            <p className="text-sm text-text-primary font-medium">Nenhum participante ainda</p>
            <p className="text-xs text-text-secondary">
              Adicione alunos existentes ou convide novas pessoas para o desafio.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden divide-y divide-surface-border">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.student_name}</p>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5 flex-wrap">
                    {p.initial_weight != null && (
                      <span className="flex items-center gap-1"><Scale size={11} />{p.initial_weight}kg inicial</span>
                    )}
                    {p.initial_body_fat != null && (
                      <span className="flex items-center gap-1"><Percent size={11} />{p.initial_body_fat}% inicial</span>
                    )}
                    {p.final_weight != null && (
                      <span className="flex items-center gap-1"><Scale size={11} />{p.final_weight}kg final</span>
                    )}
                    {p.final_body_fat != null && (
                      <span className="flex items-center gap-1"><Percent size={11} />{p.final_body_fat}% final</span>
                    )}
                    {p.result_rank != null && (
                      <span className="text-brand-lime font-medium">#{p.result_rank} no ranking</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(challenge.status === 'active' || challenge.status === 'finished') && (
                    <FinalDataButton challengeId={challenge.id} participant={p} />
                  )}
                  {challenge.status === 'draft' && (
                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={isPending}
                      className="text-text-secondary hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Remover participante"
                    >
                      {removingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChallengeDaysSection challenge={challenge} days={days} />

      {challenge.status !== 'draft' && <ChallengeTrackingSection tracking={tracking} />}

      <ChallengeMessagesSection challengeId={challenge.id} messages={messages} />
    </div>
  )
}
