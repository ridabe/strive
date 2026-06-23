import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgendaCalendarView } from './AgendaCalendarView'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['personal', 'global_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Verificar se módulo está habilitado para este tenant
  if (profile.tenant_id) {
    const { data: tenantModule } = await supabase
      .from('tenant_modules')
      .select('enabled, system_modules!inner(slug)')
      .eq('tenant_id', profile.tenant_id)
      .eq('system_modules.slug', 'minha-agenda')
      .single()

    if (!tenantModule?.enabled) redirect('/dashboard')
  }

  // Data atual para carregar o mês correto
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate   = new Date(year, month, 0).toISOString().split('T')[0]

  // Buscar eventos do mês atual
  const { data: events } = await supabase
    .from('agenda_events')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  // Buscar alunos ativos para o seletor no modal
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('status', 'active')
    .order('full_name')

  return (
    <AgendaCalendarView
      initialEvents={(events ?? []) as Parameters<typeof AgendaCalendarView>[0]['initialEvents']}
      initialYear={year}
      initialMonth={month}
      students={students ?? []}
    />
  )
}
