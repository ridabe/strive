import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { TenantLogoHeader } from '@/components/layout/tenant-logo-header'
import { StudentSidebarNav } from '@/components/layout/student-sidebar'
import { StudentBottomNav } from '@/components/layout/student-bottom-nav'
import { UserMenu } from '@/components/layout/user-menu'

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
  let tenantBranding: { logo_url: string | null; primary_color: string | null; business_name: string } | null = null
  let personalName: string | null = null

  if (profile.tenant_id) {
    const [{ data: tenant }, { data: personal }] = await Promise.all([
      supabase
        .from('tenants')
        .select('logo_url, primary_color, business_name')
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

  return (
    <div
      className="bg-background"
      style={{ '--brand-lime': primaryColor } as React.CSSProperties}
    >
      {/* ── Mobile header ─────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-surface border-b border-surface-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {tenantBranding?.logo_url ? (
            <div className="relative h-8 w-28 flex-shrink-0">
              <Image
                src={tenantBranding.logo_url}
                alt={businessName}
                fill
                className="object-contain object-left"
                sizes="112px"
                priority
              />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-display font-black text-sm flex-shrink-0"
              style={{ background: primaryColor }}
            >
              {businessName.charAt(0).toUpperCase()}
            </div>
          )}
          {!tenantBranding?.logo_url && (
            <span className="text-sm font-body font-semibold text-text-primary truncate">
              {businessName}
            </span>
          )}
        </div>

        {/* Avatar inicial do aluno */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-black text-black flex-shrink-0"
          style={{ background: primaryColor }}
        >
          {(profile.full_name ?? profile.email).charAt(0).toUpperCase()}
        </div>
      </header>

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 fixed top-0 left-0 bottom-0 border-r border-surface-border bg-surface px-4 py-5 gap-6">
        <TenantLogoHeader
          logoUrl={tenantBranding?.logo_url ?? null}
          businessName={businessName}
          primaryColor={primaryColor}
        />

        <div className="flex-1 overflow-y-auto">
          <StudentSidebarNav personalName={personalName} />
        </div>

        <UserMenu
          name={profile.full_name}
          email={profile.email}
          role={profile.role}
        />
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="md:ml-60 pt-14 pb-20 md:pt-0 md:pb-0 min-h-screen overflow-auto">
        {children}
      </main>

      {/* ── Mobile bottom navigation ──────────────────────────────── */}
      <StudentBottomNav />
    </div>
  )
}
