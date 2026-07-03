import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getStudentActiveChallenge, getStudentLatestPublishedChallengeId,
  getStudentChallengeResults, getStudentChallengeMessages,
} from '@/app/actions/challenges'
import { StudentChallengeActiveView } from './StudentChallengeActiveView'
import { StudentChallengeResultsView } from './StudentChallengeResultsView'
import { Flag } from 'lucide-react'

export default async function StudentDesafiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getStudentActiveChallenge()

  if (active) {
    const messages = await getStudentChallengeMessages(active.challenge_id)
    return <StudentChallengeActiveView challenge={active} messages={messages} />
  }

  const publishedId = await getStudentLatestPublishedChallengeId()
  if (publishedId) {
    const results = await getStudentChallengeResults(publishedId)
    if (results) return <StudentChallengeResultsView results={results} />
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
          <Flag size={22} className="text-brand-lime" />
        </div>
        <p className="font-body font-medium text-text-primary">Nenhum desafio no momento</p>
        <p className="text-sm text-text-secondary">
          Quando seu personal te colocar em um desafio, ele vai aparecer aqui.
        </p>
      </div>
    </div>
  )
}
