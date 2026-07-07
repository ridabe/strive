import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, AlertTriangle, Archive } from 'lucide-react'
import { getCtx } from '@/lib/supabase/context'
import { getInventoryItems } from '@/app/actions/estoque'

export default async function EstoquePage() {
  const ctx = await getCtx()
  if (!ctx) redirect('/login')

  // Verificar se o módulo está habilitado para este tenant
  const { data: tenantModule } = await ctx.supabase
    .from('tenant_modules')
    .select('enabled, system_modules!inner(slug)')
    .eq('tenant_id', ctx.tenantId)
    .eq('system_modules.slug', 'estoque')
    .single()

  if (!tenantModule?.enabled) redirect('/dashboard')

  // Exclusivo para academias — defesa em profundidade (RLS já garante isso no banco)
  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', ctx.tenantId)
    .single()

  if (tenant?.tenant_type !== 'academia') redirect('/dashboard')

  const items = await getInventoryItems()
  const lowStock = items.filter((i) => i.quantity_on_hand <= i.min_quantity)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Estoque
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {items.length} {items.length === 1 ? 'item ativo' : 'itens ativos'}
            {lowStock.length > 0 && ` · ${lowStock.length} abaixo do mínimo`}
          </p>
        </div>
        <Link
          href="/dashboard/estoque/novo"
          className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity whitespace-nowrap sm:w-auto"
        >
          <Plus size={15} />
          Novo item
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 bg-status-warning/10 border border-status-warning/20 rounded-xl p-4">
          <AlertTriangle size={18} className="text-status-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-status-warning">
              {lowStock.length} {lowStock.length === 1 ? 'item está' : 'itens estão'} abaixo do estoque mínimo
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {lowStock.map((i) => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <Package size={22} className="text-brand-lime" />
          </div>
          <p className="font-body font-medium text-text-primary">Nenhum item cadastrado</p>
          <p className="text-sm text-text-secondary">
            Cadastre suplementos, equipamentos ou produtos para controlar entradas e saídas.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Item</th>
                  <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium">Em estoque</th>
                  <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Mínimo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((item) => {
                  const low = item.quantity_on_hand <= item.min_quantity
                  return (
                    <tr key={item.id} className="hover:bg-surface-border/10 group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-surface-border/50 flex items-center justify-center flex-shrink-0">
                            <Archive size={14} className="text-text-secondary/40" />
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/estoque/${item.id}`}
                              className="text-text-primary font-medium hover:text-brand-lime transition-colors"
                            >
                              {item.name}
                            </Link>
                            {item.sku && (
                              <p className="text-xs text-text-secondary/60">{item.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary hidden md:table-cell">
                        {item.category ?? '—'}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-medium ${low ? 'text-status-warning' : 'text-text-primary'}`}>
                        {item.quantity_on_hand} {item.unit}
                      </td>
                      <td className="px-4 py-3.5 text-right text-text-secondary hidden sm:table-cell">
                        {item.min_quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/estoque/${item.id}`}
                            className="text-xs text-text-secondary hover:text-brand-lime transition-colors"
                          >
                            Ver
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
