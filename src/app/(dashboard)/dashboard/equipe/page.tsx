import { redirect } from 'next/navigation'
import { Shield, Users } from 'lucide-react'
import { getCtx } from '@/lib/supabase/context'
import { listTenantMembers } from '@/actions/tenant-members'
import { InviteMemberForm } from './invite-member-form'
import { RemoveMemberButton } from './remove-member-button'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Dono(a)',
  admin: 'Admin',
  personal: 'Personal',
}

export default async function EquipePage() {
  const ctx = await getCtx()
  if (!ctx) redirect('/login')

  const { supabase, tenantId, role } = ctx

  const { data: tenant } = await supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', tenantId)
    .single()

  // Só faz sentido para academias, e só owner/admin gerenciam a equipe.
  if (!tenant || tenant.tenant_type !== 'academia' || !['owner', 'admin'].includes(role)) {
    redirect('/dashboard')
  }

  const members = await listTenantMembers()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
          <Users size={22} className="text-brand-lime" />
          Equipe
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Personais e admins com acesso a esta academia.
        </p>
      </div>

      <InviteMemberForm />

      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-secondary">Nenhum membro além de você ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="font-body font-medium text-text-primary text-sm truncate">
                    {m.full_name ?? m.email ?? 'Sem nome'}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {m.email} · {m.assigned_students_count} aluno{m.assigned_students_count !== 1 ? 's' : ''} atribuído{m.assigned_students_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border text-text-secondary bg-background border-surface-border">
                    {m.role === 'owner' && <Shield size={11} />}
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                  {m.role !== 'owner' && (
                    <RemoveMemberButton tenantMemberId={m.id} memberName={m.full_name ?? m.email ?? 'este membro'} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
