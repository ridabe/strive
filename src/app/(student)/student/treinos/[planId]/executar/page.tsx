import { notFound } from 'next/navigation'
import { getWorkoutPlan } from '@/actions/workout-plans'
import { PlanExecutionClient } from './plan-execution-client'

type Props = { params: Promise<{ planId: string }> }

export default async function PlanExecutionPage({ params }: Props) {
  const { planId } = await params
  const plan = await getWorkoutPlan(planId)
  if (!plan || plan.status !== 'active') notFound()

  return <PlanExecutionClient plan={plan} />
}
