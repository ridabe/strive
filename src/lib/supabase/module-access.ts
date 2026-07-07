import { redirect } from 'next/navigation'
import { getCtx } from './context'
import { ACADEMIA_HIDDEN_FROM_ADMIN_SLUGS, ACADEMIA_HIDDEN_FROM_PERSONAL_SLUGS } from '@/lib/modules-config'

// ─── Bloqueio de página por papel dentro de uma academia ──────────────────────
// Espelha, no lado servidor, a mesma regra que já esconde os itens do menu
// (dashboard-sidebar.tsx / (dashboard)/layout.tsx): habilitação de módulo é
// por tenant, mas o acesso a certas ferramentas é por papel. Sem isso, um
// owner/admin (ou personal) que digitasse a URL na mão ainda conseguiria
// abrir a página mesmo sem o item aparecer no menu. Chamar no topo de toda
// page.tsx cujo slug esteja em ACADEMIA_HIDDEN_FROM_ADMIN_SLUGS ou
// ACADEMIA_HIDDEN_FROM_PERSONAL_SLUGS. Não afeta tenant autônomo — lá o
// próprio personal é o dono, sem distinção de papel.
export async function requireAcademiaModuleAccess(slug: string) {
  const ctx = await getCtx()
  if (!ctx) redirect('/login')

  const { supabase, tenantId, role } = ctx

  const { data: tenant } = await supabase
    .from('tenants')
    .select('tenant_type')
    .eq('id', tenantId)
    .single()

  if (tenant?.tenant_type !== 'academia') return

  const isAdmin = role === 'owner' || role === 'admin'

  if (isAdmin && ACADEMIA_HIDDEN_FROM_ADMIN_SLUGS.includes(slug)) {
    redirect('/dashboard')
  }

  if (!isAdmin && ACADEMIA_HIDDEN_FROM_PERSONAL_SLUGS.includes(slug)) {
    redirect('/dashboard')
  }
}
