'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createInventoryItem, updateInventoryItem, type InventoryItem } from '@/app/actions/estoque'

interface Props {
  item?: InventoryItem
  redirectTo: string
}

const FIELD = 'w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime transition-colors'
const LABEL = 'block text-xs font-body font-medium text-text-secondary uppercase tracking-widest mb-1.5'

export function InventoryItemForm({ item, redirectTo }: Props) {
  const router = useRouter()
  const isEdit = !!item
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsPending(true)

    const fd = new FormData(e.currentTarget)
    const result = isEdit
      ? await updateInventoryItem(item!.id, fd)
      : await createInventoryItem(fd)

    if (result.error) {
      setError(result.error)
      setIsPending(false)
      return
    }

    router.push(redirectTo)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      <div>
        <label className={LABEL}>Nome do item *</label>
        <input
          name="name"
          required
          defaultValue={item?.name}
          placeholder="ex: Whey Protein 900g"
          className={FIELD}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>SKU / código</label>
          <input name="sku" defaultValue={item?.sku ?? ''} placeholder="ex: WP-900" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Categoria</label>
          <input name="category" defaultValue={item?.category ?? ''} placeholder="ex: Suplementos" className={FIELD} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={LABEL}>Unidade</label>
          <input name="unit" defaultValue={item?.unit ?? 'un'} placeholder="un" className={FIELD} />
        </div>
        {!isEdit && (
          <div>
            <label className={LABEL}>Estoque inicial</label>
            <input name="quantity_on_hand" type="number" min={0} step="any" defaultValue={0} className={FIELD} />
          </div>
        )}
        <div>
          <label className={LABEL}>Estoque mínimo</label>
          <input name="min_quantity" type="number" min={0} step="any" defaultValue={item?.min_quantity ?? 0} className={FIELD} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Custo unitário (R$)</label>
          <input name="unit_cost" type="number" min={0} step="0.01" defaultValue={item?.unit_cost ?? ''} placeholder="0,00" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Preço de venda (R$)</label>
          <input name="sale_price" type="number" min={0} step="0.01" defaultValue={item?.sale_price ?? ''} placeholder="0,00" className={FIELD} />
        </div>
      </div>

      <div>
        <label className={LABEL}>Observações</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={item?.notes ?? ''}
          placeholder="Notas internas sobre o item..."
          className={`${FIELD} resize-none`}
        />
      </div>

      {isEdit && (
        <p className="text-xs text-text-secondary/70">
          A quantidade em estoque não é editada aqui — use &quot;Registrar movimento&quot; para entradas, saídas ou ajustes.
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-3">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(redirectTo)}
          className="px-5 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Salvar alterações' : 'Criar item'}
        </button>
      </div>
    </form>
  )
}
