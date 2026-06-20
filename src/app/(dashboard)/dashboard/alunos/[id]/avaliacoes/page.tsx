import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Ruler } from 'lucide-react'
import { NewAssessmentForm, AssessmentCard, type Assessment } from './new-assessment-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentAvaliacoesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('full_name, status, birth_date')
    .eq('id', id)
    .single()

  if (!student) notFound()

  const { data: assessments } = await supabase
    .from('physical_assessments')
    .select(
      'id, assessed_at, sex, weight, height, body_fat, arm, chest, waist, hip, thigh, notes, bmi, bmr',
    )
    .eq('student_id', id)
    .order('assessed_at', { ascending: false })

  const list = (assessments ?? []) as Assessment[]
  const latest = list[0]

  const oldest = list.length > 1 ? list[list.length - 1] : null
  const weightDelta =
    latest?.weight !== null && latest?.weight !== undefined &&
    oldest?.weight !== null && oldest?.weight !== undefined
      ? +(latest.weight - oldest.weight).toFixed(1)
      : null

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/alunos" className="hover:text-text-primary transition-colors">
          Alunos
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/alunos/${id}`}
          className="hover:text-text-primary transition-colors"
        >
          {student.full_name}
        </Link>
        <span>/</span>
        <span className="text-text-primary">Avaliações Físicas</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Avaliações Físicas
          </h1>
          <p className="text-text-secondary text-sm mt-1">{student.full_name}</p>
        </div>
        <NewAssessmentForm studentId={id} birthDate={student.birth_date ?? null} />
      </div>

      {/* Stats rápidas */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total de avaliações',
              value: list.length,
              color: 'text-text-primary',
            },
            {
              label: 'Último peso',
              value: latest?.weight !== null && latest?.weight !== undefined
                ? `${latest.weight} kg`
                : '—',
              color: 'text-purple-400',
            },
            {
              label: 'IMC atual',
              value: latest?.bmi !== null && latest?.bmi !== undefined
                ? String(latest.bmi)
                : '—',
              color: 'text-brand-lime',
            },
            {
              label: 'Variação de peso',
              value: weightDelta !== null
                ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`
                : '—',
              color:
                weightDelta === null
                  ? 'text-text-secondary'
                  : weightDelta <= 0
                  ? 'text-status-success'
                  : 'text-status-warning',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface border border-surface-border rounded-xl p-4"
            >
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista de avaliações */}
      {list.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center mx-auto">
            <Ruler size={22} className="text-purple-400" />
          </div>
          <div>
            <p className="font-body font-medium text-text-primary">
              Nenhuma avaliação registrada
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Clique em &quot;Nova Avaliação&quot; para registrar a primeira.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-text-secondary" />
            <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
              Histórico ({list.length})
            </h2>
          </div>
          {list.map((a) => (
            <AssessmentCard key={a.id} assessment={a} studentId={id} />
          ))}
        </div>
      )}
    </div>
  )
}
