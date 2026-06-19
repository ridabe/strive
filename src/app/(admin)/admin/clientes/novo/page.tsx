import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient_action } from '@/app/actions/clients'
import { AuthSubmitButton } from '@/components/auth/submit-button'
import { LogoUpload } from '@/components/admin/logo-upload'

export default async function NovoClientePage({
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
          href="/admin/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Voltar para Clientes
        </Link>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Novo Cliente
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Preencha os dados do cliente. O logo será usado no ambiente white-label dele.
        </p>
      </div>

      {/* Formulário */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form action={createClient_action} className="space-y-6">

        {/* Logo */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Logo do cliente
          </h2>
          <p className="text-xs text-text-secondary">
            Será exibido no painel do personal trainer e no app dos alunos. JPG, PNG ou WebP até 2MB.
          </p>
          <LogoUpload />
        </div>

        {/* Dados principais */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Dados do negócio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="business_name" className="block text-sm font-body font-medium text-text-secondary">
                Nome do negócio <span className="text-status-error">*</span>
              </label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                required
                placeholder="Ex: João Silva Personal"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="full_name" className="block text-sm font-body font-medium text-text-secondary">
                Nome do personal <span className="text-status-error">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Ex: João Silva"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="access_email" className="block text-sm font-body font-medium text-text-secondary">
                E-mail de acesso <span className="text-status-error">*</span>
              </label>
              <input
                id="access_email"
                name="access_email"
                type="email"
                required
                placeholder="personal@email.com"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
              />
              <p className="text-xs text-text-secondary/60">
                Será enviado e-mail com senha provisória para este endereço.
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
                placeholder="contato@negocio.com"
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

        {/* Plano + white-label */}
        <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
          <h2 className="font-body font-semibold text-text-primary text-sm">
            Plano e identidade visual
          </h2>

          {/* Seleção de plano */}
          <div className="space-y-2">
            <label className="block text-sm font-body font-medium text-text-secondary">
              Plano <span className="text-status-error">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'free',    label: 'Free',    desc: 'Até 5 alunos',       color: 'border-surface-border' },
                { value: 'pro',     label: 'Pro',     desc: 'Até 30 alunos',      color: 'border-brand-lime/40' },
                { value: 'premium', label: 'Premium', desc: 'Ilimitado + WL',     color: 'border-status-warning/40' },
              ].map((p) => (
                <label
                  key={p.value}
                  className={`relative flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer hover:border-brand-lime/50 transition-colors has-[:checked]:border-brand-lime has-[:checked]:bg-brand-lime/5 ${p.color}`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.value}
                    defaultChecked={p.value === 'free'}
                    className="sr-only"
                  />
                  <span className="font-body font-semibold text-text-primary text-sm">{p.label}</span>
                  <span className="text-text-secondary text-xs">{p.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cor primária */}
          <div className="space-y-1.5">
            <label htmlFor="primary_color" className="block text-sm font-body font-medium text-text-secondary">
              Cor primária{' '}
              <span className="text-text-secondary/50 font-normal">
                (aparece nos botões e destaques do ambiente do cliente)
              </span>
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
          <AuthSubmitButton label="Criar cliente" loadingLabel="Criando..." />
          <Link
            href="/admin/clientes"
            className="text-sm font-body text-text-secondary hover:text-text-primary transition-colors px-4 py-3"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
