import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentAgendaCalendarView } from './StudentAgendaCalendarView'

function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  return phone.replace(/\D/g, '')
}

export default async function StudentAgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/login')

  // students.id do aluno logado
  const { data: studentRow } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Telefone do personal (para botão WhatsApp em solicitações recusadas)
  const { data: tenantRow } = profile.tenant_id
    ? await supabase
        .from('tenants')
        .select('contact_phone')
        .eq('id', profile.tenant_id)
        .single()
    : { data: null }

  const personalPhone = formatPhone((tenantRow as { contact_phone?: string | null } | null)?.contact_phone)

  // Carrega eventos do mês atual para renderização inicial
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate   = new Date(year, month, 0).toISOString().split('T')[0]

  const initialEvents = studentRow
    ? (await supabase
        .from('agenda_events')
        .select('*')
        .eq('student_id', studentRow.id)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true })
      ).data ?? []
    : []

  return (
    <StudentAgendaCalendarView
      initialEvents={initialEvents as Parameters<typeof StudentAgendaCalendarView>[0]['initialEvents']}
      initialYear={year}
      initialMonth={month}
      personalPhone={personalPhone}
    />
  )
}
