import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { hexToRgbChannels } from '@/lib/color-contrast'
import { DashboardSidebarNav, type EnabledModule } from '@/components/layout/dashboard-sidebar'
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav'
import { UserMenu } from '@/components/layout/user-menu'
import { TenantLogoHeader } from '@/components/layout/tenant-logo-header'
import { PendingAgendaBanner } from '@/components/agenda/PendingAgendaBanner'
import { MaxOnboardingModal } from '@/components/ai/MaxOnboardingModal'
import { ModuleOnboardingPopup } from '@/components/onboarding/ModuleOnboardingPopup'
import { TrainerNotificationBell } from '@/components/notifications/TrainerNotificationBell'
import { getTrainerNotifications } from '@/app/actions/trainer-notifications'
import { getCtx } from '@/lib/supabase/context'
import { ACADEMIA_HIDDEN_FROM_ADMIN_SLUGS, ACADEMIA_HIDDEN_FROM_PERSONAL_SLUGS, ACADEMIA_OPERATIONS_VISIBLE_SLUGS } from '@/lib/modules-config'
import { isOperations, isBackofficeStaff, isManager } from '@/lib/permissions'
import { ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'personal') redirect('/login')

  // Vínculos ativos do personal em tenant_members — pode ter mais de 1 (Fase 4:
  // personal/admin que atua em mais de uma academia, ou owner de academia +
  // vínculos adicionais). Espelha a checagem equivalente de (student)/layout.tsx,
  // trocando `students` por `tenant_members` como fonte de vínculos.
  const { data: activeMemberships } = await supabase
    .from('tenant_members')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const activeMembershipRows = activeMemberships ?? []
  const hasMultipleActiveTenants = activeMembershipRows.length > 1

  if (hasMultipleActiveTenants) {
    const current = activeMembershipRows.find((r) => r.tenant_id === profile.tenant_id)
    if (!current) redirect('/dashboard/trocar-organizacao')
  }
  // 0 ou 1 vínculo em tenant_members: comportamento idêntico ao anterior à
  // Fase 4 — nenhuma escrita ou redirecionamento extra.

  // Busca branding do tenant. logo_light_url (logo para tema claro/academia)
  // é lido via '*' + cast — a coluna é nova e ainda não está no database.ts
  // gerado; regenerar os tipos é passo posterior (pnpm supabase gen types).
  let tenantBranding: { logo_url: string | null; logo_light_url?: string | null; primary_color: string | null; accent_text_color: string | null; on_primary_text_color: string | null; business_name: string; tenant_type?: string } | null = null

  if (profile.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single()
    tenantBranding = tenant as typeof tenantBranding
  }

  // "Equipe" só aparece para owner/admin de tenant do tipo academia — o papel
  // efetivo (que pode diferir de profiles.role) vem de getCtx() via tenant_members.
  const ctx = await getCtx()
  const role = ctx?.role ?? ''
  const isAcademia = tenantBranding?.tenant_type === 'academia'
  const isOps = isAcademia && isOperations(role)
  // Equipe aparece para gestão institucional (owner/admin) e para operação
  // (operador/gerente), que cadastra personal.
  const showEquipe = isAcademia && isBackofficeStaff(role)

  // Busca modulos habilitados para este tenant
  let enabledModules: EnabledModule[] = []
  // Slugs habilitados para o loop de onboarding (inclui white-label, ao contrário do menu)
  let onboardingSlugs: string[] = []

  if (profile.tenant_id) {
    const { data: tenantModules } = await supabase
      .from('tenant_modules')
      .select(`
        enabled,
        system_modules (
          slug,
          name,
          icon,
          sort_order,
          available,
          status
        )
      `)
      .eq('tenant_id', profile.tenant_id)
      .eq('enabled', true)

    const availableMods = (tenantModules ?? [])
      .flatMap((tm) => {
        const mod = joinOne<{
          slug: string; name: string; icon: string | null;
          sort_order: number; available: boolean; status: string
        }>(tm.system_modules)
        if (!mod || !mod.available || mod.status === 'coming_soon') return []
        return [mod]
      })

    onboardingSlugs = availableMods.map((mod) => mod.slug)

    enabledModules = availableMods
      // white-label integrado em Ajustes — nao exibir como item separado no menu
      .filter((mod) => mod.slug !== 'white-label')
      .map((mod) => ({ slug: mod.slug, name: mod.name, icon: mod.icon }))

    // Numa academia, habilitação de módulo é por tenant (todos ganham acesso),
    // mas a visibilidade no menu é por papel — owner/admin não opera as
    // ferramentas de treino 1:1 com aluno, e personal não precisa do
    // financeiro institucional (Faturas). Não afeta tenant autônomo.
    if (isAcademia) {
      if (isOps) {
        // Operação: allowlist estrita (cobrança, estoque, agenda, anamnese).
        enabledModules = enabledModules.filter((mod) => ACADEMIA_OPERATIONS_VISIBLE_SLUGS.includes(mod.slug))
        onboardingSlugs = onboardingSlugs.filter((slug) => ACADEMIA_OPERATIONS_VISIBLE_SLUGS.includes(slug))
      } else {
        const hiddenSlugs = isManager(role) ? ACADEMIA_HIDDEN_FROM_ADMIN_SLUGS : ACADEMIA_HIDDEN_FROM_PERSONAL_SLUGS
        enabledModules = enabledModules.filter((mod) => !hiddenSlugs.includes(mod.slug))
        onboardingSlugs = onboardingSlugs.filter((slug) => !hiddenSlugs.includes(slug))
      }
    }
  }

  // Accent do tenant. Numa academia sem cor de marca definida, o default é um
  // índigo profissional (não o lima do Strive). --accent-text é o texto em
  // estados de hover sobre tint do accent: no dark é branco; na academia (tint
  // claro) precisa ser o próprio accent para ter contraste.
  const primaryColor = tenantBranding?.primary_color ?? (isAcademia ? '#4F46E5' : '#E8FF47')
  // --accent-text é o texto de itens ativos/hover sobre tint claro do accent.
  // Na academia ignoramos o accent_text_color salvo (era branco, calibrado pro
  // tema dark — ficaria invisível no claro) e usamos a própria cor de marca,
  // que tem contraste sobre o tint de 10%.
  const accentTextColor = isAcademia ? primaryColor : (tenantBranding?.accent_text_color ?? '#FFFFFF')

  // No tema academia (fundo claro) preferimos o logo para tema claro; se não
  // houver, caímos no logo padrão. Fora da academia, sempre o logo padrão.
  // Na academia preferimos o logo para tema claro; se não houver, usamos o
  // logo padrão que a academia cadastrou. Só cai no lockup inicial + nome
  // quando a academia não tem NENHUM logo.
  const logoUrl = isAcademia
    ? (tenantBranding?.logo_light_url ?? tenantBranding?.logo_url ?? null)
    : (tenantBranding?.logo_url ?? null)

  // Conta solicitações de agendamento presencial pendentes dos alunos
  let pendingAgendaCount = 0
  if (profile.tenant_id) {
    const { count } = await supabase
      .from('agenda_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'pending_confirmation')
      .eq('origin', 'student')
    pendingAgendaCount = count ?? 0
  }

  const trainerNotifications = await getTrainerNotifications()

  return (
    <div
      className="min-h-screen bg-background flex"
      data-theme={isAcademia ? 'academia' : undefined}
      style={{ '--brand-lime': primaryColor, '--brand-lime-rgb': hexToRgbChannels(primaryColor), '--accent-text': accentTextColor } as React.CSSProperties}
    >
      <DashboardMobileNav
        logoUrl={tenantBranding?.logo_url ?? null}
        businessName={tenantBranding?.business_name ?? 'Strive Personal'}
        primaryColor={primaryColor}
        accentTextColor={accentTextColor}
        onPrimaryTextColor={tenantBranding?.on_primary_text_color ?? null}
        userName={profile.full_name}
        userEmail={profile.email}
        userRole={profile.role}
        modules={enabledModules}
        showEquipe={showEquipe}
        isAcademia={isAcademia}
        academiaName={isAcademia ? tenantBranding?.business_name : null}
        hasMultipleActiveTenants={hasMultipleActiveTenants}
        notificationBell={profile.tenant_id ? (
          <TrainerNotificationBell tenantId={profile.tenant_id} initialNotifications={trainerNotifications} />
        ) : null}
      />

      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 border-r border-surface-border bg-surface-2 px-4 py-5 gap-6 flex-shrink-0">

        <div className="flex-shrink-0 flex items-center justify-between gap-2">
          <TenantLogoHeader
            logoUrl={logoUrl}
            businessName={tenantBranding?.business_name ?? 'Strive Personal'}
            primaryColor={primaryColor}
            onPrimaryTextColor={tenantBranding?.on_primary_text_color ?? null}
            framed={isAcademia}
          />
          {profile.tenant_id && (
            <TrainerNotificationBell tenantId={profile.tenant_id} initialNotifications={trainerNotifications} />
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <DashboardSidebarNav modules={enabledModules} accentTextColor={accentTextColor} showEquipe={showEquipe} isAcademia={isAcademia} />
        </div>

        <div className="flex flex-col gap-3 flex-shrink-0">
          {hasMultipleActiveTenants && (
            <Link
              href="/dashboard/trocar-organizacao"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-body font-medium text-text-secondary hover:text-[var(--accent-text)] hover:bg-brand-lime/10 transition-colors"
            >
              <ArrowLeftRight size={15} />
              Trocar de organização
            </Link>
          )}
          <UserMenu
            name={profile.full_name}
            email={profile.email}
            role={profile.role}
            academiaName={isAcademia ? tenantBranding?.business_name : null}
          />
          <div className="flex items-center justify-center gap-2 pt-1 opacity-40">
            <span className="text-[0.55rem] text-text-secondary uppercase tracking-widest font-medium">
              powered by
            </span>
            <span className="text-[0.6rem] font-display font-bold text-text-secondary uppercase tracking-wider">
              Strive Personal
            </span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pt-14 pb-20 md:pt-0 md:pb-0">
        <PendingAgendaBanner count={pendingAgendaCount} />
        {children}
      </main>

      {/* Max Strive IA onboarding — shown once per user when module is enabled */}
      {enabledModules.some((m) => m.slug === 'assistente-ia') && (
        <MaxOnboardingModal userId={user.id} />
      )}

      {/* Loop de onboarding por módulo — 1 popup por login (docs/modulos/onboarding-popup-modulos.md) */}
      <ModuleOnboardingPopup role="personal" userId={user.id} enabledSlugs={onboardingSlugs} />
    </div>
  )
}
