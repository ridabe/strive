import { createAdminClient } from '@/lib/supabase/admin'
import type { AppRole, ProfileStatus } from '@/types/db-enums'
import { Users, ShieldCheck, Dumbbell, GraduationCap } from 'lucide-react'
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

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

/**
 * Normaliza o tamanho de página vindo da URL para evitar valores inválidos.
 */
function getPageSize(rawValue?: string): number {
  const parsedValue = Number.parseInt(rawValue ?? '', 10)
  return PAGE_SIZE_OPTIONS.includes(parsedValue as (typeof PAGE_SIZE_OPTIONS)[number])
    ? parsedValue
    : PAGE_SIZE_OPTIONS[0]
}

/**
 * Constrói a lista canônica do admin global unindo perfis com alunos sem perfil/conta.
 */
function buildUserRows({
  profiles,
  students,
  tenants,
}: {
  profiles: ProfileRecord[]
  students: StudentRecord[]
  tenants: TenantRecord[]
}): UserRow[] {
  const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]))
  const profileIds = new Set(profiles.map((profile) => profile.id))
  const studentIdsByUserId = new Map(
    students
      .filter((student) => !!student.user_id)
      .map((student) => [student.user_id as string, student.id])
  )

  const profileRows: UserRow[] = profiles.map((profile) => ({
    id: profile.id,
    student_id: studentIdsByUserId.get(profile.id) ?? null,
    auth_user_id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    tenant_id: profile.tenant_id,
    must_change_password: profile.must_change_password,
    created_at: profile.created_at,
    tenants: profile.tenant_id ? tenantsById.get(profile.tenant_id) ?? null : null,
    source: 'profile',
    account_state: 'managed',
    is_manageable: true,
  }))

  const studentOnlyRows: UserRow[] = students
    .filter((student) => !student.user_id || !profileIds.has(student.user_id))
    .map((student) => ({
      id: `student:${student.id}`,
      student_id: student.id,
      auth_user_id: student.user_id,
      full_name: student.full_name,
      email: student.email,
      role: 'student',
      status: student.status,
      tenant_id: student.tenant_id,
      must_change_password: false,
      created_at: student.created_at,
      tenants: student.tenant_id ? tenantsById.get(student.tenant_id) ?? null : null,
      source: 'student_only',
      account_state: student.user_id ? 'missing_profile' : 'missing_auth',
      is_manageable: false,
    }))

  return [...profileRows, ...studentOnlyRows].sort(
    (currentUser, nextUser) =>
      new Date(nextUser.created_at).getTime() - new Date(currentUser.created_at).getTime()
  )
}

/**
 * Aplica os filtros da tela sobre a coleção unificada de registros.
 */
function filterUserRows({
  rows,
  roleFilter,
  statusFilter,
  tenantFilter,
  search,
}: {
  rows: UserRow[]
  roleFilter: string
  statusFilter: string
  tenantFilter: string
  search: string
}): UserRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return rows.filter((row) => {
    const matchesRole = !roleFilter || row.role === roleFilter
    const matchesStatus = !statusFilter || row.status === statusFilter
    const matchesTenant = !tenantFilter || row.tenant_id === tenantFilter
    const matchesSearch =
      !normalizedSearch ||
      (row.full_name ?? '').toLowerCase().includes(normalizedSearch) ||
      (row.email ?? '').toLowerCase().includes(normalizedSearch)

    return matchesRole && matchesStatus && matchesTenant && matchesSearch
  })
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string; tenant?: string; page?: string; pageSize?: string }>
}) {
  const sp = await searchParams
  const roleFilter   = sp.role   ?? ''
  const statusFilter = sp.status ?? ''
  const search       = sp.q      ?? ''
  const tenantFilter = sp.tenant ?? ''
  const page         = Math.max(1, parseInt(sp.page ?? '1'))
  const pageSize     = getPageSize(sp.pageSize)

  const adminClient = createAdminClient()

  const [{ data: profiles }, { data: students }, { data: tenants }] = await Promise.all([
    adminClient
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        status,
        tenant_id,
        must_change_password,
        created_at
      `),
    adminClient
      .from('students')
      .select(`
        id,
        user_id,
        full_name,
        email,
        status,
        tenant_id,
        created_at
      `),
    adminClient
      .from('tenants')
      .select('id, business_name, slug')
      .order('business_name'),
  ])

  const allRows = buildUserRows({
    profiles: (profiles ?? []) as ProfileRecord[],
    students: (students ?? []) as StudentRecord[],
    tenants: (tenants ?? []) as TenantRecord[],
  })

  const tenantOptions: TenantOption[] = ((tenants ?? []) as TenantRecord[]).map((tenant) => {
    const personalProfile = (profiles ?? []).find(
      (profile) => profile.role === 'personal' && profile.tenant_id === tenant.id
    )

    return {
      id: tenant.id,
      business_name: tenant.business_name,
      slug: tenant.slug,
      personal_name: personalProfile?.full_name ?? null,
    }
  })

  const filteredRows = filterUserRows({
    rows: allRows,
    roleFilter,
    statusFilter,
    tenantFilter,
    search,
  })

  const total = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const offset = (currentPage - 1) * pageSize
  const users = filteredRows.slice(offset, offset + pageSize)

  const totalAdmins = allRows.filter((row) => row.role === 'global_admin').length
  const totalPersonals = allRows.filter((row) => row.role === 'personal').length
  const totalStudents = (students ?? []).length
  const totalSuspended = allRows.filter((row) => row.status === 'suspended').length

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Usuários
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gestão de todos os usuários e alunos cadastrados na plataforma
          </p>
        </div>
        <CreateAdminDialog />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ShieldCheck}
          label="Admins globais"
          value={totalAdmins}
          color="text-brand-lime"
          bg="bg-brand-lime/10"
        />
        <MetricCard
          icon={Dumbbell}
          label="Personals"
          value={totalPersonals}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <MetricCard
          icon={GraduationCap}
          label="Alunos"
          value={totalStudents}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <MetricCard
          icon={Users}
          label="Suspensos"
          value={totalSuspended}
          color="text-status-error"
          bg="bg-status-error/10"
        />
      </div>

      {/* Tabela */}
      <UsersTable
        users={users}
        tenants={tenantOptions}
        total={total}
        page={currentPage}
        pageSize={pageSize}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
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
  student_id: string | null
  auth_user_id: string | null
  full_name: string | null
  email: string | null
  role: 'global_admin' | 'personal' | 'student'
  status: 'active' | 'inactive' | 'suspended'
  tenant_id: string | null
  must_change_password: boolean
  created_at: string
  tenants: { id: string; business_name: string; slug: string | null } | null
  source: 'profile' | 'student_only'
  account_state: 'managed' | 'missing_auth' | 'missing_profile'
  is_manageable: boolean
}

interface ProfileRecord {
  id: string
  full_name: string | null
  email: string | null
  role: AppRole
  status: ProfileStatus
  tenant_id: string | null
  must_change_password: boolean
  created_at: string
}

interface StudentRecord {
  id: string
  user_id: string | null
  full_name: string | null
  email: string | null
  status: 'active' | 'inactive'
  tenant_id: string | null
  created_at: string
}

interface TenantRecord {
  id: string
  business_name: string
  slug: string | null
}

export interface TenantOption {
  id: string
  business_name: string
  slug: string | null
  personal_name: string | null
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
