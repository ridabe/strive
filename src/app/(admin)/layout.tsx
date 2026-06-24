import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoHorizontal } from '@/components/logo'
import { AdminSidebarNav } from '@/components/layout/admin-sidebar'
import { UserMenu } from '@/components/layout/user-menu'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'global_admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 border-r border-status-error/20 bg-surface px-4 py-5 gap-6 flex-shrink-0">
        <div className="flex-shrink-0">
          <LogoHorizontal size="sm" />
          <div className="mt-2 inline-flex items-center gap-1.5 bg-status-error/10 border border-status-error/20 text-status-error text-xs font-body font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-status-error animate-pulse" />
            Admin Global
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AdminSidebarNav />
        </div>

        <div className="flex-shrink-0">
          <UserMenu
            name={profile.full_name}
            email={profile.email}
            role={profile.role}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
