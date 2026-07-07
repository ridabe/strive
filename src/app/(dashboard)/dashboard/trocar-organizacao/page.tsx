import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinOne } from '@/lib/supabase/join'
import { selectActiveOrg } from '@/app/actions/personal-tenant'
import { TenantLogoHeader } from '@/components/layout/tenant-logo-header'

interface TenantOption {
  business_name: string
  logo_url: string | null
  primary_color: string | null
}

/**
 * Tela de escolha exibida quando o personal tem mais de um vínculo ativo
 * simultaneamente (ex: personal de uma academia que também atua em outra, ou
 * admin/owner com múltiplas organizações). Espelha
 * (student)/student/trocar-personal/page.tsx, trocando `students` por
 * `tenant_members` como fonte de vínculos.
 */
export default async function TrocarOrganizacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activeRows } = await supabase
    .from('tenant_members')
    .select('id, tenant_id, role, tenants(business_name, logo_url, primary_color)')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const options = activeRows ?? []

  if (options.length === 0) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <p className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
            Escolha sua organização
          </p>
          <p className="text-sm text-text-secondary">
            Você tem acesso a mais de uma organização. Escolha qual acessar agora.
          </p>
        </div>

        <div className="space-y-3">
          {options.map((row) => {
            const tenant = joinOne<TenantOption>(row.tenants)
            return (
              <form key={row.id} action={selectActiveOrg.bind(null, row.tenant_id)}>
                <button
                  type="submit"
                  className="w-full bg-surface border border-surface-border rounded-xl p-4 text-left hover:border-brand-lime/30 transition-colors"
                >
                  <TenantLogoHeader
                    logoUrl={tenant?.logo_url ?? null}
                    businessName={tenant?.business_name ?? 'Organização'}
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
