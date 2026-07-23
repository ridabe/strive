'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createContentLibraryItem, updateContentLibraryItem } from '@/actions/content-library'
import { Upload, X, Loader2, ImageIcon, FileText } from 'lucide-react'

type Category = { id: string; name: string; kind: string }

type Item = {
  id: string
  category_id: string
  title: string
  description: string | null
  kind: string
  format: string
  thumbnail_url: string | null
  canva_template_url: string | null
  file_url: string | null
  suggested_caption: string | null
  tags: string[]
  min_plan: string
  status: string
}

const FORMAT_OPTIONS = [
  { value: 'instagram_post', label: 'Post Instagram' },
  { value: 'instagram_story', label: 'Story Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pdf', label: 'PDF' },
  { value: 'planilha', label: 'Planilha' },
  { value: 'infografico', label: 'Infográfico' },
  { value: 'outro', label: 'Outro' },
]

const PLAN_OPTIONS = [
  { value: 'free', label: 'Grátis' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' },
]

interface Props {
  categories: Category[]
  item?: Item
  redirectTo: string
}

export function ContentLibraryItemForm({ categories, item, redirectTo }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!item

  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const [categoryId, setCategoryId] = useState(item?.category_id ?? categories[0]?.id ?? '')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(item?.thumbnail_url ?? null)
  const [assetFile, setAssetFile] = useState<File | null>(null)
  const [assetName, setAssetName] = useState<string | null>(item?.file_url ? item.file_url.split('/').pop() ?? null : null)

  const selectedCategory = categories.find(c => c.id === categoryId)

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  function handleAssetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAssetFile(file)
    setAssetName(file.name)
  }

  async function uploadToContentLibrary(file: File, prefix: string) {
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('content-library')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) throw new Error(upErr.message)
    const { data } = supabase.storage.from('content-library').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!selectedCategory) { setError('Selecione uma categoria.'); return }

    setIsPending(true)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('category_id', categoryId)
      fd.set('kind', selectedCategory.kind)

      if (thumbnailFile) {
        const url = await uploadToContentLibrary(thumbnailFile, 'thumbnails')
        fd.set('thumbnail_url', url)
      } else if (item?.thumbnail_url) {
        fd.set('thumbnail_url', item.thumbnail_url)
      }

      if (assetFile) {
        const url = await uploadToContentLibrary(assetFile, 'files')
        fd.set('file_url', url)
      } else if (item?.file_url) {
        fd.set('file_url', item.file_url)
      }

      const result = isEdit
        ? await updateContentLibraryItem(item!.id, fd)
        : await createContentLibraryItem(fd)

      if (result.error) { setError(result.error); return }
      router.push(redirectTo)
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar item.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">Categoria</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
        >
          {categories.length === 0 && <option value="">Nenhuma categoria — crie uma primeiro</option>}
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">Título</label>
        <input
          name="title" required defaultValue={item?.title}
          placeholder="Ex: 5 mitos do treino de força"
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
          Descrição <span className="text-text-secondary/50">(opcional, uso interno)</span>
        </label>
        <textarea
          name="description" rows={2} defaultValue={item?.description ?? ''}
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary resize-none focus:outline-none focus:border-brand-lime transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">Formato</label>
          <select
            name="format" defaultValue={item?.format ?? 'instagram_post'}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
          >
            {FORMAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">Plano mínimo</label>
          <select
            name="min_plan" defaultValue={item?.min_plan ?? 'free'}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
          >
            {PLAN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">Thumbnail</label>
        <label className="flex items-center gap-3 border border-dashed border-surface-border rounded-lg p-3 cursor-pointer hover:border-brand-lime/40 transition-colors">
          {thumbnailPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailPreview} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
              <ImageIcon size={18} className="text-text-secondary/40" />
            </div>
          )}
          <span className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Upload size={13} /> {thumbnailPreview ? 'Trocar imagem' : 'Enviar imagem'}
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailChange} className="hidden" />
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
          Link de template do Canva <span className="text-text-secondary/50">(opcional se enviar arquivo)</span>
        </label>
        <input
          name="canva_template_url" type="url" defaultValue={item?.canva_template_url ?? ''}
          placeholder="https://www.canva.com/design/.../view?utm_content=..."
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
        />
        <p className="text-[11px] text-text-secondary/60">
          Gere em: abrir o design no Canva → Compartilhar → Link de modelo. O personal que abrir vai clicar em &quot;Usar modelo&quot; e o Canva copia pra conta dele.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
          Arquivo para download <span className="text-text-secondary/50">(opcional se tiver link do Canva)</span>
        </label>
        <label className="flex items-center gap-3 border border-dashed border-surface-border rounded-lg p-3 cursor-pointer hover:border-brand-lime/40 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-text-secondary/40" />
          </div>
          <span className="flex-1 text-sm text-text-secondary truncate">
            {assetName ?? 'Enviar PDF, planilha ou imagem'}
          </span>
          {assetName && (
            <button type="button" onClick={(e) => { e.preventDefault(); setAssetFile(null); setAssetName(null) }}>
              <X size={14} className="text-text-secondary" />
            </button>
          )}
          <input type="file" accept="application/pdf,image/*,.xlsx,.xls" onChange={handleAssetChange} className="hidden" />
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
          Legenda sugerida <span className="text-text-secondary/50">(opcional, para artes de post)</span>
        </label>
        <textarea
          name="suggested_caption" rows={3} defaultValue={item?.suggested_caption ?? ''}
          placeholder="Legenda pronta que o personal pode copiar ao postar..."
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary resize-none focus:outline-none focus:border-brand-lime transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">Tags</label>
        <input
          name="tags" defaultValue={item?.tags?.join(', ') ?? ''}
          placeholder="emagrecimento, hipertrofia, iniciante"
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
        />
        <p className="text-[11px] text-text-secondary/60">Separadas por vírgula.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">Status</label>
        <select
          name="status" defaultValue={item?.status ?? 'draft'}
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
        >
          <option value="draft">Rascunho (não aparece pros personais)</option>
          <option value="published">Publicado</option>
        </select>
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <button
        type="submit"
        disabled={isPending || categories.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {isEdit ? 'Salvar alterações' : 'Criar item'}
      </button>
    </form>
  )
}
