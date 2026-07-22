// Aliases nomeados dos enums do schema.
//
// O `database.ts` é gerado por `supabase gen types` e NÃO exporta os enums por
// nome — apenas via `Database['public']['Enums'][...]`. Toda regeneração com
// `>` apaga qualquer alias manual adicionado lá. Este arquivo (mantido à mão)
// dá nomes estáveis usados pelo app e sobrevive às regenerações.
import type { Database } from '@/types/database'

type Enums = Database['public']['Enums']

export type AppRole = Enums['app_role']
export type ProfileStatus = Enums['profile_status']
export type BillingType = Enums['billing_type']
// nome em snake_case mantido por compatibilidade com os imports existentes
export type audit_category = Enums['audit_category']
export type ExtraWorkoutCategory = Enums['extra_workout_category']
export type FinancialPlanStatus = Enums['financial_plan_status']
export type PaymentMethod = Enums['payment_method']
export type ReminderChannel = Enums['reminder_channel']
