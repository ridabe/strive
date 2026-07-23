import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContentLibraryItemForm } from '@/components/content-library/content-library-item-form'
import { DeleteItemButton } from '../delete-item-button'

interface Props { params: Promise<{ id: string }> }

export default async function AdminEditarItemBibliotecaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from('content_library_items').select('*').eq('id', id).single(),
    supabase.from('content_library_categories').select('id, name, kind').order('kind').order('sort_order'),
  ])

  if (!item) notFound()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin/biblioteca" className="hover:text-text-primary transition-colors">
          Biblioteca de Conteúdo
        </Link>
        <span>/</span>
        <span className="text-text-primary">Editar item</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Editar Item
          </h1>
          <p className="text-text-secondary text-sm mt-1">{item.title}</p>
        </div>
        <DeleteItemButton id={item.id} title={item.title} thumbnailUrl={item.thumbnail_url} fileUrl={item.file_url} />
      </div>

      <ContentLibraryItemForm categories={categories ?? []} item={item as any} redirectTo="/admin/biblioteca" />
    </div>
  )
}
