import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAcademiaTenant } from '@/actions/admin-academias'
import { AuthSubmitButton } from '@/components/auth/submit-button'

export default async function NovaAcademiaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/admin/academias"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Voltar para Academias
        </Link>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Nova Academia
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Cria o tenant como academia (multi-personal) e a conta de acesso do dono.
        </p>
      </div>

      {error && (
        <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form action={createAcademiaTenant} className="space-y-6">

        {/* Dados principais */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Dados da academia
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="business_name" className="block text-sm font-body font-medium text-text-secondary">
                Nome da academia <span className="text-status-error">*</span>
              </label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                required
                placeholder="Ex: Academia Vitalize"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="full_name" className="block text-sm font-body font-medium text-text-secondary">
                Nome do dono <span className="text-status-error">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Ex: Maria Souza"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="access_email" className="block text-sm font-body font-medium text-text-secondary">
                E-mail de acesso do dono <span className="text-status-error">*</span>
              </label>
              <input
                id="access_email"
                name="access_email"
                type="email"
                required
                placeholder="dono@academia.com"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
              <p className="text-xs text-text-secondary/60">
                Será enviado e-mail com senha provisória. O dono entra como <code>owner</code> na equipe da academia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact_email" className="block text-sm font-body font-medium text-text-secondary">
                E-mail de contato <span className="text-text-secondary/50 font-normal">(opcional)</span>
              </label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="contato@academia.com"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contact_phone" className="block text-sm font-body font-medium text-text-secondary">
                Telefone
              </label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                placeholder="(11) 99999-9999"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cnpj" className="block text-sm font-body font-medium text-text-secondary">
              CNPJ <span className="text-text-secondary/50 font-normal">(opcional)</span>
            </label>
            <input
              id="cnpj"
              name="cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-body font-medium text-text-secondary">
              Observações internas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Anotações visíveis apenas para o admin..."
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Limites da academia */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Limites e configuração
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="max_personals" className="block text-sm font-body font-medium text-text-secondary">
                Máx. personais/admins <span className="text-status-error">*</span>
              </label>
              <input
                id="max_personals"
                name="max_personals"
                type="number"
                min={1}
                required
                defaultValue={5}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="max_students" className="block text-sm font-body font-medium text-text-secondary">
                Máx. alunos
              </label>
              <input
                id="max_students"
                name="max_students"
                type="number"
                min={1}
                defaultValue={50}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-surface-border p-3 cursor-pointer hover:border-brand-lime/40 transition-colors">
            <input
              type="checkbox"
              name="self_assign_enabled"
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

          <div className="space-y-1.5">
            <label htmlFor="abacatepay_customer_id" className="block text-sm font-body font-medium text-text-secondary">
              ID de cliente AbacatePay <span className="text-text-secondary/50 font-normal">(opcional)</span>
            </label>
            <input
              id="abacatepay_customer_id"
              name="abacatepay_customer_id"
              type="text"
              placeholder="cust_..."
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary font-mono placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
            />
            <p className="text-xs text-text-secondary/60">
              Vínculo manual — a academia usa assinatura única, cobrada separadamente do fluxo automático de planos individuais.
            </p>
          </div>
        </div>

        {/* Plano + identidade visual */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Plano e identidade visual
          </h2>

          <div className="space-y-2">
            <label className="block text-sm font-body font-medium text-text-secondary">
              Plano <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'free',    label: 'Free' },
                { value: 'pro',     label: 'Pro' },
                { value: 'premium', label: 'Premium' },
              ].map((p) => (
                <label
                  key={p.value}
                  className="relative flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer hover:border-brand-lime/50 transition-colors has-[:checked]:border-brand-lime has-[:checked]:bg-brand-lime/5 border-surface-border"
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.value}
                    defaultChecked={p.value === 'pro'}
                    className="sr-only"
                  />
                  <span className="font-body font-semibold text-text-primary text-sm">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="primary_color" className="block text-sm font-body font-medium text-text-secondary">
              Cor primária
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primary_color"
                name="primary_color"
                type="color"
                defaultValue="#E8FF47"
                className="h-11 w-20 bg-background border border-surface-border rounded-lg p-1 cursor-pointer focus:outline-none focus:border-brand-lime/60 transition-colors"
              />
              <span className="text-xs text-text-secondary">
                Padrão: #E8FF47 (lime do Strive)
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <AuthSubmitButton label="Criar academia" loadingLabel="Criando..." />
          <Link
            href="/admin/academias"
            className="text-sm font-body text-text-secondary hover:text-text-primary transition-colors px-4 py-3"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
