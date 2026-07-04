import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
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

  // Tenant branding + personal name
  let tenantBranding: { logo_url: string | null; primary_color: string | null; business_name: string; cref?: string | null } | null = null
  let personalName: string | null = null

  if (profile.tenant_id) {
    const [{ data: tenant }, { data: personal }] = await Promise.all([
      supabase
        .from('tenants')
        .select('logo_url, primary_color, business_name, cref')
        .eq('id', profile.tenant_id)
        .single(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('tenant_id', profile.tenant_id)
        .eq('role', 'personal')
        .limit(1)
        .single(),
    ])
    tenantBranding = tenant
    personalName = personal?.full_name ?? null
  }

  const primaryColor = tenantBranding?.primary_color ?? '#E8FF47'
  const businessName = tenantBranding?.business_name ?? 'Strive Personal'

  // Slugs de módulos habilitados no tenant — filtram o loop de onboarding do aluno.
  // Se a RLS bloquear a leitura (retorno vazio), o popup usa a lista completa do perfil.
  let onboardingSlugs: string[] | null = null
  if (profile.tenant_id) {
    const { data: tenantModules } = await supabase
      .from('tenant_modules')
      .select('enabled, system_modules ( slug, available, status )')
      .eq('tenant_id', profile.tenant_id)
      .eq('enabled', true)

    if (tenantModules && tenantModules.length) {
      onboardingSlugs = tenantModules.flatMap((tm) => {
        const mod = joinOne<{ slug: string; available: boolean; status: string }>(tm.system_modules)
        if (!mod || !mod.available || mod.status === 'coming_soon') return []
        return [mod.slug]
      })
    }
  }

  // Conta solicitações de agendamento pendentes/recusadas para o aluno
  let pendingAgendaCount  = 0
  let rejectedAgendaCount = 0
  let latestAgendaNoticeAt: string | null = null
  let unreadMessageCount = 0
  let latestMessageTitle: string | null = null
  let anamneseHasTemplates = false
  let anamneseCompleted = false

  const { data: studentRow } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

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
        .select('updated_at')
        .eq('student_id', studentRow.id)
        .eq('origin', 'student')
        .in('status', ['pending_confirmation', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('student_messages')
        .select('id, title, created_at')
        .eq('student_id', studentRow.id)
        .is('read_at', null)
        .order('created_at', { ascending: false }),
      profile.tenant_id
        ? supabase
            .from('anamnese_templates')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .or(`tenant_id.is.null,tenant_id.eq.${profile.tenant_id}`)
        : Promise.resolve({ count: 0 }),
      supabase
        .from('anamnese_responses')
        .select('completed_at')
        .eq('student_id', studentRow.id)
        .maybeSingle(),
    ])
    pendingAgendaCount  = pending  ?? 0
    rejectedAgendaCount = rejected ?? 0
    latestAgendaNoticeAt = latestNoticeRow?.updated_at ?? null
    unreadMessageCount = unreadMessages?.length ?? 0
    latestMessageTitle = unreadMessages?.[0]?.title ?? null
    anamneseHasTemplates = (templateCount ?? 0) > 0
    anamneseCompleted = !!anamneseResponse?.completed_at
  }

  return (
    <div
      className="bg-background"
      style={{ '--brand-lime': primaryColor } as React.CSSProperties}
    >
      <StudentMobileNav
        logoUrl={tenantBranding?.logo_url ?? null}
        businessName={businessName}
        primaryColor={primaryColor}
        userName={profile.full_name}
        userEmail={profile.email}
        userRole={profile.role}
        personalName={personalName}
        gamificationActive={gamificationActive}
        unreadMessageCount={unreadMessageCount}
        hasChallenge={hasChallenge}
      />

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 fixed top-0 left-0 bottom-0 border-r border-surface-border bg-surface px-4 py-5 gap-6">
        <div>
          <TenantLogoHeader
            logoUrl={tenantBranding?.logo_url ?? null}
            businessName={businessName}
            primaryColor={primaryColor}
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
          />
        </div>

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
