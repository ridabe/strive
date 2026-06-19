'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface LogRow {
  id: string
  action: string
  category: string
  description: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

interface LogsTableProps {
  logs: LogRow[]
  total: number
  page: number
  pageSize: number
  filters: {
    category?: string
    q?: string
    from?: string
    to?: string
  }
}

const CATEGORIES = [
  { value: 'all',    label: 'Todas' },
  { value: 'auth',   label: 'Autenticação' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'user',   label: 'Usuário' },
  { value: 'system', label: 'Sistema' },
]

const CATEGORY_COLORS: Record<string, string> = {
  auth:   'text-brand-lime    bg-brand-lime/10    border-brand-lime/20',
  tenant: 'text-status-warning bg-status-warning/10 border-status-warning/20',
  user:   'text-blue-400       bg-blue-400/10      border-blue-400/20',
  system: 'text-text-secondary bg-surface-border/30 border-surface-border',
}

export function LogsTable({ logs, total, page, pageSize, filters }: LogsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.ceil(total / pageSize)

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset pagination on filter change
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams]
  )

  const setPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(p))
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams]
  )

  const hasActiveFilters =
    (filters.category && filters.category !== 'all') ||
    filters.q ||
    filters.from ||
    filters.to

  return (
    <div className={`space-y-4 transition-opacity ${isPending ? 'opacity-60' : ''}`}>

      {/* ── Filtros ── */}
      <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">

          {/* Busca por texto */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              defaultValue={filters.q ?? ''}
              onChange={(e) => updateFilter('q', e.target.value || undefined)}
              className="w-full bg-background border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 transition-colors"
            />
          </div>

          {/* Filtro de categoria */}
          <select
            value={filters.category ?? 'all'}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60 transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Data início */}
          <input
            type="date"
            defaultValue={filters.from ?? ''}
            onChange={(e) => updateFilter('from', e.target.value || undefined)}
            className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60 transition-colors"
          />

          {/* Data fim */}
          <input
            type="date"
            defaultValue={filters.to ?? ''}
            onChange={(e) => updateFilter('to', e.target.value || undefined)}
            className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60 transition-colors"
          />

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                startTransition(() => router.push(pathname))
              }}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-status-error transition-colors px-2"
            >
              <X size={14} /> Limpar
            </button>
          )}
        </div>

        <p className="text-xs text-text-secondary">
          {total === 0 ? 'Nenhum registro encontrado' : `${total} registro${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-text-secondary text-sm">
            Nenhum log para exibir com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-4 py-3 text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-body font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    IP
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
                    Data/Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-body font-semibold px-2 py-0.5 rounded-full border ${
                          CATEGORY_COLORS[log.category] ?? CATEGORY_COLORS.system
                        }`}
                      >
                        {CATEGORIES.find((c) => c.value === log.category)?.label ?? log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-text-secondary bg-background px-2 py-1 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary max-w-xs">
                      <p className="truncate" title={log.description}>
                        {log.description}
                      </p>
                      {log.target_type && log.target_id && (
                        <p className="text-xs text-text-secondary/60 mt-0.5 truncate">
                          {log.target_type}: {log.target_id}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary/60 text-xs font-mono hidden lg:table-cell">
                      {log.ip_address ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-lime/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-lime/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
