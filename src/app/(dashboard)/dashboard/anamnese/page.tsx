import { createClient } from '@/lib/supabase/server'
import { FileHeart, Users } from 'lucide-react'
import { CustomFieldsClient } from './custom-fields-client'

/**
 * Centraliza a gestão da anamnese com visão rápida de status e CRUD dos campos.
 */
export default async function AnamnesePage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .single()

  // Campos globais (somente leitura, para exibir estatística)
  const { data: globalFields } = await supabase
    .from('anamnese_templates')
    .select('id, label, category, field_type')
    .is('tenant_id', null)
    .eq('is_active', true)
    .order('sort_order')

  // Campos personalizados deste tenant
  const { data: customFields } = profile?.tenant_id
    ? await supabase
        .from('anamnese_templates')
        .select('id, label, field_key, field_type, category, required, is_active')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at')
    : { data: [] }

  // Estatísticas de preenchimento
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: completedCount } = await supabase
    .from('anamnese_responses')
    .select('*', { count: 'exact', head: true })
    .not('completed_at', 'is', null)

  const { count: startedCount } = await supabase
    .from('anamnese_responses')
    .select('*', { count: 'exact', head: true })
    .is('completed_at', null)

  const notStarted = Math.max(0, (totalStudents ?? 0) - (completedCount ?? 0) - (startedCount ?? 0))
  const globalCount = globalFields?.length ?? 0
  const customCount = customFields?.length ?? 0

  return (
    <div className="max-w-6xl space-y-6 p-4 sm:p-6 md:p-8">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-text-primary">
          Anamnese
        </h1>
        <p className="max-w-2xl text-sm text-text-secondary">
          Gerencie os campos do formulário e acompanhe o preenchimento dos alunos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Campos padrão',       value: globalCount,          color: 'text-text-primary'     },
          { label: 'Campos personalizados',value: customCount,          color: 'text-brand-lime'       },
          { label: 'Concluídas',          value: completedCount ?? 0,  color: 'text-status-success'   },
          { label: 'Não iniciadas',       value: notStarted,           color: 'text-status-warning'   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-surface-border bg-surface p-4 sm:p-5">
            <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        {/* Campos globais — somente visualização */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileHeart size={15} className="text-text-secondary" />
            <h2 className="font-body font-semibold text-sm text-text-primary">
              Campos padrão ({globalCount})
            </h2>
          </div>
          <p className="text-sm text-text-secondary">
            Estes campos fazem parte do formulário padrão de todos os tenants e não podem ser removidos.
          </p>
          <div className="rounded-xl border border-surface-border bg-surface overflow-hidden">
            {(globalFields ?? []).map((f, i) => (
              <div
                key={f.id}
                className={`flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
                  i !== 0 ? 'border-t border-surface-border' : ''
                }`}
              >
                <span className="text-text-primary">{f.label}</span>
                <span className="inline-flex w-fit min-h-7 items-center rounded-full border border-surface-border bg-background px-2.5 py-0.5 text-xs capitalize text-text-secondary">
                  {f.field_type}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Campos personalizados — gerenciáveis */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-text-secondary" />
            <h2 className="font-body font-semibold text-sm text-text-primary">
              Campos personalizados
            </h2>
          </div>
          <p className="text-sm text-text-secondary">
            Campos adicionais exclusivos para os seus alunos. Você pode ativar, desativar ou adicionar novos.
          </p>
          <CustomFieldsClient
            fields={(customFields ?? []).map((f) => ({
              id:         f.id,
              label:      f.label,
              field_key:  f.field_key,
              field_type: f.field_type as 'text' | 'textarea' | 'boolean' | 'select' | 'number',
              category:   f.category,
              required:   f.required,
              is_active:  f.is_active,
            }))}
          />
        </section>
      </div>
    </div>
  )
}
