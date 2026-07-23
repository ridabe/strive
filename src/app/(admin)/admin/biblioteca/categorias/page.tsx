import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CategoryForm } from './category-form'
import { DeleteCategoryButton } from './delete-category-button'

const KIND_LABEL: Record<string, string> = {
  arte: 'Arte',
  material: 'Material de apoio',
  estudo: 'Estudo',
}

export default async function AdminBibliotecaCategoriasPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('content_library_categories')
    .select('id, name, slug, kind, icon, sort_order')
    .order('kind')
    .order('sort_order')

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin/biblioteca" className="hover:text-text-primary transition-colors">
          Biblioteca de Conteúdo
        </Link>
        <span>/</span>
        <span className="text-text-primary">Categorias</span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Categorias
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Organizam os itens do catálogo dentro de cada tipo (Arte, Material de apoio, Estudo).
        </p>
      </div>

      <CategoryForm />

      {!categories || categories.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-8 text-center">
          <p className="text-sm text-text-secondary">Nenhuma categoria criada ainda.</p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden divide-y divide-surface-border">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{cat.name}</p>
                <p className="text-xs text-text-secondary">{KIND_LABEL[cat.kind] ?? cat.kind}</p>
              </div>
              <DeleteCategoryButton id={cat.id} name={cat.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
