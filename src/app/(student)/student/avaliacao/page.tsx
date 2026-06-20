import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList } from 'lucide-react'
import { NewAssessmentForm, AssessmentHistoryCard, type Assessment } from './assessment-form'

export default async function AvaliacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, birth_date')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) redirect('/student')

  const { data: assessments } = await supabase
    .from('physical_assessments')
    .select('id, assessed_at, sex, weight, height, body_fat, arm, chest, waist, hip, thigh, notes, bmi, bmr')
    .eq('student_id', student.id)
    .order('assessed_at', { ascending: false })

  const list = (assessments ?? []) as Assessment[]

  const lastTwo = list.filter((a) => a.weight !== null).slice(0, 2)
  const weightDelta =
    lastTwo.length === 2 && lastTwo[0].weight !== null && lastTwo[1].weight !== null
      ? lastTwo[0].weight - lastTwo[1].weight
      : null

  const latestBmi = list.find((a) => a.bmi !== null)?.bmi ?? null

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center flex-shrink-0">
          <ClipboardList size={18} className="text-sky-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Avaliação Física
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Acompanhe sua evolução. Registros visíveis para seu personal.
          </p>
        </div>
      </div>

      {/* Stats rápidos */}
      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Avaliações</p>
            <p className="text-2xl font-display font-bold text-text-primary">{list.length}</p>
          </div>
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Variação Peso</p>
            {weightDelta !== null ? (
              <p className={`text-2xl font-display font-bold ${
                weightDelta < 0 ? 'text-status-success' : weightDelta > 0 ? 'text-status-error' : 'text-text-primary'
              }`}>
                {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
              </p>
            ) : (
              <p className="text-2xl font-display font-bold text-text-secondary">—</p>
            )}
          </div>
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">IMC Atual</p>
            {latestBmi !== null ? (
              <p className="text-2xl font-display font-bold text-text-primary">{latestBmi}</p>
            ) : (
              <p className="text-2xl font-display font-bold text-text-secondary">—</p>
            )}
          </div>
        </div>
      )}

      {/* Formulário nova avaliação */}
      <NewAssessmentForm birthDate={student.birth_date ?? null} />

      {/* Histórico */}
      {list.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Histórico
          </p>
          {list.map((a) => (
            <AssessmentHistoryCard key={a.id} assessment={a} />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-2xl p-8 text-center">
          <ClipboardList size={32} className="text-text-secondary/30 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            Nenhuma avaliação registrada ainda.
          </p>
          <p className="text-xs text-text-secondary/60 mt-1">
            Clique em &quot;Nova Avaliação&quot; para registrar seus dados.
          </p>
        </div>
      )}
    </div>
  )
}
