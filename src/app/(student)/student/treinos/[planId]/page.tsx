import { notFound } from 'next/navigation'
import { getWorkoutPlan } from '@/actions/workout-plans'
import { Suspense } from 'react'
import { PlanViewClient } from './plan-view-client'

type Props = { params: Promise<{ planId: string }> }

export default async function StudentPlanPage({ params }: Props) {
  const { planId } = await params
  const plan = await getWorkoutPlan(planId)
  if (!plan || plan.status !== 'active') notFound()

  return (
    <Suspense>
      <PlanViewClient plan={plan} />
    </Suspense>
  )
}
