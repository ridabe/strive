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
  '#E8FF47', // Strive lime (padrão)
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
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
      setError('Logo deve ter no máximo 2 MB.')
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
    <form action={handleSubmit} className="space-y-8">

      {/* ── Preview ao vivo ─────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
        <h2 className="font-body font-semibold text-text-primary flex items-center gap-2">
          <Palette size={16} className="text-brand-lime" />
          Pré-visualização
        </h2>

        {/* Mini sidebar preview */}
        <div className="flex gap-4 items-start">
          <div
            className="w-48 bg-surface border border-surface-border rounded-xl p-3 space-y-3 flex-shrink-0"
            style={{ '--brand-lime': color } as React.CSSProperties}
          >
            {/* Logo preview */}
            <div className="flex items-center gap-2 min-h-[40px]">
              {previewLogo ? (
                <div className="relative w-full h-9">
                  <Image src={previewLogo} alt={businessName} fill className="object-contain object-left" sizes="160px" />
                </div>
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold text-sm flex-shrink-0"
                    style={{ background: color }}
                  >
                    {initial}
                  </div>
                  <span className="text-xs font-semibold text-text-primary truncate">{businessName}</span>
                </>
              )}
            </div>

            {/* Fake nav items */}
            <div className="space-y-1">
              {['Dashboard', 'Alunos', 'Treinos'].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs"
                  style={i === 0 ? { background: `${color}18`, color, border: `1px solid ${color}33` } : { color: '#666' }}
                >
                  <div className="w-3 h-3 rounded-sm" style={i === 0 ? { background: color } : { background: '#444' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-text-secondary space-y-1">
            <p>Esta é a aparência da sua barra lateral com as configurações atuais.</p>
            <p>As alterações são aplicadas imediatamente após salvar.</p>
          </div>
        </div>
      </div>

      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-body font-semibold text-text-primary flex items-center gap-2">
            <ImageIcon size={16} className="text-brand-lime" />
            Logo
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">PNG, JPG, SVG ou WebP. Máximo 2 MB. Recomendado: fundo transparente.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Atual / preview */}
          <div className="w-24 h-16 rounded-xl border border-surface-border bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
            {previewLogo ? (
              <div className="relative w-full h-full p-1">
                <Image src={previewLogo} alt="Preview" fill className="object-contain" sizes="96px" />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-display font-black text-xl"
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
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-surface-border rounded-lg text-text-secondary hover:text-text-primary hover:border-brand-lime/40 transition-colors"
            >
              <Upload size={13} /> Enviar logo
            </button>

            {(logoUrl || logoPreview) && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-status-error/20 rounded-lg text-status-error hover:bg-status-error/5 transition-colors"
              >
                <Trash2 size={13} /> Remover logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Cor primária ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-body font-semibold text-text-primary flex items-center gap-2">
            <Palette size={16} className="text-brand-lime" />
            Cor primária
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">Usada em botões, links ativos e destaques do painel.</p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              title={c}
              className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
              style={{
                background: c,
                borderColor: color === c ? '#fff' : 'transparent',
                boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
              }}
            />
          ))}
        </div>

        {/* Custom picker */}
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 bg-background border border-surface-border rounded-lg p-1 cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColor(v)
            }}
            maxLength={7}
            className="w-28 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-brand-lime/60"
          />
          <span className="text-xs text-text-secondary">Hex #RRGGBB</span>
        </div>
      </div>

      {/* ── Erro / Botão ─────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-lime text-black font-semibold text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : null}
          {saved ? 'Salvo!' : 'Salvar alterações'}
        </button>

        {saved && (
          <p className="text-sm text-status-success">
            Identidade visual atualizada com sucesso.
          </p>
        )}
      </div>
    </form>
  )
}
