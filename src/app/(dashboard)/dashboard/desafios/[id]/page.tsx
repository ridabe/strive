import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChallenge, getChallengeDays, getChallengeMessages, getChallengeTracking } from '@/app/actions/challenges'
import { ChallengeDetailClient } from './ChallengeDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DesafioDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['personal', 'global_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const result = await getChallenge(id)
  if (!result) notFound()

  const participantStudentIds = result.participants.map((p) => p.student_id)

  const { data: allStudents } = await supabase
    .from('students')
    .select('id, full_name, email')
    .eq('status', 'active')
    .order('full_name')

  const availableStudents = (allStudents ?? []).filter(
    (s) => !participantStudentIds.includes(s.id)
  )

  const days = await getChallengeDays(id)
  const messages = await getChallengeMessages(id)
  const tracking = result.challenge.status !== 'draft' ? await getChallengeTracking(id) : []

  return (
    <ChallengeDetailClient
      challenge={result.challenge}
      participants={result.participants}
      availableStudents={availableStudents}
      days={days}
      messages={messages}
      tracking={tracking}
    />
  )
}
