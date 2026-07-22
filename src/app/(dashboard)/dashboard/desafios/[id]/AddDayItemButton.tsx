'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Search } from 'lucide-react'
import { createChallengeDayItems, type ChallengeItemType } from '@/app/actions/challenges'
import { searchExercises } from '@/actions/workout-items'

interface Props {
  dayId: string
  challengeId: string
}

const TYPE_OPTIONS: { value: ChallengeItemType; label: string }[] = [
  { value: 'exercise', label: 'Exercício' },
  { value: 'reading', label: 'Leitura / Dica' },
  { value: 'file', label: 'Arquivo' },
  { value: 'tip', label: 'Recado do dia' },
]

export function AddDayItemButton({ dayId, challengeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [itemType, setItemType] = useState<ChallengeItemType>('exercise')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const [exerciseQuery, setExerciseQuery] = useState('')
  const [exerciseResults, setExerciseResults] = useState<{ id: string; name: string }[]>([])
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string }[]>([])
  const [searching, setSearching] = useState(false)

  function handleClose() {
    setOpen(false)
    setError('')
    setExerciseQuery('')
    setExerciseResults([])
    setSelectedExercises([])
    setItemType('exercise')
    formRef.current?.reset()
  }

  function handleExerciseSearch(value: string) {
    setExerciseQuery(value)
    if (value.trim().length < 2) { setExerciseResults([]); return }
    setSearching(true)
    startTransition(async () => {
      const results = await searchExercises(value)
      setExerciseResults(results.map((r) => ({ id: r.id, name: r.name })))
      setSearching(false)
    })
  }

  function addExercise(ex: { id: string; name: string }) {
    setSelectedExercises((prev) => (prev.some((e) => e.id === ex.id) ? prev : [...prev, ex]))
    setExerciseQuery('')
    setExerciseResults([])
  }

  function removeExercise(id: string) {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (itemType === 'exercise' && selectedExercises.length === 0) {
      setError('Busque e selecione ao menos um exercício.')
      return
    }

    const fd = new FormData(e.currentTarget)
    const content = String(fd.get('content') ?? '') || null

    const inputs = itemType === 'exercise'
      ? selectedExercises.map((ex) => ({
          item_type: itemType,
          title: ex.name,
          content,
          exercise_id: ex.id,
          file_url: null,
        }))
      : [{
          item_type: itemType,
          title: String(fd.get('title') ?? ''),
          content,
          exercise_id: null,
          file_url: itemType === 'file' ? String(fd.get('file_url') ?? '') || null : null,
        }]

    startTransition(async () => {
      const result = await createChallengeDayItems(dayId, challengeId, inputs)
      if (result.error) { setError(result.error); return }
      handleClose()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-surface-border text-xs text-text-secondary hover:text-brand-lime hover:border-brand-lime/30 transition-colors"
      >
        <Plus size={13} />
        Adicionar Item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Adicionar Item
              </h2>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setItemType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    itemType === opt.value
                      ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                      : 'bg-background border border-surface-border text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {itemType === 'exercise' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                    Buscar exercícios
                  </label>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      value={exerciseQuery}
                      onChange={(e) => handleExerciseSearch(e.target.value)}
                      placeholder="Ex: Agachamento"
                      className="w-full bg-background border border-surface-border rounded-lg pl-8 pr-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                    />
                  </div>

                  {selectedExercises.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedExercises.map((ex) => (
                        <span
                          key={ex.id}
                          className="flex items-center gap-1.5 bg-brand-lime/10 border border-brand-lime/20 rounded-lg px-2.5 py-1.5"
                        >
                          <span className="text-sm text-brand-lime">{ex.name}</span>
                          <button type="button" onClick={() => removeExercise(ex.id)} className="text-brand-lime/70 hover:text-brand-lime">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {exerciseResults.length > 0 ? (
                    <div className="border border-surface-border rounded-lg overflow-hidden mt-1 max-h-40 overflow-y-auto">
                      {exerciseResults
                        .filter((ex) => !selectedExercises.some((s) => s.id === ex.id))
                        .map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => addExercise(ex)}
                            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-border/30 transition-colors border-b border-surface-border last:border-0"
                          >
                            {ex.name}
                          </button>
                        ))}
                    </div>
                  ) : searching ? (
                    <p className="text-xs text-text-secondary">Buscando...</p>
                  ) : null}
                  <p className="text-[11px] text-text-secondary/60">
                    Selecione um ou mais exercícios — depois é possível combiná-los em Bi-Série/Tri-Série/Circuito.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                    Título
                  </label>
                  <input
                    name="title"
                    required
                    placeholder={itemType === 'file' ? 'Ex: Planilha de acompanhamento' : 'Ex: Dica de hidratação'}
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                  />
                </div>
              )}

              {itemType === 'file' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                    Link do arquivo
                  </label>
                  <input
                    name="file_url"
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                  />
                  <p className="text-[11px] text-text-secondary/60">
                    Envie o arquivo em Arquivos e cole o link público aqui.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                  {itemType === 'exercise' ? 'Instruções' : 'Conteúdo'} <span className="text-text-secondary/50">(opcional)</span>
                </label>
                <textarea
                  name="content"
                  rows={3}
                  placeholder={itemType === 'exercise' ? 'Séries, repetições, observações...' : 'Detalhes que o participante vai ver...'}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-lime transition-colors resize-none"
                />
              </div>

              {error && <p className="text-sm text-status-error">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
