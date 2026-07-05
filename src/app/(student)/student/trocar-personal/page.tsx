import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { selectActiveTenant } from '@/app/actions/student-tenant'
import { TenantLogoHeader } from '@/components/layout/tenant-logo-header'

interface TenantOption {
  business_name: string
  logo_url: string | null
  primary_color: string | null
}

/**
 * Tela de escolha exibida quando o aluno tem mais de uma mentoria ativa
 * simultaneamente (ex: reativado por um personal antigo enquanto já ativo
 * em outro). Também acessível a qualquer momento pelo botão "Trocar de Personal".
 */
export default async function TrocarPersonalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activeRows } = await supabase
    .from('students')
    .select('id, tenant_id, tenants(business_name, logo_url, primary_color)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const options = activeRows ?? []

  if (options.length === 0) redirect('/student')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <p className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
            Escolha seu personal
          </p>
          <p className="text-sm text-text-secondary">
            Você tem mais de uma mentoria ativa. Escolha qual acessar agora.
          </p>
        </div>

        <div className="space-y-3">
          {options.map((row) => {
            const tenant = joinOne<TenantOption>(row.tenants)
            return (
              <form key={row.id} action={selectActiveTenant.bind(null, row.tenant_id)}>
                <button
                  type="submit"
                  className="w-full bg-surface border border-surface-border rounded-xl p-4 text-left hover:border-brand-lime/30 transition-colors"
                >
                  <TenantLogoHeader
                    logoUrl={tenant?.logo_url ?? null}
                    businessName={tenant?.business_name ?? 'Personal Trainer'}
                    primaryColor={tenant?.primary_color ?? '#E8FF47'}
                  />
                </button>
              </form>
            )
          })}
        </div>
      </div>
    </div>
  )
}
