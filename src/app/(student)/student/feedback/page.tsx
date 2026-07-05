import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudentRow } from '@/lib/supabase/student-context'
import { MessageSquare } from 'lucide-react'
import { FeedbackClient } from './feedback-client'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const student = await getActiveStudentRow(supabase, user.id)

  if (!student) redirect('/student')

  const [{ data: feedbacks }, { data: plans }] = await Promise.all([
    supabase
      .from('workout_feedbacks')
      .select('id, rating, comment, created_at, workout_plan_id, workout_plans ( name )')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('workout_plans')
      .select('id, name')
      .eq('student_id', student.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  const avgRating = feedbacks && feedbacks.length > 0
    ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
    : null

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-lg">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={18} className="text-purple-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Feedback de Treino
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Avalie seus treinos e ajude seu personal a melhorar suas fichas.
          </p>
        </div>
      </div>

      {/* Stats */}
      {feedbacks && feedbacks.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <p className="text-3xl font-display font-bold text-text-primary">{feedbacks.length}</p>
            <p className="text-xs text-text-secondary mt-0.5">avaliações enviadas</p>
          </div>
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <div className="flex items-center gap-1.5">
              <p className="text-3xl font-display font-bold text-yellow-400">
                {avgRating!.toFixed(1)}
              </p>
              <span className="text-yellow-400 text-lg">★</span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">média das notas</p>
          </div>
        </div>
      )}

      <FeedbackClient
        feedbacks={(feedbacks ?? []) as unknown as Parameters<typeof FeedbackClient>[0]['feedbacks']}
        workoutPlans={plans ?? []}
      />
    </div>
  )
}
