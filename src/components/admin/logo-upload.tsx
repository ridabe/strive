'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon } from 'lucide-react'

export function LogoUpload() {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) {
      alert('O logo deve ter no máximo 2MB.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreview(null)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        name="logo"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleInputChange}
        className="sr-only"
        id="logo-input"
      />

      {preview ? (
        /* Preview do logo */
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border border-surface-border bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image
              src={preview}
              alt="Preview do logo"
              width={80}
              height={80}
              className="w-full h-full object-contain p-2"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary font-medium truncate">{fileName}</p>
            <p className="text-xs text-text-secondary mt-0.5">Logo carregado com sucesso</p>
            <div className="flex items-center gap-3 mt-2">
              <label
                htmlFor="logo-input"
                className="text-xs text-brand-lime hover:text-brand-dark cursor-pointer transition-colors"
              >
                Trocar logo
              </label>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-status-error hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X size={12} /> Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Zona de drop */
        <label
          htmlFor="logo-input"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-lime bg-brand-lime/5'
              : 'border-surface-border hover:border-brand-lime/40 hover:bg-brand-lime/[0.02]'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isDragging ? 'bg-brand-lime/20' : 'bg-surface-border/30'
          }`}>
            {isDragging ? (
              <ImageIcon size={22} className="text-brand-lime" />
            ) : (
              <Upload size={22} className="text-text-secondary/60" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-body font-medium text-text-primary">
              {isDragging ? 'Solte o arquivo aqui' : 'Arraste o logo ou clique para selecionar'}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              PNG, JPG, WebP ou SVG — máximo 2MB
            </p>
          </div>
        </label>
      )}
    </div>
  )
}
