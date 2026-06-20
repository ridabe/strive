'use client'

import { useState, useRef, useTransition } from 'react'
import { Pencil, X, Upload, Loader2, Check } from 'lucide-react'
import Image from 'next/image'
import { updateClient } from '@/app/actions/clients'

interface Tenant {
  id: string
  business_name: string
  plan: 'free' | 'pro' | 'premium'
  primary_color: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
}

interface Profile {
  full_name: string | null
  email: string
}

interface Props {
  tenant: Tenant
  profile: Profile
}

const PLAN_LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' }

export function ClientEditForm({ tenant, profile }: Props) {
  const [editing, setEditing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo deve ter no máximo 2MB.')
      return
    }
    setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateClient(tenant.id, formData)
      if (result?.error) {
        setError(result.error)
      }
      // se redirect(), não chega aqui
    })
  }

  if (!editing) {
    // ── Modo visualização ──────────────────────────────────────────
    return (
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-body font-semibold text-text-primary">Dados do cliente</h2>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-lime transition-colors"
          >
            <Pencil size={14} /> Editar
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <Field label="Nome do negócio" value={tenant.business_name} span />
          <Field label="Personal responsável" value={profile.full_name ?? '—'} />
          <Field label="E-mail de acesso" value={profile.email} />
          <Field label="E-mail de contato" value={tenant.contact_email ?? '—'} />
          <Field label="Telefone" value={tenant.contact_phone ?? '—'} />
          <Field label="Plano" value={PLAN_LABELS[tenant.plan as keyof typeof PLAN_LABELS]} />
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">Cor primária</p>
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-md border border-surface-border flex-shrink-0"
                style={{ background: tenant.primary_color ?? '#E8FF47' }}
              />
              <span className="text-sm text-text-primary font-mono">
                {tenant.primary_color ?? '#E8FF47'}
              </span>
            </div>
          </div>
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

  // ── Modo edição ────────────────────────────────────────────────
  return (
    <form action={handleSubmit} className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
        <h2 className="font-body font-semibold text-text-primary">Editar dados</h2>
        <button
          type="button"
          onClick={() => { setEditing(false); setPreview(null); setError(null) }}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={14} /> Cancelar
        </button>
      </div>

      <div className="p-6 space-y-5">

        {/* Logo */}
        <div className="space-y-2">
          <p className="text-sm font-body font-medium text-text-secondary">Logo</p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-background border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {preview ?? tenant.logo_url ? (
                <Image
                  src={preview ?? tenant.logo_url!}
                  alt="Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                <span className="text-xl font-display font-black text-brand-lime">
                  {tenant.business_name[0].toUpperCase()}
                </span>
              )}
            </div>
            <input ref={fileRef} type="file" name="logo" accept="image/*" className="hidden" onChange={handleFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-surface-border rounded-lg text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors"
            >
              <Upload size={13} /> Trocar logo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditField label="Nome do negócio" name="business_name" defaultValue={tenant.business_name} required span />
          <EditField label="Personal responsável" name="full_name" defaultValue={profile.full_name ?? ''} />
          <EditField label="E-mail de contato" name="contact_email" type="email" defaultValue={tenant.contact_email ?? ''} />
          <EditField label="Telefone" name="contact_phone" type="tel" defaultValue={tenant.contact_phone ?? ''} />
        </div>

        {/* Plano */}
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
                <span className="font-body font-semibold text-text-primary text-sm capitalize">{p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cor + notas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="primary_color" className="block text-sm font-body font-medium text-text-secondary">
              Cor primária
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primary_color"
                name="primary_color"
                type="color"
                defaultValue={tenant.primary_color ?? '#E8FF47'}
                className="h-11 w-20 bg-background border border-surface-border rounded-lg p-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

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
            onClick={() => { setEditing(false); setPreview(null); setError(null) }}
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
  label, name, type = 'text', defaultValue, required, span,
}: {
  label: string; name: string; type?: string
  defaultValue?: string; required?: boolean; span?: boolean
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
        className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
      />
    </div>
  )
}
