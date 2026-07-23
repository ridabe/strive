import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContentLibraryItemForm } from '@/components/content-library/content-library-item-form'

export default async function AdminNovoItemBibliotecaPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('content_library_categories')
    .select('id, name, kind')
    .order('kind').order('sort_order')

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin/biblioteca" className="hover:text-text-primary transition-colors">
          Biblioteca de Conteúdo
        </Link>
        <span>/</span>
        <span className="text-text-primary">Novo item</span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Novo Item
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Fica disponível para os personais assim que o status for &quot;Publicado&quot; e o módulo estiver ativo.
        </p>
      </div>

      <ContentLibraryItemForm categories={categories ?? []} redirectTo="/admin/biblioteca" />
    </div>
  )
}
