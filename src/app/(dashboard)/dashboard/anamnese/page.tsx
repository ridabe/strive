import { createClient } from '@/lib/supabase/server'
import { FileHeart, Users } from 'lucide-react'
import { CustomFieldsClient } from './custom-fields-client'

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
    <div className="p-6 md:p-8 space-y-8 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Anamnese
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Gerencie os campos do formulário e acompanhe o preenchimento dos alunos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Campos padrão',       value: globalCount,          color: 'text-text-primary'     },
          { label: 'Campos personalizados',value: customCount,          color: 'text-brand-lime'       },
          { label: 'Concluídas',          value: completedCount ?? 0,  color: 'text-status-success'   },
          { label: 'Não iniciadas',       value: notStarted,           color: 'text-status-warning'   },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-surface-border rounded-xl p-4">
            <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

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
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          {(globalFields ?? []).map((f, i) => (
            <div
              key={f.id}
              className={`flex items-center justify-between px-5 py-3 text-sm ${
                i !== 0 ? 'border-t border-surface-border' : ''
              }`}
            >
              <span className="text-text-primary">{f.label}</span>
              <span className="text-xs text-text-secondary capitalize">{f.field_type}</span>
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
  )
}
