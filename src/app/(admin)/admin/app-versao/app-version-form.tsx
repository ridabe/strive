'use client'

import { useRef, useState, useTransition } from 'react'
import { Save, AlertTriangle, Check } from 'lucide-react'
import { updateAppVersion } from './actions'

interface AppVersion {
  platform: 'android' | 'ios'
  current_version: string
  current_version_code: number
  min_version_code: number
  force_update: boolean
  store_url: string | null
  release_notes: string | null
  updated_at: string
}

interface Props {
  data: AppVersion
  platformLabel: string
  platformIcon: React.ReactNode
}

export function AppVersionForm({ data, platformLabel, platformIcon }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [forceUpdate, setForceUpdate] = useState(data.force_update)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    const fd = new FormData(formRef.current!)
    fd.set('force_update', forceUpdate ? 'true' : 'false')
    startTransition(async () => {
      const res = await updateAppVersion(data.platform, fd)
      setResult(res)
    })
  }

  const updatedAt = new Date(data.updated_at).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 py-4 border-b border-surface-border sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          {platformIcon}
          <div className="min-w-0">
            <h2 className="font-body font-semibold text-text-primary text-sm truncate">{platformLabel}</h2>
            <p className="text-[11px] text-text-secondary mt-0.5">Atualizado em {updatedAt}</p>
          </div>
        </div>

        {/* Força atualização toggle */}
        <button
          type="button"
          onClick={() => setForceUpdate(v => !v)}
          className={`inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all sm:w-auto ${
            forceUpdate
              ? 'bg-status-error/10 border-status-error/30 text-status-error'
              : 'bg-surface-border/30 border-surface-border text-text-secondary hover:text-text-primary'
          }`}
        >
          <AlertTriangle size={13} />
          {forceUpdate ? 'Atualização obrigatória' : 'Atualização opcional'}
        </button>
      </div>

      <div className="p-4 space-y-5 sm:p-6">
        {/* Versão + códigos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Versão Nova *
            </label>
            <input
              name="current_version"
              defaultValue={data.current_version}
              placeholder="ex: 1.0.2"
              required
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Version Code Novo *
            </label>
            <input
              name="current_version_code"
              type="number"
              min={1}
              defaultValue={data.current_version_code}
              required
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Version Code Mínimo *
            </label>
            <input
              name="min_version_code"
              type="number"
              min={1}
              defaultValue={data.min_version_code}
              required
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
            />
            <p className="text-[11px] text-text-secondary">
              Abaixo deste valor o app exibe alerta ou bloqueio, conforme a regra.
            </p>
          </div>
        </div>

        {/* Store URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            URL da loja
          </label>
          <input
            name="store_url"
            type="url"
            defaultValue={data.store_url ?? ''}
            placeholder="https://play.google.com/store/apps/details?id=..."
            className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
          />
        </div>

        {/* Novidades */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Novidades da versão
          </label>
          <textarea
            name="release_notes"
            defaultValue={data.release_notes ?? ''}
            rows={3}
            placeholder="Descreva o que há de novo nesta versão..."
            className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50 resize-none"
          />
        </div>

        {/* Como funciona */}
        <div className="bg-background rounded-xl border border-surface-border p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Como funciona</p>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-brand-lime mt-0.5">→</span>
              O app verifica esta tabela ao iniciar e compara o <strong className="text-text-primary">version code instalado</strong> com o <strong className="text-text-primary">mínimo</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-lime mt-0.5">→</span>
              Se instalado &lt; mínimo: exibe alerta de atualização. Se <strong className="text-text-primary">obrigatório</strong>, bloqueia o app até atualizar.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-lime mt-0.5">→</span>
              Se instalado ≥ mínimo mas &lt; atual: exibe banner informativo (sem bloqueio).
            </li>
          </ul>
        </div>

        {/* Feedback */}
        {result?.error && (
          <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-2.5 text-sm text-status-error">
            <AlertTriangle size={14} />
            {result.error}
          </div>
        )}
        {result?.success && (
          <div className="flex items-center gap-2 bg-status-success/10 border border-status-success/20 rounded-lg px-4 py-2.5 text-sm text-status-success">
            <Check size={14} />
            Versão atualizada com sucesso.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 bg-brand-lime text-background px-5 py-3 rounded-xl text-sm font-semibold hover:bg-brand-lime/90 disabled:opacity-50 transition-all sm:w-auto"
        >
          <Save size={15} />
          {pending ? 'Salvando...' : 'Salvar versão'}
        </button>
      </div>
    </form>
  )
}
