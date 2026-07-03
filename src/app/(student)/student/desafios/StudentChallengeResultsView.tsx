import Image from 'next/image'
import { Trophy, Medal } from 'lucide-react'
import type { ChallengeRankingEntry } from '@/app/actions/challenges'

interface Props {
  results: {
    challenge_name: string
    cover_image_url: string | null
    show_details: boolean
    ranking: ChallengeRankingEntry[]
  }
}

const MEDAL_COLOR: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-600',
}

export function StudentChallengeResultsView({ results }: Props) {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
      {results.cover_image_url && (
        <div className="relative aspect-[1200/630] w-full rounded-xl overflow-hidden">
          <Image src={results.cover_image_url} alt={results.challenge_name} fill unoptimized className="object-cover" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <Trophy size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            {results.challenge_name}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Resultado final do desafio</p>
        </div>
      </div>

      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden divide-y divide-surface-border">
        {results.ranking.map((entry, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between gap-3 px-4 py-3.5 ${entry.is_me ? 'bg-brand-lime/5' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-display font-bold ${
                entry.rank && entry.rank <= 3
                  ? `${MEDAL_COLOR[entry.rank]} bg-surface-border/30 border-surface-border`
                  : 'text-text-secondary bg-surface-border/30 border-surface-border'
              }`}>
                {entry.rank && entry.rank <= 3 ? <Medal size={14} /> : (entry.rank ?? '—')}
              </span>
              <p className={`text-sm truncate ${entry.is_me ? 'text-brand-lime font-semibold' : 'text-text-primary'}`}>
                {entry.is_me ? 'Você' : entry.student_name}
              </p>
            </div>
            {results.show_details && entry.delta_pp != null && (
              <span className="text-xs text-text-secondary flex-shrink-0">
                -{entry.delta_pp.toFixed(1)}pp de gordura
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
