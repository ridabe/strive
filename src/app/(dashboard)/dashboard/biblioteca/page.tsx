import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getContentLibraryCategories, getContentLibraryItems } from '@/actions/content-library'
import { PlanUpgradeButton } from '@/components/dashboard/plan-upgrade-button'
import { SaveItemButton } from './save-item-button'
import { BibliotecaGuide } from './biblioteca-guide'
import { TrackedLink } from './tracked-link'
import { Images, Lock, ExternalLink, Download, FileText } from 'lucide-react'

const KIND_LABEL: Record<string, string> = { arte: 'Artes', material: 'Materiais de apoio', estudo: 'Estudos' }
const PLAN_LABEL: Record<string, string> = { free: 'Grátis', pro: 'Pro', premium: 'Premium' }
const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, premium: 2 }

interface SearchParams { kind?: string; category?: string }
interface Props { searchParams: Promise<SearchParams> }

export default async function BibliotecaPage({ searchParams }: Props) {
  const { kind, category } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['personal', 'global_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Verificar se o módulo está habilitado para este tenant
  if (profile.tenant_id) {
    const { data: tenantModule } = await supabase
      .from('tenant_modules')
      .select('enabled, system_modules!inner(slug)')
      .eq('tenant_id', profile.tenant_id)
      .eq('system_modules.slug', 'biblioteca_conteudo')
      .single()

    if (!tenantModule?.enabled) redirect('/dashboard')
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', profile.tenant_id ?? '')
    .single()

  const tenantPlan = tenant?.plan ?? 'free'

  const [categories, items] = await Promise.all([
    getContentLibraryCategories(),
    getContentLibraryItems({ kind, categoryId: category }),
  ])

  function buildUrl(params: { kind?: string; category?: string }) {
    const sp = new URLSearchParams()
    if (params.kind) sp.set('kind', params.kind)
    if (params.category) sp.set('category', params.category)
    const s = sp.toString()
    return s ? `?${s}` : '/dashboard/biblioteca'
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
            <Images size={18} className="text-brand-lime" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
              Biblioteca de Conteúdo
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Artes prontas, materiais de apoio e estudos — edite no seu Canva ou baixe direto
            </p>
          </div>
        </div>
        <BibliotecaGuide />
      </div>

      {/* Filtros de tipo */}
      <div className="flex flex-wrap gap-1.5">
        {['arte', 'material', 'estudo'].map(k => (
          <a
            key={k}
            href={buildUrl({ kind: kind === k ? undefined : k, category })}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              kind === k ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/20' : 'bg-surface text-text-secondary border-surface-border hover:text-text-primary'
            }`}
          >
            {KIND_LABEL[k]}
          </a>
        ))}
      </div>

      {/* Filtros de categoria */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.filter(c => !kind || c.kind === kind).map(c => (
            <a
              key={c.id}
              href={buildUrl({ kind, category: category === c.id ? undefined : c.id })}
              className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                category === c.id ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/20' : 'bg-surface/50 text-text-secondary border-surface-border hover:text-text-primary'
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-2">
          <Images size={36} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Nenhum item disponível ainda.</p>
          <p className="text-sm text-text-secondary">Em breve teremos novidades por aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const locked = PLAN_ORDER[it.min_plan] > PLAN_ORDER[tenantPlan]
            return (
              <div key={it.id} className="bg-surface border border-surface-border rounded-xl overflow-hidden flex flex-col">
                <div className="relative aspect-video bg-surface-border/30">
                  {it.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.thumbnail_url}
                      alt=""
                      className={`w-full h-full object-cover ${locked ? 'blur-sm' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Images size={28} className="text-text-secondary/20" />
                    </div>
                  )}
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/90 border border-surface-border text-xs text-text-secondary">
                        <Lock size={12} /> Plano {PLAN_LABEL[it.min_plan]}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary leading-snug">{it.title}</p>
                    {profile.tenant_id && !locked && (
                      <SaveItemButton itemId={it.id} tenantId={profile.tenant_id} saved={it.saved} />
                    )}
                  </div>

                  {it.content_library_categories?.name && (
                    <p className="text-[11px] text-text-secondary">{it.content_library_categories.name}</p>
                  )}

                  {it.description && (
                    <p className="text-xs text-text-secondary line-clamp-2">{it.description}</p>
                  )}

                  <div className="mt-auto pt-2">
                    {locked ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] text-text-secondary">Disponível a partir do plano {PLAN_LABEL[it.min_plan]}.</p>
                        <PlanUpgradeButton planSlug={it.min_plan === 'premium' ? 'premium' : 'pro'} label={`Assinar ${PLAN_LABEL[it.min_plan]}`} />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {it.canva_template_url && (
                          <TrackedLink
                            itemId={it.id}
                            href={it.canva_template_url}
                            event="canva_open"
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-lime text-text-inverse text-xs font-medium hover:bg-brand-dark transition-colors"
                          >
                            <ExternalLink size={13} /> Usar no Canva
                          </TrackedLink>
                        )}
                        {it.file_url && (
                          <TrackedLink
                            itemId={it.id}
                            href={it.file_url}
                            event="download"
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-text-secondary text-xs font-medium hover:text-text-primary transition-colors ${it.canva_template_url ? '' : 'flex-1'}`}
                          >
                            {it.canva_template_url ? <Download size={13} /> : <><FileText size={13} /> Baixar</>}
                          </TrackedLink>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
