import { Activity } from 'lucide-react'
import type { ParticipantTracking } from '@/app/actions/challenges'

interface Props {
  tracking: ParticipantTracking[]
}

function progressColor(pct: number): string {
  if (pct >= 70) return 'bg-brand-lime'
  if (pct >= 35) return 'bg-yellow-400'
  return 'bg-red-400'
}

export function ChallengeTrackingSection({ tracking }: Props) {
  const sorted = [...tracking].sort((a, b) => b.progress_pct - a.progress_pct)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-text-secondary" />
        <h2 className="font-body font-semibold text-text-primary">Acompanhamento</h2>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-8 text-center">
          <p className="text-sm text-text-secondary">Nenhum item publicado ainda para acompanhar.</p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden divide-y divide-surface-border">
          {sorted.map((t) => (
            <div key={t.participant_id} className="px-5 py-3.5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text-primary truncate">{t.student_name}</p>
                <span className="text-xs text-text-secondary flex-shrink-0">
                  {t.completed_items}/{t.total_published_items} · {t.progress_pct}%
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor(t.progress_pct)}`}
                  style={{ width: `${t.progress_pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
