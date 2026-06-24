import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { DashboardSidebarNav, type EnabledModule } from '@/components/layout/dashboard-sidebar'
import { UserMenu } from '@/components/layout/user-menu'
import { TenantLogoHeader } from '@/components/layout/tenant-logo-header'
import { PendingAgendaBanner } from '@/components/agenda/PendingAgendaBanner'

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

  // Busca branding do tenant
  let tenantBranding: { logo_url: string | null; primary_color: string | null; business_name: string } | null = null

  if (profile.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('logo_url, primary_color, business_name')
      .eq('id', profile.tenant_id)
      .single()
    tenantBranding = tenant
  }

  // Busca modulos habilitados para este tenant
  let enabledModules: EnabledModule[] = []

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

    enabledModules = (tenantModules ?? [])
      .flatMap((tm) => {
        const mod = joinOne<{
          slug: string; name: string; icon: string | null;
          sort_order: number; available: boolean; status: string
        }>(tm.system_modules)
        // white-label integrado em Ajustes — nao exibir como item separado no menu
        if (!mod || !mod.available || mod.status === 'coming_soon' || mod.slug === 'white-label') return []
        return [{ slug: mod.slug, name: mod.name, icon: mod.icon }]
      })
  }

  const primaryColor = tenantBranding?.primary_color ?? '#E8FF47'

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

  return (
    <div
      className="min-h-screen bg-background flex"
      style={{ '--brand-lime': primaryColor } as React.CSSProperties}
    >
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 border-r border-surface-border bg-surface px-4 py-5 gap-6 flex-shrink-0">

        <div className="flex-shrink-0">
          <TenantLogoHeader
            logoUrl={tenantBranding?.logo_url ?? null}
            businessName={tenantBranding?.business_name ?? 'Strive Personal'}
            primaryColor={primaryColor}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <DashboardSidebarNav modules={enabledModules} />
        </div>

        <div className="flex flex-col gap-3 flex-shrink-0">
          <UserMenu
            name={profile.full_name}
            email={profile.email}
            role={profile.role}
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

      <main className="flex-1 overflow-auto">
        <PendingAgendaBanner count={pendingAgendaCount} />
        {children}
      </main>
    </div>
  )
}
