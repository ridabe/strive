import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'
import { getCtx } from '@/lib/supabase/context'
import { getInventoryItems, getInventoryMovements } from '@/app/actions/estoque'
import { InventoryItemForm } from '@/components/estoque/inventory-item-form'
import { RegisterMovementForm } from '@/components/estoque/register-movement-form'
import { ToggleActiveButton } from '@/components/estoque/toggle-active-button'

const MOVEMENT_CONFIG = {
  entrada: { label: 'Entrada', icon: ArrowDownCircle, color: 'text-status-success' },
  saida:   { label: 'Saída',   icon: ArrowUpCircle,   color: 'text-status-error'   },
  ajuste:  { label: 'Ajuste',  icon: SlidersHorizontal, color: 'text-text-secondary' },
} as const

interface Props {
  params: Promise<{ id: string }>
}

export default async function ItemEstoquePage({ params }: Props) {
  const { id } = await params
  const ctx = await getCtx()
  if (!ctx) redirect('/login')

  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', ctx.tenantId)
    .single()

  if (tenant?.tenant_type !== 'academia') redirect('/dashboard')

  // getInventoryItems() já filtra por tenant via RLS/ctx — buscamos incluindo
  // inativos para permitir reativar/consultar histórico de itens desativados.
  const items = await getInventoryItems(true)
  const item = items.find((i) => i.id === id)
  if (!item) notFound()

  const movements = await getInventoryMovements(id)

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/estoque" className="hover:text-text-primary transition-colors">
          Estoque
        </Link>
        <span>/</span>
        <span className="text-text-primary">{item.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            {item.name}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {item.quantity_on_hand} {item.unit} em estoque
            {!item.is_active && ' · inativo'}
          </p>
        </div>
        <ToggleActiveButton itemId={item.id} isActive={item.is_active} />
      </div>

      <RegisterMovementForm itemId={item.id} unit={item.unit} />

      <div>
        <p className="text-sm font-body font-medium text-text-primary mb-3">Dados do item</p>
        <InventoryItemForm item={item} redirectTo="/dashboard/estoque" />
      </div>

      <div>
        <p className="text-sm font-body font-medium text-text-primary mb-3">Histórico de movimentos</p>
        {movements.length === 0 ? (
          <div className="bg-surface border border-surface-border rounded-xl p-6 text-center text-sm text-text-secondary">
            Nenhum movimento registrado ainda.
          </div>
        ) : (
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Tipo</th>
                    <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium">Quantidade</th>
                    <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Motivo</th>
                    <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Por</th>
                    <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {movements.map((m) => {
                    const cfg = MOVEMENT_CONFIG[m.type]
                    const Icon = cfg.icon
                    return (
                      <tr key={m.id} className="hover:bg-surface-border/10">
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                            <Icon size={13} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-text-primary font-medium">
                          {m.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary hidden sm:table-cell truncate max-w-[160px]">
                          {m.reason ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary hidden md:table-cell">
                          {m.created_by_name ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary">
                          {new Date(m.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
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
    </div>
  )
}
