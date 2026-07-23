import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Images, Settings2, BarChart3 } from 'lucide-react'
import { DeleteItemButton } from './delete-item-button'

const KIND_LABEL: Record<string, string> = { arte: 'Arte', material: 'Material', estudo: 'Estudo' }
const STATUS_LABEL: Record<string, string> = { draft: 'Rascunho', published: 'Publicado' }
const PLAN_LABEL: Record<string, string> = { free: 'Grátis', pro: 'Pro', premium: 'Premium' }

interface SearchParams { kind?: string; category?: string }
interface Props { searchParams: Promise<SearchParams> }

export default async function AdminBibliotecaPage({ searchParams }: Props) {
  const { kind, category } = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('content_library_categories')
    .select('id, name, kind, sort_order')
    .order('kind').order('sort_order')

  let query = supabase
    .from('content_library_items')
    .select('id, title, kind, format, status, min_plan, thumbnail_url, file_url, canva_template_url, category_id, content_library_categories(name)')
    .order('created_at', { ascending: false })

  if (kind) query = query.eq('kind', kind)
  if (category) query = query.eq('category_id', category)

  const { data: items } = await query

  // Contagem por categoria — usada pro checklist de "pronto pra lançar" (mín. 5 publicados/categoria)
  const { data: publishedCounts } = await supabase
    .from('content_library_items')
    .select('category_id')
    .eq('status', 'published')

  const countByCategory = new Map<string, number>()
  ;(publishedCounts ?? []).forEach(row => {
    countByCategory.set(row.category_id, (countByCategory.get(row.category_id) ?? 0) + 1)
  })
  const readyForLaunch = (categories ?? []).length > 0 &&
    (categories ?? []).every(c => (countByCategory.get(c.id) ?? 0) >= 5)

  function buildUrl(params: { kind?: string; category?: string }) {
    const sp = new URLSearchParams()
    if (params.kind) sp.set('kind', params.kind)
    if (params.category) sp.set('category', params.category)
    const s = sp.toString()
    return s ? `?${s}` : '/admin/biblioteca'
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Biblioteca de Conteúdo
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {items?.length ?? 0} ite{(items?.length ?? 0) === 1 ? 'm' : 'ns'} no catálogo — artes, materiais de apoio e estudos
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/biblioteca/metricas"
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-surface-border text-text-secondary text-sm font-medium hover:text-text-primary transition-colors whitespace-nowrap"
          >
            <BarChart3 size={15} />
            Métricas
          </Link>
          <Link
            href="/admin/biblioteca/categorias"
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-surface-border text-text-secondary text-sm font-medium hover:text-text-primary transition-colors whitespace-nowrap"
          >
            <Settings2 size={15} />
            Categorias
          </Link>
          <Link
            href="/admin/biblioteca/novo"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-brand-lime text-background text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={15} />
            Novo item
          </Link>
        </div>
      </div>

      {/* Checklist de prontidão pro lançamento (mín. 5 itens publicados/categoria) */}
      {categories && categories.length > 0 && (
        <div className={`rounded-xl border p-4 ${readyForLaunch ? 'bg-brand-lime/10 border-brand-lime/20' : 'bg-surface border-surface-border'}`}>
          <p className={`text-sm font-medium ${readyForLaunch ? 'text-brand-lime' : 'text-text-primary'}`}>
            {readyForLaunch
              ? 'Catálogo pronto — todas as categorias têm 5+ itens publicados.'
              : 'Módulo ainda em "coming soon": faltam itens publicados em pelo menos uma categoria (mínimo 5 cada).'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map(c => {
              const count = countByCategory.get(c.id) ?? 0
              const ok = count >= 5
              return (
                <span key={c.id} className={`text-xs px-2 py-1 rounded-md border ${ok ? 'text-brand-lime border-brand-lime/30 bg-brand-lime/5' : 'text-text-secondary border-surface-border'}`}>
                  {c.name}: {count}/5
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5">
        {['arte', 'material', 'estudo'].map(k => (
          <Link
            key={k}
            href={buildUrl({ kind: kind === k ? undefined : k, category })}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              kind === k ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/20' : 'bg-surface text-text-secondary border-surface-border hover:text-text-primary'
            }`}
          >
            {KIND_LABEL[k]}
          </Link>
        ))}
      </div>

      {!items || items.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <Images size={36} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">
            {categories?.length === 0 ? 'Crie uma categoria antes de adicionar itens.' : 'Nenhum item ainda com esse filtro.'}
          </p>
          {categories?.length === 0 ? (
            <Link href="/admin/biblioteca/categorias" className="inline-flex items-center gap-1.5 text-sm text-brand-lime hover:underline">
              <Plus size={13} /> Criar primeira categoria
            </Link>
          ) : (
            <Link href="/admin/biblioteca/novo" className="inline-flex items-center gap-1.5 text-sm text-brand-lime hover:underline">
              <Plus size={13} /> Criar primeiro item
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Item</th>
                  <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden lg:table-cell">Plano</th>
                  <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((it: any) => (
                  <tr key={it.id} className="hover:bg-surface-border/10 group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {it.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.thumbnail_url} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-border/50 flex items-center justify-center flex-shrink-0">
                            <Images size={14} className="text-text-secondary/30" />
                          </div>
                        )}
                        <p className="text-text-primary font-medium">{it.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary text-xs hidden md:table-cell">
                      {it.content_library_categories?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary text-xs hidden lg:table-cell">
                      {PLAN_LABEL[it.min_plan] ?? it.min_plan}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                        it.status === 'published' ? 'text-brand-lime bg-brand-lime/10' : 'text-text-secondary bg-surface-border/40'
                      }`}>
                        {STATUS_LABEL[it.status] ?? it.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/biblioteca/${it.id}`} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                          Editar
                        </Link>
                        <DeleteItemButton id={it.id} title={it.title} thumbnailUrl={it.thumbnail_url} fileUrl={it.file_url} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
