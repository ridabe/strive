import Link from 'next/link'
import { UserPlus, Search, Users, UserCheck, UserX, KeyRound } from 'lucide-react'
import { getCtx } from '@/lib/supabase/context'
import { listTenantMembers } from '@/actions/tenant-members'
import { AssignPersonalSelect } from './assign-personal-select'

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const params = await searchParams
  const ctx    = await getCtx()

  const q      = params.q?.trim() ?? ''
  const status = params.status ?? 'active'

  if (!ctx) {
    return null
  }

  const { supabase, tenantId, role } = ctx

  // Atribuição de personal só faz sentido numa academia, e só owner/admin
  // podem reatribuir (personal opera só a leitura, RLS já filtra a lista dele).
  const { data: tenant } = await supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', tenantId)
    .single()

  const isAcademia = tenant?.tenant_type === 'academia'
  const canAssign  = isAcademia && ['owner', 'admin'].includes(role)

  const memberOptions = canAssign
    ? (await listTenantMembers())
        .filter((m) => m.status === 'active')
        .map((m) => ({ id: m.id, label: m.full_name ?? m.email ?? 'Sem nome' }))
    : []

  // Busca alunos do tenant (RLS garante isolamento — para personal de academia,
  // a lista já vem filtrada só com os alunos atribuídos a ele).
  let query = supabase
    .from('students')
    .select('id, full_name, email, phone, status, goal, created_at, user_id, assigned_personal_id')
    .order('full_name')

  if (status !== 'all') query = query.eq('status', status)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: students } = await query

  // Alunos com conta (user_id) que ainda precisam trocar a senha provisória
  const userIds = (students ?? []).map((s) => s.user_id).filter(Boolean) as string[]
  const mustChangePasswordIds = new Set<string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, must_change_password')
      .in('id', userIds)
      .eq('must_change_password', true)
    profiles?.forEach((p) => mustChangePasswordIds.add(p.id))
  }

  const [{ count: activeCount }, { count: inactiveCount }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
  ])

  const total = (activeCount ?? 0) + (inactiveCount ?? 0)

  return (
    <div className="p-4 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Alunos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {total} aluno{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/alunos/novo"
          className="flex w-full items-center justify-center gap-2 bg-brand-lime text-background font-body font-semibold text-sm px-4 py-3 rounded-lg hover:bg-brand-lime/90 transition-colors flex-shrink-0 sm:w-auto"
        >
          <UserPlus size={16} />
          Novo aluno
        </Link>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total',    value: total,            icon: Users,      color: 'text-text-primary' },
          { label: 'Ativos',   value: activeCount ?? 0,   icon: UserCheck,  color: 'text-status-success' },
          { label: 'Inativos', value: inactiveCount ?? 0, icon: UserX,      color: 'text-text-secondary' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-surface border border-surface-border rounded-xl p-4 flex items-center gap-3">
              <Icon size={18} className={s.color} />
              <div>
                <p className="font-body font-bold text-xl text-text-primary">{s.value}</p>
                <p className="text-xs text-text-secondary">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome..."
            className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30"
          />
          {params.status && <input type="hidden" name="status" value={params.status} />}
        </form>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-1">
          {[
            { value: 'active',   label: 'Ativos'  },
            { value: 'inactive', label: 'Inativos' },
            { value: 'all',      label: 'Todos'   },
          ].map((opt) => (
            <Link
              key={opt.value}
              href={`?status=${opt.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={`px-3 py-2 rounded-lg text-center text-sm font-body font-medium transition-colors ${
                status === opt.value
                  ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                  : 'text-text-secondary hover:text-text-primary border border-surface-border'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      {(students?.length ?? 0) === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
          <Users size={32} className="text-text-secondary/40 mx-auto" />
          <div>
            <p className="font-body font-medium text-text-primary">
              {q ? `Nenhum aluno encontrado para "${q}"` : 'Nenhum aluno cadastrado ainda'}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {q ? 'Tente outra busca.' : 'Clique em "Novo aluno" para começar.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="divide-y divide-surface-border">
            {students?.map((student) => {
              const rowInner = (
                <>
                  {/* Avatar inicial */}
                  <div className="w-9 h-9 rounded-full bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-display font-bold text-brand-lime">
                      {student.full_name[0].toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-text-primary text-sm truncate">{student.full_name}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {student.email ?? student.phone ?? 'Sem contato cadastrado'}
                    </p>
                    {student.user_id && mustChangePasswordIds.has(student.user_id) && (
                      <p className="flex items-center gap-1 text-xs text-status-warning mt-0.5">
                        <KeyRound size={11} />
                        Deve alterar senha provisória
                      </p>
                    )}
                  </div>
                </>
              )

              const statusBadge = (
                <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${
                  student.status === 'active'
                    ? 'text-status-success bg-status-success/10 border-status-success/20'
                    : 'text-text-secondary bg-background border-surface-border'
                }`}>
                  {student.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              )

              // Quando o owner/admin de uma academia pode reatribuir, a linha
              // deixa de ser um único <Link> (para não aninhar um <select>
              // dentro de um elemento clicável) — o nome vira o link, e o
              // seletor fica ao lado, fora do link.
              if (canAssign) {
                return (
                  <div
                    key={student.id}
                    className="flex items-start gap-3 px-4 py-4 sm:items-center sm:gap-4 sm:px-5"
                  >
                    <Link href={`/dashboard/alunos/${student.id}`} className="flex items-start gap-3 flex-1 min-w-0 sm:items-center sm:gap-4 hover:opacity-80 transition-opacity">
                      {rowInner}
                    </Link>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {student.goal && (
                        <p className="hidden sm:block text-xs text-text-secondary/70 truncate max-w-[140px] text-right">
                          {student.goal}
                        </p>
                      )}
                      {statusBadge}
                      <AssignPersonalSelect
                        studentId={student.id}
                        currentAssignedId={student.assigned_personal_id}
                        options={memberOptions}
                      />
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={student.id}
                  href={`/dashboard/alunos/${student.id}`}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-surface-border/20 transition-colors sm:items-center sm:gap-4 sm:px-5"
                >
                  {rowInner}

                  {/* Goal */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {student.goal && (
                      <p className="hidden sm:block text-xs text-text-secondary/70 truncate max-w-[140px] text-right">
                        {student.goal}
                      </p>
                    )}
                    {statusBadge}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
