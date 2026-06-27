import { redirect } from 'next/navigation'

type Props = { params: Promise<{ planId: string }> }

/**
 * Redireciona a rota antiga de execucao global para o detalhe do plano,
 * forçando a escolha da rotina antes de iniciar o treino.
 */
export default async function PlanExecutionPage({ params }: Props) {
  const { planId } = await params
  redirect(`/student/treinos/${planId}`)
}
