import { notFound } from 'next/navigation'
import { getWorkoutPlan } from '@/actions/workout-plans'
import { getStudentCompletedRoutineIds } from '@/actions/workout-sessions'
import { Suspense } from 'react'
import { PlanViewClient } from './plan-view-client'

type Props = { params: Promise<{ planId: string }> }

export const dynamic = 'force-dynamic'

export default async function StudentPlanPage({ params }: Props) {
  const { planId } = await params
  const [plan, completedRoutineIds] = await Promise.all([
    getWorkoutPlan(planId),
    getStudentCompletedRoutineIds(planId),
  ])
  if (!plan || plan.status !== 'active') notFound()

  return (
    <Suspense>
      <PlanViewClient
        plan={plan}
        completedRoutineIds={completedRoutineIds}
      />
    </Suspense>
  )
}
