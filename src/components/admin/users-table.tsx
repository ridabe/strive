'use client'

import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Search, Filter, ChevronLeft, ChevronRight,
  ShieldCheck, Dumbbell, GraduationCap, AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { TenantOption, UserRow } from '@/app/(admin)/admin/usuarios/page'
import { UserActionsDropdown } from './user-actions-dropdown'

interface FilterOption { value: string; label: string }

interface Props {
  users: UserRow[]
  tenants: TenantOption[]
  total: number
  page: number
  pageSize: number
  pageSizeOptions: number[]
  totalPages: number
  currentFilters: { role: string; status: string; q: string; tenant: string }
  roleOptions: FilterOption[]
  statusOptions: FilterOption[]
}

const ROLE_CONFIG = {
  global_admin: { label: 'Admin Global', icon: ShieldCheck, color: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20' },
  personal:     { label: 'Personal',     icon: Dumbbell,    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  student:      { label: 'Aluno',        icon: GraduationCap, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
}

const STATUS_CONFIG = {
  active:    { label: 'Ativo',    color: 'text-status-success bg-status-success/10 border-status-success/20' },
  inactive:  { label: 'Inativo', color: 'text-text-secondary bg-surface-border/40 border-surface-border' },
  suspended: { label: 'Suspenso', color: 'text-status-error bg-status-error/10 border-status-error/20' },
}

const ACCOUNT_STATE_CONFIG = {
  managed: { label: 'Conta ativa', color: 'text-status-success bg-status-success/10 border-status-success/20' },
  missing_auth: { label: 'Sem acesso', color: 'text-status-warning bg-status-warning/10 border-status-warning/20' },
  missing_profile: { label: 'Conta sem perfil', color: 'text-status-warning bg-status-warning/10 border-status-warning/20' },
}

/**
 * Gera a janela de páginas visíveis para manter a navegação enxuta.
 */
function getVisiblePages(page: number, totalPages: number): number[] {
  const firstPage = Math.max(1, page - 2)
  const lastPage = Math.min(totalPages, page + 2)
  const pages: number[] = []

  for (let currentPage = firstPage; currentPage <= lastPage; currentPage += 1) {
    pages.push(currentPage)
  }

  return pages
}

/**
 * Renderiza a tabela paginada e filtrável da área global de usuários.
 */
export function UsersTable({
  users,
  tenants,
  total,
  page,
  pageSize,
  pageSizeOptions,
  totalPages,
  currentFilters,
  roleOptions,
  statusOptions,
}: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const sp          = useSearchParams()
  const [, startTransition] = useTransition()

  /**
   * Atualiza a query string preservando o restante do estado da tela.
   */
  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  /**
   * Dispara a busca textual por nome ou e-mail.
   */
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
    updateParam('q', q)
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, total)
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">

      {/* Barra de filtros */}
      <div className="px-4 py-3 border-b border-surface-border flex flex-wrap items-center gap-3">

        {/* Busca */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
            <input
              name="q"
              defaultValue={currentFilters.q}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-surface-border rounded-lg text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime/50"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-background border border-surface-border rounded-lg text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Filtro por papel */}
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-text-secondary/50 flex-shrink-0" />
          <select
            value={currentFilters.role}
            onChange={(e) => updateParam('role', e.target.value)}
            className="text-sm bg-background border border-surface-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-lime/50"
          >
            {roleOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Filtro por status */}
        <select
          value={currentFilters.status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="text-sm bg-background border border-surface-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-lime/50"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Filtro por tenant */}
        <select
          value={currentFilters.tenant}
          onChange={(e) => updateParam('tenant', e.target.value)}
          className="text-sm bg-background border border-surface-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-lime/50"
        >
          <option value="">Todos os clientes</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.business_name}</option>
          ))}
        </select>

        {/* Tamanho da página */}
        <select
          value={String(pageSize)}
          onChange={(e) => updateParam('pageSize', e.target.value)}
          className="text-sm bg-background border border-surface-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-lime/50"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size} linhas</option>
          ))}
        </select>

        {/* Total */}
        <span className="ml-auto text-xs text-text-secondary flex-shrink-0">
          {total} registro{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      {users.length === 0 ? (
        <div className="py-20 text-center">
          <AlertCircle size={32} className="text-text-secondary/30 mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">Usuário</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">Papel</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">Acesso</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">Criado em</th>
                <th className="text-right px-4 py-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {users.map((user) => {
                const roleCfg   = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]
                const statusCfg = STATUS_CONFIG[user.status as keyof typeof STATUS_CONFIG]
                const accountCfg = ACCOUNT_STATE_CONFIG[user.account_state]
                const RoleIcon  = roleCfg?.icon ?? GraduationCap
                const displayName = user.full_name ?? user.email ?? 'Sem identificação'
                const displayInitial = displayName.charAt(0).toUpperCase()

                return (
                  <tr key={user.id} className="hover:bg-background/50 transition-colors">

                    {/* Usuário */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${roleCfg?.color ?? ''} border`}>
                          {displayInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-text-secondary truncate">{user.email ?? 'Sem e-mail'}</p>
                          {user.must_change_password && (
                            <span className="text-xs text-status-warning">• Deve alterar senha</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Papel */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${roleCfg?.color ?? ''}`}>
                        <RoleIcon size={11} />
                        {roleCfg?.label ?? user.role}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      {user.tenants ? (
                        <span className="text-sm text-text-primary">{user.tenants.business_name}</span>
                      ) : (
                        <span className="text-xs text-text-secondary/50">—</span>
                      )}
                    </td>

                    {/* Acesso */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${accountCfg.color}`}>
                        {accountCfg.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg?.color ?? ''}`}>
                        {statusCfg?.label ?? user.status}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                      {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      <UserActionsDropdown user={user} tenants={tenants} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-surface-border flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            {start}–{end} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => updateParam('page', '1')}
              className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Primeira
            </button>
            <button
              disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1))}
              className="p-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {visiblePages.map((visiblePage) => (
              <button
                key={visiblePage}
                onClick={() => updateParam('page', String(visiblePage))}
                className={`min-w-8 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                  visiblePage === page
                    ? 'border-brand-lime bg-brand-lime text-background'
                    : 'border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-lime/40'
                }`}
              >
                {visiblePage}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => updateParam('page', String(page + 1))}
              className="p-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParam('page', String(totalPages))}
              className="px-2.5 py-1.5 rounded-lg border border-surface-border text-xs text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Última
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
