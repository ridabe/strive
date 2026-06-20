import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FolderOpen, FileText, ImageIcon, ExternalLink, Download } from 'lucide-react'

interface SharedFile {
  id: string
  title: string
  description: string | null
  file_url: string
  file_type: string
  file_name: string
  file_size: number | null
  created_at: string
}

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileCard({ file }: { file: SharedFile }) {
  const isPdf = file.file_type === 'pdf'

  return (
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden group hover:border-brand-lime/20 transition-colors">
      {/* Thumbnail / ícone */}
      {!isPdf ? (
        <div className="relative aspect-video bg-background overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.file_url}
            alt={file.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-red-400/5 border-b border-surface-border flex items-center justify-center">
          <FileText size={40} className="text-red-400/50" />
        </div>
      )}

      {/* Info */}
      <div className="p-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-body font-semibold text-text-primary text-sm leading-snug">{file.title}</p>
          <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
            isPdf
              ? 'bg-red-400/10'
              : 'bg-blue-400/10'
          }`}>
            {isPdf
              ? <FileText size={12} className="text-red-400" />
              : <ImageIcon size={12} className="text-blue-400" />
            }
          </div>
        </div>

        {file.description && (
          <p className="text-xs text-text-secondary line-clamp-2">{file.description}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{new Date(file.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            {file.file_size && <span>· {fmtSize(file.file_size)}</span>}
          </div>
          <div className="flex items-center gap-1">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-lime/10 border border-brand-lime/20 text-brand-lime text-xs font-medium hover:bg-brand-lime/20 transition-colors"
            >
              <ExternalLink size={11} />
              Abrir
            </a>
            <a
              href={file.file_url}
              download={file.file_name}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-border/30 transition-colors"
              title="Baixar arquivo"
            >
              <Download size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ArquivosStudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) redirect('/student')

  const { data: files } = await supabase
    .from('shared_files')
    .select('id, title, description, file_url, file_type, file_name, file_size, created_at')
    .order('created_at', { ascending: false })

  const list = (files ?? []) as SharedFile[]
  const pdfs   = list.filter(f => f.file_type === 'pdf')
  const images = list.filter(f => f.file_type === 'image')

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <FolderOpen size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Arquivos
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Dietas, protocolos e materiais compartilhados pelo seu personal.
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-14 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
            <FolderOpen size={26} className="text-brand-lime" />
          </div>
          <div className="space-y-1">
            <p className="font-display font-bold text-text-primary uppercase tracking-widest">Nenhum arquivo ainda</p>
            <p className="text-sm text-text-secondary">Seu personal ainda não enviou arquivos para você.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">

          {/* PDFs */}
          {pdfs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-red-400" />
                <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
                  Documentos PDF ({pdfs.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pdfs.map(f => <FileCard key={f.id} file={f} />)}
              </div>
            </section>
          )}

          {/* Imagens */}
          {images.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-blue-400" />
                <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
                  Imagens ({images.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map(f => <FileCard key={f.id} file={f} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
