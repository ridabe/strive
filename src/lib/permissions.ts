// Fonte única das regras de permissão por papel dentro de um tenant.
//
// O "papel efetivo" vem de getCtx() (src/lib/supabase/context.ts): numa
// academia é o tenant_members.role; num tenant autônomo é profiles.role.
// Papéis de academia: owner, admin, gerente, operador, personal.
//
// Operador e Gerente têm o MESMO nível de acesso (staff de operação da
// academia) — são dois rótulos para o mesmo conjunto de permissões.

export type TenantRole =
  | 'owner'
  | 'admin'
  | 'gerente'
  | 'operador'
  | 'personal'
  | (string & {})

export const MANAGER_ROLES = ['owner', 'admin'] as const
export const OPERATIONS_ROLES = ['gerente', 'operador'] as const
export const BACKOFFICE_ROLES = ['owner', 'admin', 'gerente', 'operador'] as const

/** Gestão institucional da academia (dono/admin). */
export function isManager(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

/** Staff de operação (secretaria/gerente): operação do dia a dia. */
export function isOperations(role: string): boolean {
  return role === 'gerente' || role === 'operador'
}

/** Qualquer staff institucional (não é personal nem aluno). */
export function isBackofficeStaff(role: string): boolean {
  return isManager(role) || isOperations(role)
}

// ── Capacidades ────────────────────────────────────────────────────────────

/** Cadastro, edição, (des)ativação de alunos e reenvio de senha. */
export function canManageStudents(role: string): boolean {
  return isBackofficeStaff(role)
}

/**
 * Quem pode CADASTRAR novos alunos.
 * - Numa academia: só o backoffice (owner/admin/gerente/operador). O personal
 *   da academia não cadastra — ele atende alunos atribuídos e pega os alunos
 *   ainda sem personal.
 * - Tenant autônomo: o próprio personal (dono) cadastra.
 */
export function canCreateStudents(role: string, isAcademia: boolean): boolean {
  if (isAcademia) return isBackofficeStaff(role)
  return true
}

/** Cadastrar personal e atribuir alunos a personais. */
export function canManagePersonal(role: string): boolean {
  return isBackofficeStaff(role)
}

/** Gestão completa da equipe (criar admin/operador/gerente, remover). */
export function canManageTeam(role: string): boolean {
  return isManager(role)
}

/** Quem (actorRole) pode criar um membro com determinado papel-alvo. */
export function canCreateMemberRole(actorRole: string, targetRole: string): boolean {
  if (isManager(actorRole)) {
    return ['admin', 'gerente', 'operador', 'personal'].includes(targetRole)
  }
  if (isOperations(actorRole)) {
    // Operação só cadastra personal — nunca outro staff administrativo.
    return targetRole === 'personal'
  }
  return false
}

/** Receita/faturamento AGREGADO no dashboard (valores globais). */
export function canViewRevenue(role: string): boolean {
  return isManager(role)
}

/**
 * Financeiro do aluno: ver cobranças/inadimplentes, gerenciar a recorrência e
 * dar baixa manual. Espelha a função SQL `can_manage_billing()` (fonte da
 * verdade é o RLS; esta função é só para gating de UI/action com mensagem
 * amigável).
 * - Tenant autônomo: sempre true — o personal é o dono do negócio.
 * - Academia: só owner/admin/gerente/operador — personal (staff) nunca, nem
 *   para o aluno atribuído a ele.
 */
export function canManageBilling(role: string, isAcademia: boolean): boolean {
  return !isAcademia || isBackofficeStaff(role)
}

/** Branding, plano e limites da academia. */
export function canManageAcademiaSettings(role: string): boolean {
  return isManager(role)
}

/** Módulos de estratégia/treino (operados pelo personal 1:1 com o aluno). */
export function canAccessTrainingModules(role: string): boolean {
  return role === 'personal'
}

/** Ver status de anamnese do aluno (se preencheu). */
export function canViewAnamnese(role: string): boolean {
  return isBackofficeStaff(role) || role === 'personal'
}

/** Estoque. */
export function canAccessInventory(role: string): boolean {
  return isBackofficeStaff(role)
}

/** Agenda, incluindo criar datas de pagamento para alunos. */
export function canUseAgenda(role: string): boolean {
  return isBackofficeStaff(role) || role === 'personal'
}
