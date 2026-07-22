'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, generateTempPassword } from '@/lib/supabase/admin'
import { getCtx } from '@/lib/supabase/context'
import { CHALLENGE_COVER_MAX_BYTES } from '@/lib/challenge-constants'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ChallengeStatus = 'draft' | 'active' | 'finished' | 'published'
export type ReleaseMode = 'progressive' | 'all_at_once'
export type ChallengeItemType = 'exercise' | 'reading' | 'file' | 'tip'

export interface Challenge {
  id: string
  tenant_id: string
  created_by: string | null
  name: string
  description: string | null
  rules: string | null
  prizes: string | null
  duration_days: number
  release_mode: ReleaseMode
  status: ChallengeStatus
  start_date: string | null
  show_results_to_students: boolean
  results_published_at: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

const CHALLENGE_COVER_ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export interface ChallengeParticipant {
  id: string
  tenant_id: string
  challenge_id: string
  student_id: string
  initial_age: number | null
  initial_weight: number | null
  initial_body_fat: number | null
  initial_arm: number | null
  initial_chest: number | null
  initial_waist: number | null
  initial_hip: number | null
  initial_thigh: number | null
  final_weight: number | null
  final_body_fat: number | null
  final_arm: number | null
  final_chest: number | null
  final_waist: number | null
  final_hip: number | null
  final_thigh: number | null
  final_notes: string | null
  result_rank: number | null
  result_delta_pp: number | null
  created_at: string
  updated_at: string
}

export interface CreateChallengeInput {
  name: string
  description?: string | null
  rules?: string | null
  prizes?: string | null
  duration_days: number
  release_mode: ReleaseMode
}

export interface UpdateChallengeInput {
  name?: string
  description?: string | null
  rules?: string | null
  prizes?: string | null
  duration_days?: number
  release_mode?: ReleaseMode
}

// ─── Helper de acesso (personal / global_admin) ───────────────────────────────

async function requirePersonalCtx() {
  const ctx = await getCtx()
  if (!ctx) return null
  if (!['personal', 'global_admin'].includes(ctx.role)) return null
  return ctx
}

// ─── Listar desafios do tenant ─────────────────────────────────────────────────
export async function getChallenges(): Promise<(Challenge & { participant_count: number })[]> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return []
  const { supabase } = ctx

  const { data, error } = await supabase
    .from('challenges')
    .select('*, challenge_participants(count)')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => {
    const { challenge_participants, ...rest } = row as unknown as Challenge & {
      challenge_participants: { count: number }[]
    }
    return { ...rest, participant_count: challenge_participants?.[0]?.count ?? 0 }
  })
}

// ─── Detalhe de um desafio (com participantes) ────────────────────────────────
export async function getChallenge(id: string): Promise<{
  challenge: Challenge
  participants: (ChallengeParticipant & { student_name: string; student_email: string | null })[]
} | null> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return null
  const { supabase } = ctx

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single()

  if (!challenge) return null

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('*, students(full_name, email)')
    .eq('challenge_id', id)
    .order('created_at', { ascending: true })

  return {
    challenge: challenge as Challenge,
    participants: (participants ?? []).map((p) => {
      const { students, ...rest } = p as unknown as ChallengeParticipant & {
        students: { full_name: string; email: string | null } | null
      }
      return {
        ...rest,
        student_name: students?.full_name ?? 'Aluno removido',
        student_email: students?.email ?? null,
      }
    }),
  }
}

// ─── Criar desafio (rascunho) ──────────────────────────────────────────────────
export async function createChallenge(input: CreateChallengeInput): Promise<{ id?: string; error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  const { data: { user } } = await supabase.auth.getUser()

  if (!input.name?.trim()) return { error: 'Nome do desafio é obrigatório.' }
  if (!input.duration_days || input.duration_days < 1) return { error: 'Duração inválida.' }

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      tenant_id: tenantId,
      created_by: user?.id ?? null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      rules: input.rules?.trim() || null,
      prizes: input.prizes?.trim() || null,
      duration_days: input.duration_days,
      release_mode: input.release_mode,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Erro ao criar desafio' }

  revalidatePath('/dashboard/desafios')
  return { id: data.id }
}

// ─── Atualizar desafio (somente enquanto rascunho) ─────────────────────────────
export async function updateChallenge(id: string, fields: UpdateChallengeInput): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase
    .from('challenges')
    .update({
      ...fields,
      name: fields.name?.trim(),
      description: fields.description?.trim() || null,
      rules: fields.rules?.trim() || null,
      prizes: fields.prizes?.trim() || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/desafios')
  revalidatePath(`/dashboard/desafios/${id}`)
  return {}
}

// ─── Excluir desafio (bloqueado apenas enquanto ativo) ─────────────────────────
export async function deleteChallenge(id: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { data: challenge } = await supabase
    .from('challenges')
    .select('status')
    .eq('id', id)
    .single()

  if (!challenge) return { error: 'Desafio não encontrado' }
  if (challenge.status === 'active') {
    return { error: 'Finalize o desafio antes de excluí-lo.' }
  }

  const { error } = await supabase.from('challenges').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/desafios')
  return {}
}

// ─── Capa do desafio ────────────────────────────────────────────────────────

// ─── Upload da arte de capa (substitui a existente) ────────────────────────────
export async function uploadChallengeCover(challengeId: string, formData: FormData): Promise<{ error?: string; coverUrl?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { tenantId } = ctx

  const file = formData.get('cover') as File | null
  if (!file || file.size === 0) return { error: 'Selecione uma imagem.' }

  if (file.size > CHALLENGE_COVER_MAX_BYTES) {
    return { error: 'A imagem deve ter no máximo 5 MB.' }
  }

  const ext = CHALLENGE_COVER_ALLOWED_MIME[file.type]
  if (!ext) return { error: 'Formato não suportado. Use JPG, PNG ou WebP.' }

  const adminSupabase = createAdminClient()
  const path = `${tenantId}/${challengeId}.${ext}`

  const { error: uploadError } = await adminSupabase.storage
    .from('challenge-covers')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true })

  if (uploadError) return { error: `Erro ao fazer upload: ${uploadError.message}` }

  const { data: { publicUrl } } = adminSupabase.storage
    .from('challenge-covers')
    .getPublicUrl(path)

  const coverUrl = `${publicUrl}?v=${Date.now()}`

  const { error } = await adminSupabase
    .from('challenges')
    .update({ cover_image_url: coverUrl })
    .eq('id', challengeId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/desafios')
  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return { coverUrl }
}

// ─── Remover a arte de capa ─────────────────────────────────────────────────────
export async function removeChallengeCover(challengeId: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  const adminSupabase = createAdminClient()
  await adminSupabase.storage.from('challenge-covers').remove([
    `${tenantId}/${challengeId}.jpg`,
    `${tenantId}/${challengeId}.png`,
    `${tenantId}/${challengeId}.webp`,
  ])

  const { error } = await supabase
    .from('challenges')
    .update({ cover_image_url: null })
    .eq('id', challengeId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/desafios')
  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Iniciar desafio (rascunho → ativo) ────────────────────────────────────────
export async function startChallenge(id: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { count: participantCount } = await supabase
    .from('challenge_participants')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_id', id)

  if ((participantCount ?? 0) === 0) {
    return { error: 'Adicione ao menos um participante antes de iniciar o desafio.' }
  }

  const { error } = await supabase
    .from('challenges')
    .update({ status: 'active', start_date: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .eq('status', 'draft')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/desafios')
  revalidatePath(`/dashboard/desafios/${id}`)
  return {}
}

// ─── Finalizar desafio (calcula ranking por queda de % de gordura) ─────────────
export async function finishChallenge(id: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { data: participants, error: fetchError } = await supabase
    .from('challenge_participants')
    .select('id, initial_body_fat, final_body_fat')
    .eq('challenge_id', id)

  if (fetchError) return { error: fetchError.message }
  if (!participants || participants.length === 0) {
    return { error: 'Este desafio não possui participantes.' }
  }

  type Ranked = { id: string; delta_pp: number }
  const ranked: Ranked[] = []
  const unranked: string[] = []

  for (const p of participants) {
    if (p.initial_body_fat != null && p.final_body_fat != null) {
      ranked.push({ id: p.id, delta_pp: p.initial_body_fat - p.final_body_fat })
    } else {
      unranked.push(p.id)
    }
  }

  ranked.sort((a, b) => b.delta_pp - a.delta_pp)

  const updates = [
    ...ranked.map((r, idx) =>
      supabase
        .from('challenge_participants')
        .update({ result_rank: idx + 1, result_delta_pp: r.delta_pp })
        .eq('id', r.id)
    ),
    ...unranked.map((pid) =>
      supabase
        .from('challenge_participants')
        .update({ result_rank: null, result_delta_pp: null })
        .eq('id', pid)
    ),
  ]

  await Promise.all(updates)

  const { error } = await supabase
    .from('challenges')
    .update({ status: 'finished' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/desafios')
  revalidatePath(`/dashboard/desafios/${id}`)
  return {}
}

// ─── Publicar resultados (libera ranking aos alunos) ───────────────────────────
export async function publishChallengeResults(
  id: string,
  showResultsToStudents: boolean
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase
    .from('challenges')
    .update({
      status: 'published',
      results_published_at: new Date().toISOString(),
      show_results_to_students: showResultsToStudents,
    })
    .eq('id', id)
    .eq('status', 'finished')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/desafios')
  revalidatePath(`/dashboard/desafios/${id}`)
  revalidatePath('/student/desafios')
  return {}
}

// ─── Participantes ──────────────────────────────────────────────────────────

export interface ParticipantInitialData {
  initial_age?: number | null
  initial_weight?: number | null
  initial_body_fat?: number | null
  initial_arm?: number | null
  initial_chest?: number | null
  initial_waist?: number | null
  initial_hip?: number | null
  initial_thigh?: number | null
}

export interface ParticipantFinalData {
  final_weight?: number | null
  final_body_fat?: number | null
  final_arm?: number | null
  final_chest?: number | null
  final_waist?: number | null
  final_hip?: number | null
  final_thigh?: number | null
  final_notes?: string | null
}

// ─── Adicionar aluno já cadastrado como participante ───────────────────────────
export async function addExistingStudentAsParticipant(
  challengeId: string,
  studentId: string,
  initialData: ParticipantInitialData
): Promise<{ id?: string; error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('challenge_participants')
    .insert({
      tenant_id: tenantId,
      challenge_id: challengeId,
      student_id: studentId,
      ...initialData,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Este aluno já participa do desafio.' }
    return { error: error.message }
  }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return { id: data.id }
}

// ─── Convidar novo participante (cria aluno + acesso, segue o fluxo de convite existente) ──
export async function inviteNewParticipant(
  challengeId: string,
  input: { full_name: string; email: string; phone?: string | null; birth_date?: string | null; goal?: string | null },
  initialData: ParticipantInitialData
): Promise<{ id?: string; error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  const fullName = input.full_name.trim()
  const email = input.email.trim().toLowerCase()
  if (!fullName) return { error: 'Nome completo é obrigatório.' }
  if (!email) return { error: 'E-mail é obrigatório para convidar um novo participante.' }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'Não autenticado' }

  const { data: personalProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', currentUser.id)
    .single()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, logo_url, primary_color, max_students')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { error: 'Studio não encontrado.' }

  const { count: currentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  if ((currentCount ?? 0) >= tenant.max_students) {
    return { error: `Limite de ${tenant.max_students} alunos atingido para o seu plano. Faça upgrade para continuar.` }
  }

  const adminSupabase = createAdminClient()
  const tempPassword = generateTempPassword()

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'student' },
  })

  if (authError || !authData.user) {
    return { error: `Erro ao criar acesso: ${authError?.message ?? 'desconhecido'}` }
  }

  const userId = authData.user.id

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ tenant_id: tenantId, must_change_password: true })
    .eq('id', userId)

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(userId)
    return { error: `Erro ao configurar perfil: ${profileError.message}` }
  }

  const { data: student, error: studentError } = await adminSupabase
    .from('students')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      full_name: fullName,
      email,
      phone: input.phone ?? null,
      birth_date: input.birth_date || null,
      goal: input.goal ?? null,
      status: 'active',
    })
    .select('id')
    .single()

  if (studentError || !student) {
    await adminSupabase.auth.admin.deleteUser(userId)
    return { error: `Erro ao cadastrar aluno: ${studentError?.message ?? 'desconhecido'}` }
  }

  const { data: participant, error: participantError } = await adminSupabase
    .from('challenge_participants')
    .insert({
      tenant_id: tenantId,
      challenge_id: challengeId,
      student_id: student.id,
      ...initialData,
    })
    .select('id')
    .single()

  if (participantError || !participant) {
    return { error: `Aluno cadastrado, mas houve erro ao vincular ao desafio: ${participantError?.message ?? 'desconhecido'}` }
  }

  const { error: emailError } = await supabase.functions.invoke('send-student-welcome', {
    body: {
      email,
      studentName: fullName,
      personalName: personalProfile?.full_name ?? tenant.business_name,
      businessName: tenant.business_name,
      tempPassword,
      logoUrl: tenant.logo_url,
      primaryColor: tenant.primary_color,
    },
  })

  if (emailError) {
    console.error('[inviteNewParticipant] Falha ao enviar e-mail:', emailError.message)
  }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  revalidatePath('/dashboard/alunos')
  return { id: participant.id }
}

// ─── Remover participante (não exclui o cadastro do aluno) ─────────────────────
export async function removeParticipant(participantId: string, challengeId: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase.from('challenge_participants').delete().eq('id', participantId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Atualizar dados iniciais de um participante ───────────────────────────────
export async function updateParticipantInitialData(
  participantId: string,
  challengeId: string,
  data: ParticipantInitialData
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase.from('challenge_participants').update(data).eq('id', participantId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Atualizar dados finais de um participante ─────────────────────────────────
export async function updateParticipantFinalData(
  participantId: string,
  challengeId: string,
  data: ParticipantFinalData
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase.from('challenge_participants').update(data).eq('id', participantId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Dias do desafio ────────────────────────────────────────────────────────

export interface ChallengeDay {
  id: string
  tenant_id: string
  challenge_id: string
  day_number: number
  title: string | null
  release_date: string | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface ChallengeDayItem {
  id: string
  tenant_id: string
  challenge_day_id: string
  item_type: ChallengeItemType
  title: string
  content: string | null
  exercise_id: string | null
  file_url: string | null
  sort_order: number
  combo_group_id: string | null
  combo_type: 'biset' | 'triset' | 'circuit' | null
  created_at: string
  updated_at: string
}

// ─── Listar dias de um desafio (com itens) ─────────────────────────────────────
export async function getChallengeDays(
  challengeId: string
): Promise<(ChallengeDay & { items: (ChallengeDayItem & { exercise_name: string | null })[] })[]> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return []
  const { supabase } = ctx

  const { data } = await supabase
    .from('challenge_days')
    .select('*, challenge_day_items(*, exercises(name))')
    .eq('challenge_id', challengeId)
    .order('day_number', { ascending: true })

  if (!data) return []

  return data.map((row) => {
    const { challenge_day_items, ...rest } = row as unknown as ChallengeDay & {
      challenge_day_items: (ChallengeDayItem & { exercises: { name: string } | null })[]
    }
    return {
      ...rest,
      items: (challenge_day_items ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ exercises, ...item }) => ({ ...item, exercise_name: exercises?.name ?? null })),
    }
  })
}

// ─── Criar dia do desafio ───────────────────────────────────────────────────────
export async function createChallengeDay(
  challengeId: string,
  input: { day_number: number; title?: string | null; release_date?: string | null }
): Promise<{ id?: string; error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('challenge_days')
    .insert({
      tenant_id: tenantId,
      challenge_id: challengeId,
      day_number: input.day_number,
      title: input.title?.trim() || null,
      release_date: input.release_date || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: `Já existe um dia ${input.day_number} para este desafio.` }
    return { error: error.message }
  }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return { id: data.id }
}

// ─── Atualizar dia do desafio ───────────────────────────────────────────────────
export async function updateChallengeDay(
  dayId: string,
  challengeId: string,
  fields: { title?: string | null; release_date?: string | null }
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase
    .from('challenge_days')
    .update({ title: fields.title?.trim() || null, release_date: fields.release_date || null })
    .eq('id', dayId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Excluir dia do desafio ─────────────────────────────────────────────────────
export async function deleteChallengeDay(dayId: string, challengeId: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase.from('challenge_days').delete().eq('id', dayId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Publicar um dia específico ─────────────────────────────────────────────────
export async function publishChallengeDay(dayId: string, challengeId: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase
    .from('challenge_days')
    .update({ status: 'published' })
    .eq('id', dayId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/desafios/${challengeId}`)
  revalidatePath('/student/desafios')
  return {}
}

// ─── Publicar todos os dias de uma vez (modo "tudo de imediato") ──────────────
export async function publishAllChallengeDays(challengeId: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase
    .from('challenge_days')
    .update({ status: 'published' })
    .eq('challenge_id', challengeId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/desafios/${challengeId}`)
  revalidatePath('/student/desafios')
  return {}
}

// ─── Itens de um dia ────────────────────────────────────────────────────────

export interface CreateChallengeDayItemInput {
  item_type: ChallengeItemType
  title: string
  content?: string | null
  exercise_id?: string | null
  file_url?: string | null
  sort_order?: number
}

// ─── Criar item de um dia ───────────────────────────────────────────────────────
export async function createChallengeDayItem(
  dayId: string,
  challengeId: string,
  input: CreateChallengeDayItemInput
): Promise<{ id?: string; error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  if (!input.title?.trim()) return { error: 'Título do item é obrigatório.' }
  if (input.item_type === 'exercise' && !input.exercise_id) {
    return { error: 'Selecione um exercício para itens do tipo exercício.' }
  }

  const { data, error } = await supabase
    .from('challenge_day_items')
    .insert({
      tenant_id: tenantId,
      challenge_day_id: dayId,
      item_type: input.item_type,
      title: input.title.trim(),
      content: input.content?.trim() || null,
      exercise_id: input.item_type === 'exercise' ? input.exercise_id : null,
      file_url: input.item_type === 'file' ? (input.file_url ?? null) : null,
      sort_order: input.sort_order ?? 0,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Erro ao criar item' }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return { id: data.id }
}

// ─── Criar vários itens de um dia de uma vez (ex: múltiplos exercícios) ────────
export async function createChallengeDayItems(
  dayId: string,
  challengeId: string,
  inputs: CreateChallengeDayItemInput[]
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  if (inputs.length === 0) return {}
  for (const input of inputs) {
    if (!input.title?.trim()) return { error: 'Título do item é obrigatório.' }
    if (input.item_type === 'exercise' && !input.exercise_id) {
      return { error: 'Selecione um exercício para itens do tipo exercício.' }
    }
  }

  const { count } = await supabase
    .from('challenge_day_items')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_day_id', dayId)

  const startOrder = count ?? 0

  const rows = inputs.map((input, idx) => ({
    tenant_id: tenantId,
    challenge_day_id: dayId,
    item_type: input.item_type,
    title: input.title.trim(),
    content: input.content?.trim() || null,
    exercise_id: input.item_type === 'exercise' ? input.exercise_id : null,
    file_url: input.item_type === 'file' ? (input.file_url ?? null) : null,
    sort_order: startOrder + idx,
  }))

  const { error } = await supabase.from('challenge_day_items').insert(rows)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Reordenar itens de um dia ──────────────────────────────────────────────────
export async function reorderChallengeDayItems(
  dayId: string,
  orderedIds: string[],
  challengeId: string
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('challenge_day_items')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('challenge_day_id', dayId)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Combinar itens de exercício em Bi-Série/Tri-Série/Circuito ────────────────
export async function groupChallengeDayItems(
  itemIds: string[],
  comboType: 'biset' | 'triset' | 'circuit',
  challengeId: string
): Promise<{ comboGroupId?: string; error?: string }> {
  if (itemIds.length < 2) return { error: 'Selecione ao menos 2 exercícios para combinar' }
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { data: items } = await supabase
    .from('challenge_day_items')
    .select('id, item_type')
    .in('id', itemIds)

  if ((items ?? []).some((i) => i.item_type !== 'exercise')) {
    return { error: 'Só é possível combinar itens do tipo exercício.' }
  }

  const comboGroupId = crypto.randomUUID()
  const updates = itemIds.map((id) =>
    supabase
      .from('challenge_day_items')
      .update({ combo_group_id: comboGroupId, combo_type: comboType })
      .eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return { comboGroupId }
}

// ─── Desfazer combinação de itens ───────────────────────────────────────────────
export async function ungroupChallengeDayItems(
  comboGroupId: string,
  challengeId: string
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase
    .from('challenge_day_items')
    .update({ combo_group_id: null, combo_type: null })
    .eq('combo_group_id', comboGroupId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Atualizar item de um dia ───────────────────────────────────────────────────
export async function updateChallengeDayItem(
  itemId: string,
  challengeId: string,
  fields: Partial<CreateChallengeDayItemInput>
): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase
    .from('challenge_day_items')
    .update({
      ...fields,
      title: fields.title?.trim(),
      content: fields.content?.trim() || null,
    })
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Excluir item de um dia ─────────────────────────────────────────────────────
export async function deleteChallengeDayItem(itemId: string, challengeId: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { error } = await supabase.from('challenge_day_items').delete().eq('id', itemId)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  return {}
}

// ─── Mensagens / dicas diárias ──────────────────────────────────────────────

export interface ChallengeMessage {
  id: string
  tenant_id: string
  challenge_id: string
  message: string
  created_at: string
}

// ─── Enviar dica/mensagem a todos os participantes do desafio ─────────────────
export async function sendChallengeMessage(challengeId: string, message: string): Promise<{ error?: string }> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase, tenantId } = ctx

  const trimmed = message.trim()
  if (!trimmed) return { error: 'Mensagem não pode ser vazia.' }

  const { error } = await supabase.from('challenge_messages').insert({
    tenant_id: tenantId,
    challenge_id: challengeId,
    message: trimmed,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/desafios/${challengeId}`)
  revalidatePath('/student/desafios')
  return {}
}

// ─── Listar mensagens de um desafio (personal) ─────────────────────────────────
export async function getChallengeMessages(challengeId: string): Promise<ChallengeMessage[]> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return []
  const { supabase } = ctx

  const { data } = await supabase
    .from('challenge_messages')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ─── Acompanhamento (dashboard do desafio) ──────────────────────────────────

export interface ParticipantTracking {
  participant_id: string
  student_id: string
  student_name: string
  completed_items: number
  total_published_items: number
  progress_pct: number
}

// ─── Progresso de cada participante nos itens já publicados ───────────────────
export async function getChallengeTracking(challengeId: string): Promise<ParticipantTracking[]> {
  const ctx = await requirePersonalCtx()
  if (!ctx) return []
  const { supabase } = ctx

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('id, student_id, students(full_name)')
    .eq('challenge_id', challengeId)

  if (!participants || participants.length === 0) return []

  const { count: totalPublishedItems } = await supabase
    .from('challenge_day_items')
    .select('id, challenge_days!inner(challenge_id, status)', { count: 'exact', head: true })
    .eq('challenge_days.challenge_id', challengeId)
    .eq('challenge_days.status', 'published')

  const { data: progressRows } = await supabase
    .from('challenge_item_progress')
    .select('participant_id, challenge_day_items!inner(challenge_day_id, challenge_days!inner(challenge_id))')
    .eq('challenge_day_items.challenge_days.challenge_id', challengeId)

  const completedByParticipant = new Map<string, number>()
  for (const row of progressRows ?? []) {
    const pid = (row as unknown as { participant_id: string }).participant_id
    completedByParticipant.set(pid, (completedByParticipant.get(pid) ?? 0) + 1)
  }

  const total = totalPublishedItems ?? 0

  return participants.map((p) => {
    const row = p as unknown as { id: string; student_id: string; students: { full_name: string } | null }
    const completed = completedByParticipant.get(row.id) ?? 0
    return {
      participant_id: row.id,
      student_id: row.student_id,
      student_name: row.students?.full_name ?? 'Aluno removido',
      completed_items: completed,
      total_published_items: total,
      progress_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })
}

// ─── Área do aluno ──────────────────────────────────────────────────────────

async function requireStudentCtx() {
  const ctx = await getCtx()
  if (!ctx) return null
  if (ctx.role !== 'student') return null
  return ctx
}

export interface StudentChallengeDayItem {
  id: string
  item_type: ChallengeItemType
  title: string
  content: string | null
  exercise_id: string | null
  file_url: string | null
  sort_order: number
  completed: boolean
}

export interface StudentChallengeDay {
  id: string
  day_number: number
  title: string | null
  release_date: string | null
  items: StudentChallengeDayItem[]
}

export interface StudentActiveChallenge {
  challenge_id: string
  participant_id: string
  name: string
  description: string | null
  rules: string | null
  prizes: string | null
  cover_image_url: string | null
  days: StudentChallengeDay[]
}

// ─── Desafio ativo do aluno logado (só aparece se ele estiver participando) ────
export async function getStudentActiveChallenge(): Promise<StudentActiveChallenge | null> {
  const ctx = await requireStudentCtx()
  if (!ctx) return null
  const { supabase } = ctx

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!student) return null

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('id, challenge_id, created_at, challenges!inner(id, name, description, rules, prizes, status, cover_image_url)')
    .eq('student_id', student.id)
    .eq('challenges.status', 'active')
    .order('created_at', { ascending: false })

  const participant = participants?.[0]
  if (!participant) return null

  const challenge = (
    participant as unknown as {
      challenges: {
        name: string
        description: string | null
        rules: string | null
        prizes: string | null
        cover_image_url: string | null
      }
    }
  ).challenges

  const { data: days } = await supabase
    .from('challenge_days')
    .select('*, challenge_day_items(*)')
    .eq('challenge_id', participant.challenge_id)
    .eq('status', 'published')
    .order('day_number', { ascending: true })

  const { data: progress } = await supabase
    .from('challenge_item_progress')
    .select('challenge_day_item_id')
    .eq('participant_id', participant.id)

  const completedIds = new Set((progress ?? []).map((p) => p.challenge_day_item_id))

  return {
    challenge_id: participant.challenge_id,
    participant_id: participant.id,
    name: challenge.name,
    description: challenge.description,
    rules: challenge.rules,
    prizes: challenge.prizes,
    cover_image_url: challenge.cover_image_url,
    days: (days ?? []).map((d) => {
      const row = d as unknown as ChallengeDay & { challenge_day_items: ChallengeDayItem[] }
      return {
        id: row.id,
        day_number: row.day_number,
        title: row.title,
        release_date: row.release_date,
        items: (row.challenge_day_items ?? [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            id: item.id,
            item_type: item.item_type,
            title: item.title,
            content: item.content,
            exercise_id: item.exercise_id,
            file_url: item.file_url,
            sort_order: item.sort_order,
            completed: completedIds.has(item.id),
          })),
      }
    }),
  }
}

// ─── Aluno marca um item como concluído ────────────────────────────────────────
// A lógica de progresso/pontuação/histórico vive inteiramente na RPC
// mark_challenge_item_complete (banco), a mesma usada pelo app mobile — isso
// garante que web e mobile tenham exatamente o mesmo comportamento (progresso,
// ranking em monthly_points e registro no Histórico via workout_sessions
// sintética para itens de exercício). Ver supabase/migrations/
// 20260722_challenge_exercise_ranking_history.sql.
export async function markItemComplete(itemId: string): Promise<{ error?: string }> {
  const ctx = await requireStudentCtx()
  if (!ctx) return { error: 'Acesso negado' }
  const { supabase } = ctx

  const { data, error } = await supabase.rpc('mark_challenge_item_complete', { p_item_id: itemId })

  if (error) return { error: error.message }
  const result = data as { error?: string; already_completed?: boolean; completed?: boolean } | null
  if (result?.error === 'item_not_found') return { error: 'Item não encontrado ou ainda não liberado.' }
  if (result?.error === 'day_not_published') return { error: 'Este dia ainda não foi liberado.' }
  if (result?.error === 'not_a_participant') return { error: 'Você não participa deste desafio.' }
  if (result?.error) return { error: result.error }

  revalidatePath('/student/desafios')
  return {}
}

export interface ChallengeRankingEntry {
  student_name: string
  rank: number | null
  delta_pp: number | null
  is_me: boolean
  initial_weight?: number | null
  final_weight?: number | null
  initial_body_fat?: number | null
  final_body_fat?: number | null
}

// ─── Ranking final do desafio (após publicação, aluno) ────────────────────────
export async function getStudentChallengeResults(challengeId: string): Promise<{
  challenge_name: string
  cover_image_url: string | null
  show_details: boolean
  ranking: ChallengeRankingEntry[]
} | null> {
  const ctx = await requireStudentCtx()
  if (!ctx) return null
  const { supabase } = ctx

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!student) return null

  const { data: challenge } = await supabase
    .from('challenges')
    .select('name, status, show_results_to_students, cover_image_url')
    .eq('id', challengeId)
    .eq('status', 'published')
    .single()

  if (!challenge) return null

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select(
      'student_id, result_rank, result_delta_pp, initial_weight, final_weight, initial_body_fat, final_body_fat, students(full_name)'
    )
    .eq('challenge_id', challengeId)
    .order('result_rank', { ascending: true, nullsFirst: false })

  return {
    challenge_name: challenge.name,
    cover_image_url: challenge.cover_image_url,
    show_details: challenge.show_results_to_students,
    ranking: (participants ?? []).map((p) => {
      const row = p as unknown as {
        student_id: string
        result_rank: number | null
        result_delta_pp: number | null
        initial_weight: number | null
        final_weight: number | null
        initial_body_fat: number | null
        final_body_fat: number | null
        students: { full_name: string } | null
      }
      return {
        student_name: row.students?.full_name ?? 'Aluno',
        rank: row.result_rank,
        delta_pp: row.result_delta_pp,
        is_me: row.student_id === student.id,
        ...(challenge.show_results_to_students
          ? {
              initial_weight: row.initial_weight,
              final_weight: row.final_weight,
              initial_body_fat: row.initial_body_fat,
              final_body_fat: row.final_body_fat,
            }
          : {}),
      }
    }),
  }
}

// ─── Mensagens/dicas de um desafio (aluno) ─────────────────────────────────────
export async function getStudentChallengeMessages(challengeId: string): Promise<ChallengeMessage[]> {
  const ctx = await requireStudentCtx()
  if (!ctx) return []
  const { supabase } = ctx

  const { data } = await supabase
    .from('challenge_messages')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ─── Id do desafio publicado mais recente que o aluno participou ──────────────
export async function getStudentLatestPublishedChallengeId(): Promise<string | null> {
  const ctx = await requireStudentCtx()
  if (!ctx) return null
  const { supabase } = ctx

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!student) return null

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('challenge_id, challenges!inner(status, results_published_at)')
    .eq('student_id', student.id)
    .eq('challenges.status', 'published')

  if (!participants || participants.length === 0) return null

  const sorted = [...participants].sort((a, b) => {
    const ap = (a as unknown as { challenges: { results_published_at: string | null } }).challenges.results_published_at ?? ''
    const bp = (b as unknown as { challenges: { results_published_at: string | null } }).challenges.results_published_at ?? ''
    return bp.localeCompare(ap)
  })

  return sorted[0].challenge_id
}

// ─── Aluno tem algo para ver na área de desafios? (usado no sidebar) ──────────
export async function hasVisibleStudentChallenge(): Promise<boolean> {
  const ctx = await requireStudentCtx()
  if (!ctx) return false
  const { supabase } = ctx

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!student) return false

  const { count } = await supabase
    .from('challenge_participants')
    .select('id, challenges!inner(status)', { count: 'exact', head: true })
    .eq('student_id', student.id)
    .in('challenges.status', ['active', 'published'])

  return (count ?? 0) > 0
}
