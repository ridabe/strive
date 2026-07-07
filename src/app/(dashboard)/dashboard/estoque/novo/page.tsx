import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCtx } from '@/lib/supabase/context'
import { InventoryItemForm } from '@/components/estoque/inventory-item-form'

export default async function NovoItemEstoquePage() {
  const ctx = await getCtx()
  if (!ctx) redirect('/login')

  const { data: tenant } = await ctx.supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', ctx.tenantId)
    .single()

  if (tenant?.tenant_type !== 'academia') redirect('/dashboard')

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/estoque" className="hover:text-text-primary transition-colors">
          Estoque
        </Link>
        <span>/</span>
        <span className="text-text-primary">Novo item</span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Novo Item
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Cadastre um item de estoque para começar a controlar entradas e saídas.
        </p>
      </div>

      <InventoryItemForm redirectTo="/dashboard/estoque" />
    </div>
  )
}
