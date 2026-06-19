'use client'

import { signOut } from '@/app/actions/auth'
import { LogOut, User } from 'lucide-react'
import type { AppRole } from '@/types/database'

const ROLE_LABELS: Record<AppRole, string> = {
  global_admin: 'Admin Global',
  personal: 'Personal Trainer',
  student: 'Aluno',
}

interface UserMenuProps {
  name: string | null
  email: string
  role: AppRole
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-surface-border">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-brand-lime" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-medium text-text-primary truncate">
          {name ?? email}
        </p>
        <p className="text-xs text-text-secondary truncate">
          {ROLE_LABELS[role]}
        </p>
      </div>

      {/* Logout */}
      <form action={signOut}>
        <button
          type="submit"
          title="Sair"
          className="text-text-secondary hover:text-status-error transition-colors p-1"
        >
          <LogOut size={16} />
        </button>
      </form>
    </div>
  )
}
