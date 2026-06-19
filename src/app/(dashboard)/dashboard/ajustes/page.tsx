import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import { Settings, Building2, User, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { AuthSubmitButton } from '@/components/auth/submit-button'

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const params   = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, tenant_id')
    .eq('id', user.id)
    .single()

  const { data: tenant } = profile?.tenant_id
    ? await supabase
        .from('tenants')
        .select('business_name, contact_email, contact_phone, primary_color, plan')
        .eq('id', profile.tenant_id)
        .single()
    : { data: null }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Ajustes
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Seus dados e configurações da conta.
        </p>
      </div>

      {/* Feedback */}
      {params.success && (
        <div className="flex items-center gap-3 bg-status-success/10 border border-status-success/20 rounded-xl px-4 py-3">
          <CheckCircle2 size={15} className="text-status-success flex-shrink-0" />
          <p className="text-sm text-status-success">Dados atualizados com sucesso.</p>
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-3 bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-status-error flex-shrink-0" />
          <p className="text-sm text-status-error">{params.error}</p>
        </div>
      )}

      {/* ── Dados do negócio ──────────────────────────────────────────── */}
      <section className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-border">
          <Building2 size={16} className="text-brand-lime" />
          <h2 className="font-body font-semibold text-text-primary text-sm">Dados do negócio</h2>
        </div>

        <form action={updateProfile} className="p-5 space-y-4">
          <input type="hidden" name="section" value="business" />

          <div className="space-y-1.5">
            <label className="block text-xs font-body font-medium text-text-secondary uppercase tracking-wide">
              Nome do negócio
            </label>
            <input
              name="business_name"
              defaultValue={tenant?.business_name ?? ''}
              required
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-body font-medium text-text-secondary uppercase tracking-wide">
                E-mail de contato
              </label>
              <input
                name="contact_email"
                type="email"
                defaultValue={tenant?.contact_email ?? ''}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-body font-medium text-text-secondary uppercase tracking-wide">
                Telefone / WhatsApp
              </label>
              <input
                name="contact_phone"
                type="tel"
                defaultValue={tenant?.contact_phone ?? ''}
                placeholder="(11) 99999-9999"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-body font-medium text-text-secondary uppercase tracking-wide">
              Cor principal (personalização)
            </label>
            <div className="flex items-center gap-3">
              <input
                name="primary_color"
                type="color"
                defaultValue={tenant?.primary_color ?? '#E8FF47'}
                className="w-10 h-10 rounded-lg border border-surface-border bg-background cursor-pointer p-1"
              />
              <span className="text-xs text-text-secondary">
                Cor usada na identidade visual do seu espaço.
              </span>
            </div>
          </div>

          <div className="pt-2">
            <AuthSubmitButton label="Salvar alterações" loadingLabel="Salvando..." />
          </div>
        </form>
      </section>

      {/* ── Dados pessoais ────────────────────────────────────────────── */}
      <section className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-border">
          <User size={16} className="text-brand-lime" />
          <h2 className="font-body font-semibold text-text-primary text-sm">Dados pessoais</h2>
        </div>

        <form action={updateProfile} className="p-5 space-y-4">
          <input type="hidden" name="section" value="personal" />

          <div className="space-y-1.5">
            <label className="block text-xs font-body font-medium text-text-secondary uppercase tracking-wide">
              Seu nome
            </label>
            <input
              name="full_name"
              defaultValue={profile?.full_name ?? ''}
              required
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-body font-medium text-text-secondary uppercase tracking-wide">
              E-mail de acesso
            </label>
            <input
              value={profile?.email ?? ''}
              disabled
              className="w-full bg-background/50 border border-surface-border/50 rounded-lg px-4 py-3 text-sm text-text-secondary cursor-not-allowed"
            />
            <p className="text-xs text-text-secondary/60">O e-mail de acesso não pode ser alterado.</p>
          </div>

          <div className="pt-2">
            <AuthSubmitButton label="Salvar nome" loadingLabel="Salvando..." />
          </div>
        </form>
      </section>

      {/* ── Segurança ─────────────────────────────────────────────────── */}
      <section className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-border">
          <Lock size={16} className="text-brand-lime" />
          <h2 className="font-body font-semibold text-text-primary text-sm">Segurança</h2>
        </div>
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-body font-medium text-text-primary">Alterar senha</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Recomendamos trocar sua senha periodicamente.
            </p>
          </div>
          <a
            href="/alterar-senha"
            className="flex items-center gap-2 border border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-lime/40 text-sm font-body font-medium px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
          >
            <Lock size={14} />
            Alterar
          </a>
        </div>
      </section>

      {/* ── Plano atual ───────────────────────────────────────────────── */}
      <section className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-border">
          <Settings size={16} className="text-brand-lime" />
          <h2 className="font-body font-semibold text-text-primary text-sm">Plano contratado</h2>
        </div>
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-body font-medium text-text-primary capitalize">
              Plano {tenant?.plan ?? 'Free'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Gerencie sua assinatura na página de planos.
            </p>
          </div>
          <a
            href="/dashboard/planos"
            className="text-sm text-brand-lime hover:underline flex-shrink-0"
          >
            Ver planos →
          </a>
        </div>
      </section>
    </div>
  )
}
