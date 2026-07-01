'use server'

import { createClient } from '@/lib/supabase/server'
import { getCtx } from '@/lib/supabase/context'
import { revalidatePath } from 'next/cache'

export type AgendaEventType =
  | 'presencial'
  | 'virtual'
  | 'pagamento_a_fazer'
  | 'pagamento_a_receber'

export type AgendaEventStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'pending_confirmation'
  | 'rejected'

export type AgendaEventOrigin = 'personal' | 'student'

export interface AgendaEvent {
  id: string
  tenant_id: string
  type: AgendaEventType
  title: string
  event_date: string        // YYYY-MM-DD
  start_time: string | null // HH:MM
  student_id: string | null
  student_name: string | null
  location: string | null
  meeting_url: string | null
  amount: number | null
  description: string | null
  status: AgendaEventStatus
  notified: boolean
  notes: string | null
  origin: AgendaEventOrigin
  rejection_reason: string | null
  address_cep: string | null
  created_at: string
  updated_at: string
}

export interface CreateAgendaEventInput {
  type: AgendaEventType
  title: string
  event_date: string
  start_time?: string | null
  student_id?: string | null
  student_name?: string | null
  location?: string | null
  address_cep?: string | null
  meeting_url?: string | null
  amount?: number | null
  description?: string | null
  notes?: string | null
}

export interface UpdateAgendaEventInput {
  id: string
  type?: AgendaEventType
  title?: string
  event_date?: string
  start_time?: string | null
  student_id?: string | null
  student_name?: string | null
  location?: string | null
  address_cep?: string | null
  meeting_url?: string | null
  amount?: number | null
  description?: string | null
  status?: AgendaEventStatus
  notes?: string | null
  rejection_reason?: string | null
}

export interface StudentPresencialRequestInput {
  event_date: string
  start_time: string
  location: string      // endereço completo montado
  address_cep: string
  notes?: string | null
}

// ─── Listar eventos por mês (personal) ───────────────────────
export async function getAgendaEvents(year: number, month: number): Promise<AgendaEvent[]> {
  const ctx = await getCtx()
  if (!ctx) throw new Error('Não autenticado')
  const { supabase, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) {
    throw new Error('Acesso negado')
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('agenda_events')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AgendaEvent[]
}

// ─── Listar eventos de um dia (personal) ─────────────────────
export async function getAgendaEventsByDate(date: string): Promise<AgendaEvent[]> {
  const ctx = await getCtx()
  if (!ctx) throw new Error('Não autenticado')
  const { supabase, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) {
    throw new Error('Acesso negado')
  }

  const { data, error } = await supabase
    .from('agenda_events')
    .select('*')
    .eq('event_date', date)
    .order('start_time', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AgendaEvent[]
}

// ─── Eventos de hoje (para notificação no dashboard) ─────────
export async function getTodayAgendaEvents(): Promise<AgendaEvent[]> {
  const ctx = await getCtx()
  if (!ctx) return []
  const { supabase, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) return []

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('agenda_events')
    .select('*')
    .eq('event_date', today)
    .in('status', ['scheduled', 'pending_confirmation'])
    .order('start_time', { ascending: true })

  if (error) return []
  return (data ?? []) as AgendaEvent[]
}

// ─── Criar evento (personal) ──────────────────────────────────
export async function createAgendaEvent(input: CreateAgendaEventInput) {
  const ctx = await getCtx()
  if (!ctx) throw new Error('Não autenticado')
  const { supabase, tenantId, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) {
    throw new Error('Acesso negado')
  }

  const { error } = await supabase.from('agenda_events').insert({
    tenant_id:    tenantId,
    type:         input.type,
    title:        input.title,
    event_date:   input.event_date,
    start_time:   input.start_time ?? null,
    student_id:   input.student_id ?? null,
    student_name: input.student_name ?? null,
    location:     input.location ?? null,
    address_cep:  input.address_cep ?? null,
    meeting_url:  input.meeting_url ?? null,
    amount:       input.amount ?? null,
    description:  input.description ?? null,
    notes:        input.notes ?? null,
    origin:       'personal',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/agenda')
}

// ─── Atualizar evento (personal) ─────────────────────────────
export async function updateAgendaEvent(input: UpdateAgendaEventInput) {
  const ctx = await getCtx()
  if (!ctx) throw new Error('Não autenticado')
  const { supabase, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) {
    throw new Error('Acesso negado')
  }

  const { id, ...rest } = input

  const { error } = await supabase
    .from('agenda_events')
    .update(rest)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/agenda')
}

// ─── Deletar evento (personal) ────────────────────────────────
export async function deleteAgendaEvent(id: string) {
  const ctx = await getCtx()
  if (!ctx) throw new Error('Não autenticado')
  const { supabase, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) {
    throw new Error('Acesso negado')
  }

  const { error } = await supabase
    .from('agenda_events')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/agenda')
}

// ─── Confirmar solicitação do aluno (personal) ────────────────
export async function confirmAgendaEvent(id: string) {
  const ctx = await getCtx()
  if (!ctx) throw new Error('Não autenticado')
  const { supabase, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) {
    throw new Error('Acesso negado')
  }

  const { error } = await supabase
    .from('agenda_events')
    .update({ status: 'scheduled' })
    .eq('id', id)
    .eq('status', 'pending_confirmation')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/agenda')
  revalidatePath('/student/agenda')
}

// ─── Recusar solicitação do aluno (personal) ──────────────────
export async function rejectAgendaEvent(id: string, reason: string) {
  const ctx = await getCtx()
  if (!ctx) throw new Error('Não autenticado')
  const { supabase, role } = ctx
  if (!['personal', 'global_admin'].includes(role)) {
    throw new Error('Acesso negado')
  }

  const { error } = await supabase
    .from('agenda_events')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', id)
    .eq('status', 'pending_confirmation')

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/agenda')
  revalidatePath('/student/agenda')
}

// ─── Aluno cria solicitação de aula presencial ────────────────
export async function createStudentPresencialRequest(input: StudentPresencialRequestInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') throw new Error('Acesso negado')
  if (!profile.tenant_id) throw new Error('Tenant não encontrado')

  // Busca o students.id e nome do aluno
  const { data: studentRow } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!studentRow) throw new Error('Registro de aluno não encontrado')

  const { error } = await supabase.from('agenda_events').insert({
    tenant_id:    profile.tenant_id,
    type:         'presencial',
    title:        `Solicitação: ${studentRow.full_name}`,
    event_date:   input.event_date,
    start_time:   input.start_time,
    student_id:   studentRow.id,
    student_name: studentRow.full_name,
    location:     input.location,
    address_cep:  input.address_cep,
    notes:        input.notes ?? null,
    status:       'pending_confirmation',
    origin:       'student',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/student/agenda')
  revalidatePath('/dashboard/agenda')
}

// ─── Eventos do aluno (student view) ─────────────────────────
export async function getStudentAgendaEvents(): Promise<AgendaEvent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: studentRow } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!studentRow) return []

  const { data, error } = await supabase
    .from('agenda_events')
    .select('*')
    .eq('student_id', studentRow.id)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AgendaEvent[]
}
