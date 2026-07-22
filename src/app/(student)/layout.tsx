import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserX, ArrowLeftRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { joinOne } from '@/lib/supabase/join'
import { hexToRgbChannels } from '@/lib/color-contrast'
import { TenantLogoHeader } from '@/components/layout/tenant-logo-header'
import { StudentSidebarNav } from '@/components/layout/student-sidebar'
import { StudentMobileNav } from '@/components/layout/student-mobile-nav'
import { UserMenu } from '@/components/layout/user-menu'
import { StudentAgendaBanner } from '@/components/agenda/StudentAgendaBanner'
import { StudentMessagesBanner } from '@/components/student/StudentMessagesBanner'
import { AnamnesePendingBanner } from '@/components/student/AnamnesePendingBanner'
import { ModuleOnboardingPopup } from '@/components/onboarding/ModuleOnboardingPopup'
import { hasVisibleStudentChallenge } from '@/app/actions/challenges'

export default async function StudentLayout({
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

  if (!profile || profile.role !== 'student') redirect('/login')

  // Busca TODOS os vínculos ativos do aluno — ele pode ter mais de um
  // personal simultaneamente (ex: reativado por um antigo enquanto já ativo
  // em outro).
  const { data: activeRows } = await supabase
    .from('students')
    .select('id, tenant_id, status, assigned_personal_id')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const activeRelationships = activeRows ?? []
  const hasMultipleActiveTenants = activeRelationships.length > 1

  let studentRow: { id: string; status: string; assigned_personal_id: string | null } | null = null
  let tenantId: string | null = null

  if (activeRelationships.length === 1) {
    studentRow = activeRelationships[0]
    tenantId = activeRelationships[0].tenant_id
    if (profile.tenant_id !== tenantId) {
      await supabase.from('profiles').update({ tenant_id: tenantId }).eq('id', user.id)
    }
  } else if (activeRelationships.length > 1) {
    const current = activeRelationships.find((r) => r.tenant_id === profile.tenant_id)
    if (!current) redirect('/student/trocar-personal')
    studentRow = current
    tenantId = current.tenant_id
  }

  // Tenant branding + personal name
  type TenantBranding = { logo_url: string | null; logo_light_url?: string | null; primary_color: string | null; accent_text_color: string | null; on_primary_text_color: string | null; business_name: string; cref?: string | null; tenant_type?: string } | null
  let tenantBranding: TenantBranding = null
  let personalName: string | null = null

  if (tenantId) {
    // '*' para incluir logo_light_url (coluna nova, ainda fora do database.ts).
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()
    tenantBranding = tenant as TenantBranding

    if (tenant?.tenant_type === 'academia') {
      // Numa academia, vários profiles podem ter role='personal' no mesmo
      // tenant_id (o papel real de cada um vive em tenant_members, não em
      // profiles.role) — por isso não dá pra pegar "o personal" com um
      // simples .limit(1) como no caso autônomo. Resolve o personal
      // efetivamente responsável por ESTE aluno via assigned_personal_id.
      if (studentRow?.assigned_personal_id) {
        const { data: member } = await supabase
          .from('tenant_members')
          .select('profiles(full_name)')
          .eq('id', studentRow.assigned_personal_id)
          .maybeSingle()
        personalName = joinOne<{ full_name: string | null }>(member?.profiles)?.full_name ?? null
      }
      // Aluno ainda não atribuído a um personal — sem fallback "adivinhado",
      // fica null (a UI trata personalName nulo mostrando só a marca da academia).
    } else {
      // Autônomo — comportamento idêntico ao anterior a esta fase: existe
      // exatamente 1 profile com role='personal' no tenant, então .limit(1) é seguro.
      const { data: personal } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('tenant_id', tenantId)
        .eq('role', 'personal')
        .limit(1)
        .single()
      personalName = personal?.full_name ?? null
    }
  }

  // Aluno vinculado a uma academia recebe o mesmo tema claro/BI. accentTextColor
  // na academia usa a própria cor de marca (evita branco invisível no claro);
  // logoUrl prefere a versão para tema claro.
  const isAcademia = tenantBranding?.tenant_type === 'academia'
  const primaryColor = tenantBranding?.primary_color ?? (isAcademia ? '#4F46E5' : '#E8FF47')
  const accentTextColor = isAcademia ? primaryColor : (tenantBranding?.accent_text_color ?? '#FFFFFF')
  const businessName = tenantBranding?.business_name ?? 'Strive Personal'
  // Na academia preferimos o logo para tema claro; se não houver, usamos o
  // logo padrão da academia. Só cai no lockup inicial + nome sem NENHUM logo.
  const logoUrl = isAcademia
    ? (tenantBranding?.logo_light_url ?? tenantBranding?.logo_url ?? null)
    : (tenantBranding?.logo_url ?? null)

  // Slugs de módulos habilitados no tenant — filtram o loop de onboarding do aluno.
  // Se a RLS bloquear a leitura (retorno vazio), o popup usa a lista completa do perfil.
  let onboardingSlugs: string[] | null = null
  if (tenantId) {
    const { data: tenantModules } = await supabase
      .from('tenant_modules')
      .select('enabled, system_modules ( slug, available, status )')
      .eq('tenant_id', tenantId)
      .eq('enabled', true)

    if (tenantModules && tenantModules.length) {
      onboardingSlugs = tenantModules.flatMap((tm) => {
        const mod = joinOne<{ slug: string; available: boolean; status: string }>(tm.system_modules)
        if (!mod || !mod.available || mod.status === 'coming_soon') return []
        return [mod.slug]
      })
    }
  }

  // Conta solicitações de agendamento pendentes/recusadas/confirmadas para o aluno
  let pendingAgendaCount   = 0
  let rejectedAgendaCount  = 0
  let confirmedAgendaCount = 0
  let latestAgendaNoticeAt: string | null = null
  let unreadMessageCount = 0
  let latestMessageTitle: string | null = null
  let anamneseHasTemplates = false
  let anamneseCompleted = false

  // Sem vínculo ativo com nenhum personal — não renderiza o dashboard normal.
  if (!studentRow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-4 bg-surface border border-surface-border rounded-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-surface-border/40 flex items-center justify-center mx-auto">
            <UserX size={22} className="text-text-secondary" />
          </div>
          <div className="space-y-1.5">
            <p className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
              Sem mentoria ativa
            </p>
            <p className="text-sm text-text-secondary">
              Você não tem nenhum personal trainer ativo no momento. Entre em contato com seu personal para retomar o acompanhamento.
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full min-h-11 rounded-xl border border-surface-border text-sm font-body font-medium text-text-secondary hover:text-text-primary hover:border-text-secondary/30 transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Status da gamificação
  const { data: gamifSettings } = await supabase
    .from('gamification_settings')
    .select('is_active')
    .single()
  const gamificationActive = gamifSettings?.is_active ?? false

  // Aluno participa de algum desafio ativo ou com resultado publicado?
  const hasChallenge = await hasVisibleStudentChallenge()

  if (studentRow) {
    const [
      { count: pending },
      { count: rejected },
      { count: confirmed },
      { data: latestNoticeRow },
      { data: unreadMessages },
      { count: templateCount },
      { data: anamneseResponse },
    ] = await Promise.all([
      supabase
        .from('agenda_events')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentRow.id)
        .eq('status', 'pending_confirmation')
        .eq('origin', 'student'),
      supabase
        .from('agenda_events')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentRow.id)
        .eq('status', 'rejected')
        .eq('origin', 'student')
        .gte('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      supabase
        .from('agenda_events')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentRow.id)
        .eq('status', 'scheduled')
        .eq('origin', 'student')
        .gte('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      supabase
        .from('agenda_events')
        .select('updated_at')
        .eq('student_id', studentRow.id)
        .eq('origin', 'student')
        .in('status', ['pending_confirmation', 'rejected', 'scheduled'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('student_messages')
        .select('id, title, created_at')
        .eq('student_id', studentRow.id)
        .is('read_at', null)
        .order('created_at', { ascending: false }),
      tenantId
        ? supabase
            .from('anamnese_templates')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        : Promise.resolve({ count: 0 }),
      supabase
        .from('anamnese_responses')
        .select('completed_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])
    pendingAgendaCount   = pending   ?? 0
    rejectedAgendaCount  = rejected  ?? 0
    confirmedAgendaCount = confirmed ?? 0
    latestAgendaNoticeAt = latestNoticeRow?.updated_at ?? null
    unreadMessageCount = unreadMessages?.length ?? 0
    latestMessageTitle = unreadMessages?.[0]?.title ?? null
    anamneseHasTemplates = (templateCount ?? 0) > 0
    anamneseCompleted = !!anamneseResponse?.completed_at
  }

  return (
    <div
      className="bg-background"
      data-theme={isAcademia ? 'academia' : undefined}
      style={{ '--brand-lime': primaryColor, '--brand-lime-rgb': hexToRgbChannels(primaryColor), '--accent-text': accentTextColor } as React.CSSProperties}
    >
      <StudentMobileNav
        logoUrl={logoUrl}
        businessName={businessName}
        primaryColor={primaryColor}
        accentTextColor={accentTextColor}
        onPrimaryTextColor={tenantBranding?.on_primary_text_color ?? null}
        userName={profile.full_name}
        userEmail={profile.email}
        userRole={profile.role}
        personalName={personalName}
        gamificationActive={gamificationActive}
        unreadMessageCount={unreadMessageCount}
        hasChallenge={hasChallenge}
        hasMultipleActiveTenants={hasMultipleActiveTenants}
      />

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 fixed top-0 left-0 bottom-0 border-r border-surface-border bg-surface-2 px-4 py-5 gap-6">
        <div>
          <TenantLogoHeader
            logoUrl={logoUrl}
            businessName={businessName}
            primaryColor={primaryColor}
            onPrimaryTextColor={tenantBranding?.on_primary_text_color ?? null}
            framed={isAcademia}
          />
          {tenantBranding?.cref && (
            <p className="text-[10px] text-text-secondary/60 font-body mt-1 px-1">
              CREF {tenantBranding.cref}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <StudentSidebarNav
            personalName={personalName}
            gamificationActive={gamificationActive}
            unreadMessageCount={unreadMessageCount}
            hasChallenge={hasChallenge}
            accentTextColor={accentTextColor}
            isAcademia={isAcademia}
          />
        </div>

        {hasMultipleActiveTenants && (
          <Link
            href="/student/trocar-personal"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-body font-medium text-text-secondary hover:text-[var(--accent-text)] hover:bg-brand-lime/10 transition-colors"
          >
            <ArrowLeftRight size={15} />
            Trocar de Personal
          </Link>
        )}

        <UserMenu
          name={profile.full_name}
          email={profile.email}
          role={profile.role}
        />
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="md:ml-60 pt-14 pb-20 md:pt-0 md:pb-0 min-h-screen overflow-auto">
        <StudentAgendaBanner
          pendingCount={pendingAgendaCount}
          rejectedCount={rejectedAgendaCount}
          confirmedCount={confirmedAgendaCount}
          latestNoticeAt={latestAgendaNoticeAt}
        />
        <AnamnesePendingBanner
          hasTemplates={anamneseHasTemplates}
          isCompleted={anamneseCompleted}
        />
        {studentRow && (
          <StudentMessagesBanner
            studentId={studentRow.id}
            initialUnreadCount={unreadMessageCount}
            initialLatestTitle={latestMessageTitle}
          />
        )}
        {children}
      </main>

      {/* Loop de onboarding por módulo — 1 popup por login (docs/modulos/onboarding-popup-modulos.md) */}
      <ModuleOnboardingPopup role="student" userId={user.id} enabledSlugs={onboardingSlugs} />
    </div>
  )
}
