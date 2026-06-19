import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoHorizontal } from '@/components/logo'
import { StudentSidebarNav } from '@/components/layout/student-sidebar'
import { UserMenu } from '@/components/layout/user-menu'

export default async function StudentLayout({
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

  if (!profile || profile.role !== 'student') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-60 border-r border-surface-border bg-surface px-4 py-5 gap-6 flex-shrink-0">
        <LogoHorizontal size="sm" />

        <div className="flex-1">
          <StudentSidebarNav />
        </div>

        <UserMenu
          name={profile.full_name}
          email={profile.email}
          role={profile.role}
        />
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
