import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { AcademiaActions } from '@/components/admin/academia-actions'
import { Plus, Building, Users, UsersRound } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PLAN_LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const PLAN_COLORS = {
  free:    'text-text-secondary   bg-surface-border/40       border-surface-border',
  pro:     'text-brand-lime       bg-brand-lime/10           border-brand-lime/20',
  premium: 'text-status-warning   bg-status-warning/10       border-status-warning/20',
}
const STATUS_COLORS = {
  active:    'text-status-success  bg-status-success/10  border-status-success/20',
  inactive:  'text-text-secondary  bg-surface-border/40  border-surface-border',
  suspended: 'text-status-error    bg-status-error/10    border-status-error/20',
}
const STATUS_LABELS = { active: 'Ativo', inactive: 'Inativo', suspended: 'Suspenso' }

// Painel do global_admin para academias (tenant_type='academia') — Fase 6.
// Espelha /admin/clientes, trocando a métrica principal de "alunos" para
// "personais/admins" (o limite que faz sentido controlar manualmente numa
// academia), mantendo a contagem de alunos como métrica secundária.
export default async function AcademiasPage() {
  const supabase = await createClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, business_name, slug, plan, status, logo_url, primary_color, max_students, max_personals, self_assign_enabled, contact_email, created_at')
    .eq('tenant_type', 'academia')
    .order('created_at', { ascending: false })

  const tenantIds = (tenants ?? []).map((t) => t.id)

  const [{ data: studentCounts }, { data: memberCounts }] = await Promise.all([
    tenantIds.length
      ? supabase.from('students').select('tenant_id').in('tenant_id', tenantIds)
      : Promise.resolve({ data: [] as { tenant_id: string }[] }),
    tenantIds.length
      ? supabase.from('tenant_members').select('tenant_id').in('tenant_id', tenantIds).eq('status', 'active')
      : Promise.resolve({ data: [] as { tenant_id: string }[] }),
  ])

  const studentCountByTenant = (studentCounts ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.tenant_id] = (acc[s.tenant_id] ?? 0) + 1
    return acc
  }, {})

  const memberCountByTenant = (memberCounts ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.tenant_id] = (acc[m.tenant_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Academias
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {tenants?.length ?? 0} academia{(tenants?.length ?? 0) !== 1 ? 's' : ''} cadastrada{(tenants?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/academias/nova"
          className="inline-flex w-full items-center justify-center gap-2 bg-brand-lime text-text-inverse text-sm font-body font-semibold px-5 py-3 rounded-lg hover:bg-brand-dark transition-colors flex-shrink-0 sm:w-auto"
        >
          <Plus size={16} />
          Nova academia
        </Link>
      </div>

      {/* Lista vazia */}
      {(!tenants || tenants.length === 0) && (
        <div className="bg-surface border border-surface-border rounded-xl py-20 text-center">
          <Building size={36} className="text-text-secondary/30 mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Nenhuma academia cadastrada ainda.</p>
          <Link
            href="/admin/academias/nova"
            className="inline-flex items-center gap-2 mt-4 text-brand-lime text-sm font-medium hover:underline"
          >
            <Plus size={14} /> Adicionar primeira academia
          </Link>
        </div>
      )}

      {/* Grid de academias */}
      {tenants && tenants.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {tenants.map((tenant) => {
            const studentCount = studentCountByTenant[tenant.id] ?? 0
            const memberCount  = memberCountByTenant[tenant.id] ?? 0
            const memberUsagePercent = Math.min(100, Math.round((memberCount / tenant.max_personals) * 100))

            return (
              <div
                key={tenant.id}
                className="bg-surface border border-surface-border rounded-xl overflow-hidden hover:border-surface-border/80 transition-all group"
              >
                <div
                  className="h-1"
                  style={{ backgroundColor: tenant.primary_color ?? '#E8FF47' }}
                />

                <div className="p-5 space-y-4">
                  {/* Logo + nome */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-surface-border bg-background flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {tenant.logo_url ? (
                        <Image
                          src={tenant.logo_url}
                          alt={`Logo ${tenant.business_name}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Building size={20} className="text-text-secondary/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body font-semibold text-text-primary truncate">
                        {tenant.business_name}
                      </h3>
                      {tenant.slug && (
                        <p className="text-xs text-text-secondary/60 font-mono truncate">
                          /{tenant.slug}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center text-xs font-body font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[tenant.plan as keyof typeof PLAN_COLORS] ?? ''}`}>
                      {PLAN_LABELS[tenant.plan as keyof typeof PLAN_LABELS]}
                    </span>
                    <span className={`inline-flex items-center text-xs font-body font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[tenant.status as keyof typeof STATUS_COLORS] ?? ''}`}>
                      {STATUS_LABELS[tenant.status as keyof typeof STATUS_LABELS]}
                    </span>
                    {tenant.self_assign_enabled && (
                      <span className="inline-flex items-center text-xs font-body font-semibold px-2 py-0.5 rounded-full border text-brand-lime bg-brand-lime/10 border-brand-lime/20">
                        Autoatribuição
                      </span>
                    )}
                  </div>

                  {/* Personais / uso (métrica principal de uma academia) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-text-secondary">
                        <UsersRound size={12} /> Personais/admins
                      </span>
                      <span className="text-text-primary font-medium">
                        {memberCount} / {tenant.max_personals}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${memberUsagePercent}%`,
                          backgroundColor: tenant.primary_color ?? '#E8FF47',
                        }}
                      />
                    </div>
                  </div>

                  {/* Alunos (métrica secundária) */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Users size={12} /> Alunos
                    </span>
                    <span className="text-text-primary font-medium">
                      {studentCount} / {tenant.max_students === 9999 ? '∞' : tenant.max_students}
                    </span>
                  </div>

                  {/* Rodapé */}
                  <div className="flex flex-col gap-3 pt-1 border-t border-surface-border sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-text-secondary/60">
                      Desde {format(new Date(tenant.created_at), "MMM/yyyy", { locale: ptBR })}
                    </span>
                    <div className="self-end sm:self-auto">
                      <AcademiaActions
                        tenantId={tenant.id}
                        tenantName={tenant.business_name}
                        currentStatus={tenant.status}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
