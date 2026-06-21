import { notFound } from 'next/navigation'
import { getWorkoutPlan } from '@/actions/workout-plans'
import { WorkoutExecutionClient } from './workout-execution-client'

type Props = { params: Promise<{ planId: string; routineId: string }> }

export default async function WorkoutExecutionPage({ params }: Props) {
  const { planId, routineId } = await params
  const plan = await getWorkoutPlan(planId)
  if (!plan || plan.status !== 'active') notFound()

  const routine = plan.workout_routines.find((r) => r.id === routineId)
  if (!routine || routine.workout_items.length === 0) notFound()

  return (
    <WorkoutExecutionClient
      planId={plan.id}
      planName={plan.name}
      routine={routine}
    />
  )
}
