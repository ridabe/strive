'use client'

import { useState, useTransition } from 'react'
import { Pencil, X, Loader2, Check } from 'lucide-react'
import { updateAcademiaTenant } from '@/actions/admin-academias'

interface Tenant {
  id: string
  business_name: string
  plan: 'free' | 'pro' | 'premium'
  max_students: number
  max_personals: number
  self_assign_enabled: boolean
  abacatepay_customer_id: string | null
  notes: string | null
}

interface Props {
  tenant: Tenant
}

const PLAN_LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' }

export function AcademiaEditForm({ tenant }: Props) {
  const [editing, setEditing] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateAcademiaTenant(tenant.id, formData)
      if (result?.error) {
        setError(result.error)
      }
      // se redirect(), não chega aqui
    })
  }

  if (!editing) {
    return (
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-body font-semibold text-text-primary">Plano e limites</h2>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-lime transition-colors"
          >
            <Pencil size={14} /> Editar
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <Field label="Nome da academia" value={tenant.business_name} span />
          <Field label="Plano" value={PLAN_LABELS[tenant.plan]} />
          <Field label="Máx. personais/admins" value={String(tenant.max_personals)} />
          <Field label="Máx. alunos" value={String(tenant.max_students)} />
          <Field label="Autoatribuição" value={tenant.self_assign_enabled ? 'Ativada' : 'Desativada'} />
          <Field label="ID AbacatePay" value={tenant.abacatepay_customer_id ?? '—'} />
          {tenant.notes && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">Observações</p>
              <p className="text-sm text-text-primary">{tenant.notes}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
        <h2 className="font-body font-semibold text-text-primary">Editar plano e limites</h2>
        <button
          type="button"
          onClick={() => { setEditing(false); setError(null) }}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={14} /> Cancelar
        </button>
      </div>

      <div className="p-6 space-y-5">

        <EditField label="Nome da academia" name="business_name" defaultValue={tenant.business_name} required span />

        <div className="space-y-2">
          <p className="text-sm font-body font-medium text-text-secondary">Plano</p>
          <div className="grid grid-cols-3 gap-3">
            {(['free', 'pro', 'premium'] as const).map((p) => (
              <label
                key={p}
                className="relative flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer hover:border-brand-lime/50 transition-colors has-[:checked]:border-brand-lime has-[:checked]:bg-brand-lime/5 border-surface-border"
              >
                <input
                  type="radio"
                  name="plan"
                  value={p}
                  defaultChecked={tenant.plan === p}
                  className="sr-only"
                />
                <span className="font-body font-semibold text-text-primary text-sm capitalize">{PLAN_LABELS[p]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditField label="Máx. personais/admins" name="max_personals" type="number" defaultValue={String(tenant.max_personals)} required />
          <EditField label="Máx. alunos" name="max_students" type="number" defaultValue={String(tenant.max_students)} />
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-surface-border p-3 cursor-pointer hover:border-brand-lime/40 transition-colors">
          <input
            type="checkbox"
            name="self_assign_enabled"
            defaultChecked={tenant.self_assign_enabled}
            className="mt-0.5 h-4 w-4 rounded border-surface-border accent-brand-lime"
          />
          <span>
            <span className="block text-sm font-body font-medium text-text-primary">
              Permitir autoatribuição
            </span>
            <span className="block text-xs text-text-secondary mt-0.5">
              Personais (não só owner/admin) podem se autoatribuir a alunos ainda não atribuídos.
            </span>
          </span>
        </label>

        <EditField
          label="ID de cliente AbacatePay"
          name="abacatepay_customer_id"
          defaultValue={tenant.abacatepay_customer_id ?? ''}
          mono
        />

        <div className="space-y-1.5">
          <label htmlFor="notes" className="block text-sm font-body font-medium text-text-secondary">
            Observações internas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={tenant.notes ?? ''}
            className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Salvar alterações
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setError(null) }}
            disabled={isPending}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  )
}

// helpers
function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={`space-y-1 ${span ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  )
}

function EditField({
  label, name, type = 'text', defaultValue, required, span, mono,
}: {
  label: string; name: string; type?: string
  defaultValue?: string; required?: boolean; span?: boolean; mono?: boolean
}) {
  return (
    <div className={`space-y-1.5 ${span ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={name} className="block text-sm font-body font-medium text-text-secondary">
        {label}{required && <span className="text-status-error ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={`w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}
