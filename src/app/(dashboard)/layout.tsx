import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { LogoHorizontal } from '@/components/logo'
import { DashboardSidebarNav, type EnabledModule } from '@/components/layout/dashboard-sidebar'
import { UserMenu } from '@/components/layout/user-menu'

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

  // Busca módulos habilitados para este tenant
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
        if (!mod || !mod.available || mod.status === 'coming_soon') return []
        return [{ slug: mod.slug, name: mod.name, icon: mod.icon }]
      })
      // mantém ordem já vinda da query (sort_order definido na tabela)

  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-surface-border bg-surface px-4 py-5 gap-6 flex-shrink-0">
        <LogoHorizontal size="sm" />

        <div className="flex-1 overflow-y-auto">
          <DashboardSidebarNav modules={enabledModules} />
        </div>

        <UserMenu
          name={profile.full_name}
          email={profile.email}
          role={profile.role}
        />
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
