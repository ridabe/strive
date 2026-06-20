'use client'

import { useState, useRef } from 'react'
import { uploadSharedFile, deleteSharedFile } from './actions'
import {
  Plus, X, Loader2, Upload, FileText, ImageIcon,
  Trash2, Users, User, AlertTriangle, CheckCircle2,
  ChevronDown, ExternalLink,
} from 'lucide-react'

interface Student {
  id: string
  full_name: string
}

interface SharedFile {
  id: string
  title: string
  description: string | null
  file_url: string
  file_type: string
  file_name: string
  file_size: number | null
  created_at: string
  student_id: string | null
  students: { full_name: string } | null
}

interface Props {
  students: Student[]
  files: SharedFile[]
}

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ArquivosClient({ students, files: initialFiles }: Props) {
  const [files, setFiles]     = useState<SharedFile[]>(initialFiles)
  const [open, setOpen]       = useState(false)
  const [isPending, setPending] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [preview, setPreview] = useState<{ name: string; type: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function openModal() {
    setOpen(true)
    setError(null)
    setSuccess(false)
    setPreview(null)
  }

  function closeModal() {
    setOpen(false)
    setPreview(null)
    formRef.current?.reset()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setPreview({ name: f.name, type: f.type })
    else   setPreview(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const fd  = new FormData(e.currentTarget)
      const res = await uploadSharedFile(fd)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        closeModal()
      }
    } catch {
      setError('Erro ao enviar arquivo. Tente novamente.')
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await deleteSharedFile(id)
      if (!res.error) {
        setFiles(prev => prev.filter(f => f.id !== id))
      }
    } finally {
      setDeleting(null)
    }
  }

  const isPdf = (f: SharedFile) => f.file_type === 'pdf'

  return (
    <div className="space-y-5">

      {/* Botão de upload */}
      <div className="flex justify-end">
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors"
        >
          <Upload size={15} />
          Enviar Arquivo
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-status-success/10 border border-status-success/20 text-status-success text-sm font-medium">
          <CheckCircle2 size={15} />
          Arquivo enviado com sucesso!
        </div>
      )}

      {/* Lista de arquivos */}
      {files.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-14 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
            <FileText size={26} className="text-brand-lime" />
          </div>
          <div className="space-y-1">
            <p className="font-display font-bold text-text-primary uppercase tracking-widest">Nenhum arquivo ainda</p>
            <p className="text-sm text-text-secondary">Envie PDFs e imagens para compartilhar com seus alunos.</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Arquivo</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Para</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Tamanho</th>
                <th className="text-right px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Data</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {files.map(f => (
                <tr key={f.id} className="group hover:bg-surface-border/10">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isPdf(f)
                          ? 'bg-red-400/10 border border-red-400/20'
                          : 'bg-blue-400/10 border border-blue-400/20'
                      }`}>
                        {isPdf(f)
                          ? <FileText size={16} className="text-red-400" />
                          : <ImageIcon size={16} className="text-blue-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">{f.title}</p>
                        {f.description && (
                          <p className="text-xs text-text-secondary truncate">{f.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      {f.student_id ? (
                        <>
                          <User size={12} className="text-text-secondary flex-shrink-0" />
                          <span className="text-xs text-text-secondary truncate max-w-[120px]">
                            {f.students?.full_name ?? '—'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Users size={12} className="text-brand-lime flex-shrink-0" />
                          <span className="text-xs text-brand-lime font-medium">Todos os alunos</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-text-secondary hidden md:table-cell">
                    {fmtSize(f.file_size)}
                  </td>
                  <td className="px-4 py-4 text-right text-xs text-text-secondary whitespace-nowrap hidden md:table-cell">
                    {new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={f.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-border/30 transition-colors"
                        title="Abrir arquivo"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => handleDelete(f.id)}
                        disabled={deleting === f.id}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-colors disabled:opacity-40"
                        title="Excluir arquivo"
                      >
                        {deleting === f.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de upload */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">

            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Enviar Arquivo
              </h2>
              <button onClick={closeModal} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

              {/* Arquivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Arquivo <span className="text-text-secondary/50">(PDF ou imagem, máx. 20 MB)</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  preview
                    ? 'border-brand-lime/40 bg-brand-lime/5'
                    : 'border-surface-border hover:border-brand-lime/30 hover:bg-surface-border/10'
                }`}>
                  <input
                    ref={fileRef}
                    type="file"
                    name="file"
                    accept=".pdf,image/*"
                    required
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {preview ? (
                    <>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        preview.type === 'application/pdf'
                          ? 'bg-red-400/10 border border-red-400/20'
                          : 'bg-blue-400/10 border border-blue-400/20'
                      }`}>
                        {preview.type === 'application/pdf'
                          ? <FileText size={18} className="text-red-400" />
                          : <ImageIcon size={18} className="text-blue-400" />
                        }
                      </div>
                      <p className="text-sm text-text-primary font-medium text-center truncate max-w-xs">{preview.name}</p>
                      <p className="text-xs text-brand-lime">Clique para trocar</p>
                    </>
                  ) : (
                    <>
                      <Upload size={22} className="text-text-secondary" />
                      <p className="text-sm text-text-secondary text-center">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Dieta de cutting, Protocolo de hipertrofia..."
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime transition-colors"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Descrição <span className="text-text-secondary/50">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Breve descrição do conteúdo..."
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime transition-colors"
                />
              </div>

              {/* Para quem */}
              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  Compartilhar com
                </label>
                <div className="relative">
                  <select
                    name="student_id"
                    defaultValue=""
                    className="w-full appearance-none bg-background border border-surface-border rounded-lg px-3 py-2.5 pr-8 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                  >
                    <option value="">Todos os alunos</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-status-error">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest disabled:opacity-60 hover:bg-brand-lime/90 transition-colors"
                >
                  {isPending
                    ? <><Loader2 size={14} className="animate-spin" /> Enviando…</>
                    : <><Upload size={14} /> Enviar</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
