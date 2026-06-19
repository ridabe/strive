// Gerado manualmente — sincronizar com schema após migrations
// Run: supabase gen types typescript --project-id lodetzmtsymvnjffmvat

export type AppRole = 'global_admin' | 'personal' | 'student'
export type audit_category = 'auth' | 'tenant' | 'user' | 'system'
export type TenantPlan = 'free' | 'pro' | 'premium'
export type TenantStatus = 'active' | 'inactive' | 'suspended'
export type ProfileStatus = 'active' | 'inactive' | 'suspended'
export type StudentStatus = 'active' | 'inactive'
export type WorkoutPlanStatus = 'active' | 'inactive'
export type FinancialPlanStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          business_name: string
          slug: string
          plan: TenantPlan
          status: TenantStatus
          app_name: string | null
          primary_color: string | null
          logo_url: string | null
          max_students: number
          contact_email: string | null
          contact_phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          slug: string
          plan?: TenantPlan
          status?: TenantStatus
          app_name?: string | null
          primary_color?: string | null
          logo_url?: string | null
          max_students?: number
          contact_email?: string | null
          contact_phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: AppRole
          status: ProfileStatus
          avatar_url: string | null
          tenant_id: string | null
          must_change_password: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: AppRole
          status?: ProfileStatus
          avatar_url?: string | null
          tenant_id?: string | null
          must_change_password?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>>
      }
      students: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          full_name: string
          email: string | null
          phone: string | null
          birth_date: string | null
          goal: string | null
          status: StudentStatus
          avatar_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          full_name: string
          email?: string | null
          phone?: string | null
          birth_date?: string | null
          goal?: string | null
          status?: StudentStatus
          avatar_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['students']['Insert'], 'id' | 'tenant_id'>>
      }
      workout_plans: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          name: string
          description: string | null
          status: WorkoutPlanStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          name: string
          description?: string | null
          status?: WorkoutPlanStatus
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['workout_plans']['Insert'], 'id' | 'tenant_id'>>
      }
      workout_exercises: {
        Row: {
          id: string
          tenant_id: string
          workout_plan_id: string
          name: string
          sets: number | null
          reps: string | null
          load: string | null
          rest_seconds: number | null
          notes: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          workout_plan_id: string
          name: string
          sets?: number | null
          reps?: string | null
          load?: string | null
          rest_seconds?: number | null
          notes?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['workout_exercises']['Insert'], 'id' | 'tenant_id'>>
      }
      physical_assessments: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          assessed_at: string
          weight: number | null
          height: number | null
          body_fat: number | null
          chest: number | null
          waist: number | null
          hip: number | null
          thigh: number | null
          arm: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          assessed_at?: string
          weight?: number | null
          height?: number | null
          body_fat?: number | null
          chest?: number | null
          waist?: number | null
          hip?: number | null
          thigh?: number | null
          arm?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['physical_assessments']['Insert'], 'id' | 'tenant_id'>>
      }
      attendance: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          workout_plan_id: string | null
          attended_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          workout_plan_id?: string | null
          attended_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['attendance']['Insert'], 'id' | 'tenant_id'>>
      }
      system_modules: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: 'treinos' | 'acompanhamento' | 'financeiro' | 'comunicacao' | 'whitelabel' | 'futuro'
          icon: string | null
          status: 'active' | 'beta' | 'coming_soon'
          available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category: 'treinos' | 'acompanhamento' | 'financeiro' | 'comunicacao' | 'whitelabel' | 'futuro'
          icon?: string | null
          status?: 'active' | 'beta' | 'coming_soon'
          available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['system_modules']['Insert']>
      }
      tenant_modules: {
        Row: {
          id: string
          tenant_id: string
          module_id: string
          enabled: boolean
          enabled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          module_id: string
          enabled?: boolean
          enabled_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tenant_modules']['Insert']>
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          category: audit_category
          description: string
          target_type: string | null
          target_id: string | null
          metadata: Record<string, unknown> | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          category: audit_category
          description: string
          target_type?: string | null
          target_id?: string | null
          metadata?: Record<string, unknown> | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['admin_audit_logs']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      generate_tenant_slug: {
        Args: { name: string }
        Returns: string
      }
      get_admin_last_sign_in: {
        Args: { p_user_id: string }
        Returns: { last_sign_in_at: string }[]
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: AppRole
      }
      get_my_tenant_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      app_role: AppRole
      profile_status: ProfileStatus
      audit_category: audit_category
      tenant_plan: TenantPlan
      tenant_status: TenantStatus
      student_status: StudentStatus
      workout_plan_status: WorkoutPlanStatus
      financial_plan_status: FinancialPlanStatus
    }
  }
}
