import { createAdminClient } from '@/lib/supabase/admin'
import { UserPlus, Users, ShieldCheck, Dumbbell, GraduationCap } from 'lucide-react'
import { UsersTable } from '@/components/admin/users-table'
import { CreateAdminDialog } from '@/components/admin/create-admin-dialog'

export const dynamic = 'force-dynamic'

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos os papéis' },
  { value: 'global_admin', label: 'Admin Global' },
  { value: 'personal', label: 'Personal' },
  { value: 'student', label: 'Aluno' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'suspended', label: 'Suspenso' },
]

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string; tenant?: string; page?: string }>
}) {
  const sp = await searchParams
  const roleFilter   = sp.role   ?? ''
  const statusFilter = sp.status ?? ''
  const search       = sp.q      ?? ''
  const tenantFilter = sp.tenant ?? ''
  const page         = Math.max(1, parseInt(sp.page ?? '1'))
  const pageSize     = 20
  const offset       = (page - 1) * pageSize

  const adminClient = createAdminClient()

  // Build query
  let query = adminClient
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      status,
      tenant_id,
      must_change_password,
      created_at,
      tenants!profiles_tenant_id_fkey (
        id,
        business_name,
        slug
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (roleFilter)   query = query.eq('role', roleFilter)
  if (statusFilter) query = query.eq('status', statusFilter)
  if (tenantFilter) query = query.eq('tenant_id', tenantFilter)
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: users, count } = await query

  // Metrics
  const { count: totalAdmins }    = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'global_admin')
  const { count: totalPersonals } = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'personal')
  const { count: totalStudents }  = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')
  const { count: totalSuspended } = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'suspended')

  // Tenant list for filter
  const { data: tenants } = await adminClient
    .from('tenants')
    .select('id, business_name')
    .eq('status', 'active')
    .order('business_name')

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Usuários
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gestão de todos os usuários da plataforma
          </p>
        </div>
        <CreateAdminDialog />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ShieldCheck}
          label="Admins globais"
          value={totalAdmins ?? 0}
          color="text-brand-lime"
          bg="bg-brand-lime/10"
        />
        <MetricCard
          icon={Dumbbell}
          label="Personals"
          value={totalPersonals ?? 0}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <MetricCard
          icon={GraduationCap}
          label="Alunos"
          value={totalStudents ?? 0}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <MetricCard
          icon={Users}
          label="Suspensos"
          value={totalSuspended ?? 0}
          color="text-status-error"
          bg="bg-status-error/10"
        />
      </div>

      {/* Tabela */}
      <UsersTable
        users={(users ?? []) as UserRow[]}
        tenants={tenants ?? []}
        total={count ?? 0}
        page={page}
        totalPages={totalPages}
        currentFilters={{ role: roleFilter, status: statusFilter, q: search, tenant: tenantFilter }}
        roleOptions={ROLE_FILTER_OPTIONS}
        statusOptions={STATUS_FILTER_OPTIONS}
      />
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────
export interface UserRow {
  id: string
  full_name: string | null
  email: string
  role: 'global_admin' | 'personal' | 'student'
  status: 'active' | 'inactive' | 'suspended'
  tenant_id: string | null
  must_change_password: boolean
  created_at: string
  tenants: { id: string; business_name: string; slug: string } | null
}

// ── Components ────────────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-xl font-display font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  )
}
