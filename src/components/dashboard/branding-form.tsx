'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Loader2, Check, Palette, ImageIcon } from 'lucide-react'
import { saveBranding } from '@/app/actions/branding'

interface Props {
  initialLogoUrl: string | null
  initialColor: string
  businessName: string
}

const PRESET_COLORS = [
  '#E8FF47',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#84CC16',
]

export function BrandingForm({ initialLogoUrl, initialColor, businessName }: Props) {
  const [logoUrl,      setLogoUrl]      = useState<string | null>(initialLogoUrl)
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null)
  const [color,        setColor]        = useState(initialColor)
  const [removeLogo,   setRemoveLogo]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [saved,        setSaved]        = useState(false)
  const [isPending,    startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const previewLogo = logoPreview ?? (removeLogo ? null : logoUrl)
  const initial     = businessName.charAt(0).toUpperCase()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo deve ter no maximo 2 MB.')
      return
    }
    setLogoPreview(URL.createObjectURL(file))
    setRemoveLogo(false)
    setError(null)
  }

  function handleRemoveLogo() {
    setLogoPreview(null)
    setRemoveLogo(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    if (removeLogo) formData.set('remove_logo', '1')
    formData.set('primary_color', color)

    startTransition(async () => {
      const result = await saveBranding(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setLogoPreview(null)
        if (result.logoUrl !== undefined) setLogoUrl(result.logoUrl)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">

      {/* Preview ao vivo */}
      <div className="rounded-lg border border-surface-border bg-background p-4 space-y-3">
        <p className="text-xs font-body font-medium text-text-secondary uppercase tracking-wide">
          Pre-visualizacao da sidebar
        </p>
        <div className="flex gap-4 items-start">
          <div
            className="w-44 bg-surface border border-surface-border rounded-xl p-3 space-y-2 flex-shrink-0"
            style={{ '--brand-lime': color } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 min-h-[36px]">
              {previewLogo ? (
                <div className="relative w-full h-8">
                  <Image src={previewLogo} alt={businessName} fill className="object-contain object-left" sizes="144px" />
                </div>
              ) : (
                <>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-black font-bold text-xs flex-shrink-0"
                    style={{ background: color }}
                  >
                    {initial}
                  </div>
                  <span className="text-xs font-semibold text-text-primary truncate">{businessName}</span>
                </>
              )}
            </div>
            {['Dashboard', 'Alunos', 'Treinos'].map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-2 px-2 py-1 rounded-md text-xs"
                style={i === 0
                  ? { background: `${color}20`, color, border: `1px solid ${color}40` }
                  : { color: '#888' }
                }
              >
                <div className="w-2.5 h-2.5 rounded-sm" style={i === 0 ? { background: color } : { background: '#555' }} />
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Esta e a aparencia da barra lateral com suas configuracoes. Salve para aplicar ao painel e ao portal dos alunos.
          </p>
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-brand-lime" />
          <span className="text-sm font-body font-medium text-text-primary">Logo</span>
          <span className="text-xs text-text-secondary">PNG, JPG, SVG ou WebP ate 2 MB</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-14 rounded-lg border border-surface-border bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
            {previewLogo ? (
              <div className="relative w-full h-full p-1">
                <Image src={previewLogo} alt="Preview" fill className="object-contain" sizes="80px" />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-display font-black text-base"
                style={{ background: color }}
              >
                {initial}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-surface-border rounded-lg text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors"
            >
              <Upload size={12} /> Enviar logo
            </button>
            {(logoUrl || logoPreview) && !removeLogo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-status-error/20 rounded-lg text-status-error hover:bg-status-error/5 transition-colors"
              >
                <Trash2 size={12} /> Remover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cor primaria */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-brand-lime" />
          <span className="text-sm font-body font-medium text-text-primary">Cor primaria</span>
          <span className="text-xs text-text-secondary">Botoes, links ativos e destaques</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              title={c}
              className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
              style={{
                background: c,
                borderColor: color === c ? '#fff' : 'transparent',
                boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-14 bg-background border border-surface-border rounded-lg p-1 cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColor(v)
            }}
            maxLength={7}
            className="w-24 bg-background border border-surface-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-brand-lime/60"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-60"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
        {saved ? 'Salvo!' : 'Salvar identidade visual'}
      </button>

      {saved && (
        <p className="text-xs text-status-success">Identidade visual atualizada. Recarregue para ver o logo na sidebar.</p>
      )}
    </form>
  )
}
