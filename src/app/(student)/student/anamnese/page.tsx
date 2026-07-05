import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudentRow } from '@/lib/supabase/student-context'
import { FileHeart, CheckCircle } from 'lucide-react'
import { AnamneseForm } from './anamnese-form'

export default async function AnamnesePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const student = await getActiveStudentRow(supabase, user.id)

  if (!student) redirect('/student')

  const [{ data: templates }, { data: existing }] = await Promise.all([
    supabase
      .from('anamnese_templates')
      .select('id, field_key, field_type, label, options, category, sort_order, required')
      .eq('is_active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${student.tenant_id}`)
      .order('category')
      .order('sort_order'),
    supabase
      .from('anamnese_responses')
      .select('id, responses, completed_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const fields = (templates ?? []).map((t) => ({
    id: t.id,
    field_key: t.field_key,
    field_type: t.field_type,
    label: t.label,
    options: Array.isArray(t.options) ? (t.options as string[]) : null,
    required: t.required,
    category: t.category,
  }))

  const initialValues = (existing?.responses ?? {}) as Record<string, string>

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center flex-shrink-0">
          <FileHeart size={18} className="text-rose-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Anamnese
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Sua ficha de saúde e histórico. As respostas ficam visíveis para seu personal.
          </p>
        </div>
      </div>

      {/* Completed badge */}
      {existing?.completed_at && (
        <div className="inline-flex items-center gap-1.5 text-xs text-status-success bg-status-success/10 border border-status-success/20 rounded-full px-3 py-1">
          <CheckCircle size={12} />
          Enviada em {new Date(existing.completed_at).toLocaleDateString('pt-BR')}
        </div>
      )}

      {fields.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-8 text-center">
          <p className="text-sm text-text-secondary">
            Nenhum campo de anamnese configurado. Entre em contato com seu personal.
          </p>
        </div>
      ) : (
        <AnamneseForm
          fields={fields}
          initialValues={initialValues}
          existingId={existing?.id ?? null}
          completedAt={existing?.completed_at ?? null}
        />
      )}
    </div>
  )
}
