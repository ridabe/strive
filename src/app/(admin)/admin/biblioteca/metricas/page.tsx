import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BarChart3, Images, ArrowLeft } from 'lucide-react'

const KIND_LABEL: Record<string, string> = { arte: 'Arte', material: 'Material', estudo: 'Estudo' }

export default async function AdminBibliotecaMetricasPage() {
  const supabase = await createClient()

  const [{ data: items }, { data: saves }] = await Promise.all([
    supabase
      .from('content_library_items')
      .select('id, title, kind, status, thumbnail_url, canva_open_count, download_count, content_library_categories(name)')
      .eq('status', 'published'),
    supabase.from('content_library_item_saves').select('item_id'),
  ])

  const savesByItem = new Map<string, number>()
  ;(saves ?? []).forEach(s => savesByItem.set(s.item_id, (savesByItem.get(s.item_id) ?? 0) + 1))

  const ranked = (items ?? [])
    .map((it: any) => {
      const savesCount = savesByItem.get(it.id) ?? 0
      const total = it.canva_open_count + it.download_count + savesCount
      return { ...it, savesCount, total }
    })
    .sort((a, b) => b.total - a.total)

  const totalEngagement = ranked.reduce((sum, it) => sum + it.total, 0)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin/biblioteca" className="hover:text-text-primary transition-colors flex items-center gap-1">
          <ArrowLeft size={13} /> Biblioteca de Conteúdo
        </Link>
        <span>/</span>
        <span className="text-text-primary">Métricas</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <BarChart3 size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Métricas de Uso
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Itens mais salvos e usados pelos personais — use para priorizar a produção de conteúdo
          </p>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-2">
          <Images size={36} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">Ainda sem dados de uso.</p>
          <p className="text-sm text-text-secondary">Publique itens e volte aqui depois que os personais começarem a usar.</p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Item</th>
                  <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium">Salvos</th>
                  <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium">Canva</th>
                  <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium">Downloads</th>
                  <th className="text-right px-5 py-3 text-xs text-text-secondary font-body font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {ranked.map((it) => (
                  <tr key={it.id} className="hover:bg-surface-border/10">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {it.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.thumbnail_url} alt="" loading="lazy" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-surface-border" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-surface-border/50 flex items-center justify-center flex-shrink-0">
                            <Images size={13} className="text-text-secondary/30" />
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-medium leading-tight">{it.title}</p>
                          <p className="text-[11px] text-text-secondary">{KIND_LABEL[it.kind] ?? it.kind}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary text-xs hidden md:table-cell">
                      {it.content_library_categories?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-text-secondary text-xs">{it.savesCount}</td>
                    <td className="px-4 py-3.5 text-right text-text-secondary text-xs">{it.canva_open_count}</td>
                    <td className="px-4 py-3.5 text-right text-text-secondary text-xs">{it.download_count}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium text-brand-lime bg-brand-lime/10">
                        {it.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ranked.length > 0 && (
        <p className="text-xs text-text-secondary">
          Engajamento total no catálogo: {totalEngagement} interações (salvos + aberturas no Canva + downloads).
        </p>
      )}
    </div>
  )
}
