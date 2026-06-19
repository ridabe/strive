import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { AnamneseForm, type AnamneseField } from './anamnese-form'

interface Props {
  params: Promise<{ id: string }>
}

const CATEGORIES = [
  { key: 'saude',       label: 'Saúde Geral'           },
  { key: 'historico',   label: 'Histórico de Atividade' },
  { key: 'objetivos',   label: 'Objetivos'              },
  { key: 'habitos',     label: 'Hábitos de Vida'        },
  { key: 'alimentacao', label: 'Histórico Alimentar'    },
  { key: 'outros',      label: 'Outros'                 },
]

export default async function AnamnesePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .single()

  if (!profile?.tenant_id) notFound()

  const { data: student } = await supabase
    .from('students')
    .select('full_name, status')
    .eq('id', id)
    .single()

  if (!student) notFound()

  // Campos: globais (tenant_id IS NULL) + personalizados deste tenant
  const { data: templateRows } = await supabase
    .from('anamnese_templates')
    .select('id, field_key, label, field_type, options, required, category, sort_order, tenant_id')
    .or(`tenant_id.is.null,tenant_id.eq.${profile.tenant_id}`)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Respostas existentes
  const { data: anamneseRow } = await supabase
    .from('anamnese_responses')
    .select('responses, completed_at')
    .eq('student_id', id)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle()

  const fields: AnamneseField[] = (templateRows ?? []).map((r) => ({
    id:         r.id,
    field_key:  r.field_key,
    label:      r.label,
    field_type: r.field_type as AnamneseField['field_type'],
    options:    Array.isArray(r.options) ? (r.options as string[]) : null,
    required:   r.required,
    category:   r.category,
    tenant_id:  r.tenant_id,
  }))

  const initialResponses = (anamneseRow?.responses ?? {}) as Record<string, unknown>
  const completedAt      = anamneseRow?.completed_at ?? null

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/alunos" className="hover:text-text-primary transition-colors">Alunos</Link>
        <span>/</span>
        <Link href={`/dashboard/alunos/${id}`} className="hover:text-text-primary transition-colors">
          {student.full_name}
        </Link>
        <span>/</span>
        <span className="text-text-primary">Anamnese</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Anamnese
          </h1>
          <p className="text-text-secondary text-sm mt-1">{student.full_name}</p>
        </div>

        {completedAt ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-status-success border border-status-success/20 bg-status-success/10 rounded-full px-3 py-1">
            <CheckCircle2 size={12} />
            Finalizada em {new Date(completedAt).toLocaleDateString('pt-BR')}
          </span>
        ) : anamneseRow ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-status-warning border border-status-warning/20 bg-status-warning/10 rounded-full px-3 py-1">
            <Clock size={12} />
            Em andamento
          </span>
        ) : null}
      </div>

      {/* Aviso se já finalizada */}
      {completedAt && (
        <div className="bg-status-success/5 border border-status-success/20 rounded-xl p-4 text-sm text-status-success">
          Esta anamnese já foi finalizada. Você pode editar as respostas e salvar como rascunho, mas não é possível finalizar novamente.
        </div>
      )}

      {/* Formulário */}
      <AnamneseForm
        studentId={id}
        fields={fields}
        categories={CATEGORIES}
        initialResponses={initialResponses}
        completedAt={completedAt}
      />
    </div>
  )
}
