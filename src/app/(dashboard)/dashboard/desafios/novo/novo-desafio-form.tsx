'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Info, Calendar, ListChecks } from 'lucide-react'
import { createChallenge, type ReleaseMode } from '@/app/actions/challenges'

export function NovoDesafioForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [releaseMode, setReleaseMode] = useState<ReleaseMode>('progressive')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const fd = new FormData(e.currentTarget)
    const durationDays = Number(fd.get('duration_days'))

    if (!durationDays || durationDays < 1) {
      setError('Informe uma duração válida em dias.')
      return
    }

    startTransition(async () => {
      const result = await createChallenge({
        name: String(fd.get('name') ?? ''),
        description: String(fd.get('description') ?? '') || null,
        rules: String(fd.get('rules') ?? '') || null,
        prizes: String(fd.get('prizes') ?? '') || null,
        duration_days: durationDays,
        release_mode: releaseMode,
      })

      if (result.error) { setError(result.error); return }
      router.push(`/dashboard/desafios/${result.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          Identificação
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Nome do desafio <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="Ex: Desafio 21 Dias — Queima de Gordura"
            className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Descrição <span className="text-text-secondary/50">(opcional)</span>
          </label>
          <textarea
            name="description"
            rows={2}
            placeholder="Do que se trata o desafio, qual a meta..."
            className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={11} />
            Duração (dias) <span className="text-red-400">*</span>
          </label>
          <input
            name="duration_days"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={21}
            className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
          />
        </div>
      </div>

      <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          Regras e premiações
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Regras <span className="text-text-secondary/50">(opcional)</span>
          </label>
          <textarea
            name="rules"
            rows={3}
            placeholder="Como o desafio vai funcionar, o que é esperado dos participantes..."
            className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Premiações <span className="text-text-secondary/50">(opcional)</span>
          </label>
          <textarea
            name="prizes"
            rows={2}
            placeholder="O que o vencedor ganha..."
            className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
          />
        </div>
      </div>

      <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <ListChecks size={12} />
          Liberação dos dias
        </p>

        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="release_mode_radio"
              checked={releaseMode === 'progressive'}
              onChange={() => setReleaseMode('progressive')}
              className="mt-1 accent-brand-lime"
            />
            <div>
              <p className="text-sm font-medium text-text-primary group-hover:text-brand-lime transition-colors">
                Progressiva
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Você libera um dia de cada vez, no seu ritmo, ao longo do desafio.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="release_mode_radio"
              checked={releaseMode === 'all_at_once'}
              onChange={() => setReleaseMode('all_at_once')}
              className="mt-1 accent-brand-lime"
            />
            <div>
              <p className="text-sm font-medium text-text-primary group-hover:text-brand-lime transition-colors">
                Tudo de uma vez
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Você monta todos os dias e libera manualmente quando quiser.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-start gap-2 bg-background border border-surface-border rounded-xl p-3">
          <Info size={13} className="text-text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            O desafio começa como rascunho. Você adiciona os participantes e monta os dias antes de iniciar.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <div className="sticky bottom-20 md:bottom-6 z-10 rounded-2xl bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 p-2 -mx-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Criar Desafio →
        </button>
      </div>
    </form>
  )
}
