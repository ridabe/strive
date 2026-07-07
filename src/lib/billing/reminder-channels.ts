import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ReminderChannel } from '@/types/db-enums'

type ReminderPayload = {
  studentName: string
  businessName: string
  amount: number
  dueDateISO: string // "YYYY-MM-DD"
  email: string | null
  phone: string | null
  logoUrl: string | null
  primaryColor: string | null
}

type ReminderResult =
  | { ok: true; channel: ReminderChannel }
  | { ok: false; error: string }

// ── Escolhe o canal com base no contato disponível do aluno ──────────────────
// E-mail tem prioridade (único com envio real hoje). Sem e-mail mas com
// telefone, o aluno fica marcado para WhatsApp — o envio em si ainda falha
// (sem provedor escolhido) até essa parte ser implementada, mas a decisão de
// canal já fica pronta para quando um provedor entrar.
export function pickReminderChannel(student: { email: string | null; phone: string | null }): ReminderChannel | null {
  if (student.email) return 'email'
  if (student.phone) return 'whatsapp'
  return null
}

export async function sendReminder(
  channel: ReminderChannel,
  payload: ReminderPayload,
  supabase: SupabaseClient<Database>
): Promise<ReminderResult> {
  if (channel === 'email') return sendEmailReminder(payload, supabase)
  return sendWhatsappReminder(payload)
}

async function sendEmailReminder(
  payload: ReminderPayload,
  supabase: SupabaseClient<Database>
): Promise<ReminderResult> {
  if (!payload.email) return { ok: false, error: 'Aluno sem e-mail cadastrado.' }

  const { error } = await supabase.functions.invoke('send-payment-reminder', {
    body: {
      email:        payload.email,
      studentName:  payload.studentName,
      businessName: payload.businessName,
      amount:       payload.amount,
      dueDate:      payload.dueDateISO,
      logoUrl:      payload.logoUrl,
      primaryColor: payload.primaryColor,
    },
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, channel: 'email' }
}

// ── Placeholder — nenhum provedor de WhatsApp escolhido ainda ────────────────
// Quando um provedor (Twilio, Meta Cloud API, Zenvia etc.) for definido, essa
// função vira a integração real; pickReminderChannel() e o resto do fluxo de
// lembretes já não precisam mudar.
async function sendWhatsappReminder(payload: ReminderPayload): Promise<ReminderResult> {
  void payload
  return { ok: false, error: 'Canal WhatsApp ainda não tem provedor configurado.' }
}
