'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Search, X, Plus, Loader2, Dumbbell } from 'lucide-react'
import { searchExercises } from '@/actions/workout-items'
import { muscleColor } from '@/lib/exercise-config'

type Exercise = {
  id: string
  name: string
  muscle_group: string
  load_type: string
  is_global: boolean
  video_url: string | null
  instructions: string | null
  count_type: string
  default_sets: number | null
  default_reps: string | null
  default_duration_secs: number | null
  tenant_id: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
  adding?: boolean
}

export function ExerciseSearchDrawer({ open, onClose, onSelect, adding }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      startTransition(async () => {
        const data = await searchExercises('')
        setResults(data)
      })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchExercises(value)
        setResults(data)
      })
    }, 300)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md h-full bg-surface border-l border-surface-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-surface-border">
          <div className="flex-1 flex items-center gap-2 bg-background border border-surface-border rounded-lg px-3 py-2">
            {isPending
              ? <Loader2 size={14} className="text-text-secondary animate-spin flex-shrink-0" />
              : <Search size={14} className="text-text-secondary flex-shrink-0" />
            }
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar exercício..."
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 outline-none font-body"
            />
            {query && (
              <button onClick={() => handleChange('')} className="text-text-secondary hover:text-text-primary">
                <X size={12} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {results.length === 0 && !isPending && (
            <div className="text-center py-12 text-text-secondary">
              <Dumbbell size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum exercício encontrado</p>
            </div>
          )}
          {results.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              disabled={adding}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-background border border-surface-border hover:border-brand-lime/40 hover:bg-brand-lime/5 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                <Dumbbell size={14} className="text-brand-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate group-hover:text-brand-lime transition-colors">
                  {ex.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${muscleColor(ex.muscle_group)}`}>
                    {ex.muscle_group}
                  </span>
                  {!ex.is_global && (
                    <span className="text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/20 px-1.5 py-0.5 rounded-md">
                      Meu exercício
                    </span>
                  )}
                </div>
              </div>
              <Plus size={14} className="text-text-secondary group-hover:text-brand-lime transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="p-3 border-t border-surface-border">
          <p className="text-[11px] text-text-secondary text-center">
            Exibindo globais + seus exercícios customizados
          </p>
        </div>
      </div>
    </div>
  )
}
