'use client'

import { useState, useTransition, useRef, useEffect, useMemo } from 'react'
import { Search, X, Plus, Loader2, Dumbbell, Check, ListFilter } from 'lucide-react'
import { searchExercises } from '@/actions/workout-items'
import { MUSCLE_GROUPS, muscleColor } from '@/lib/exercise-config'

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

// Bolinha de cor por grupo muscular, na mesma paleta de MUSCLE_GROUP_COLOR — permite
// escanear os chips de filtro por cor sem ler o texto.
const GROUP_DOT: Record<string, string> = {
  'Peito':              'bg-red-400',
  'Costas':             'bg-blue-400',
  'Ombros':             'bg-orange-400',
  'Bíceps':             'bg-purple-400',
  'Tríceps':            'bg-pink-400',
  'Antebraços':         'bg-yellow-400',
  'Core / Abdômen':     'bg-brand-lime',
  'Glúteos':            'bg-rose-400',
  'Quadríceps':         'bg-cyan-400',
  'Posterior de Coxa':  'bg-teal-400',
  'Panturrilha':        'bg-indigo-400',
  'Corpo Inteiro':      'bg-amber-400',
  'Cardio / Funcional': 'bg-emerald-400',
}

type Props = {
  open: boolean
  onClose: () => void
  adding?: boolean
  /** Modo de seleção única (padrão) — fecha e adiciona ao tocar num exercício. */
  onSelect?: (exercise: Exercise) => void
  /** Modo multi-seleção — toque marca/desmarca; confirmação insere todos de uma vez. */
  multiSelect?: boolean
  onConfirm?: (exercises: Exercise[]) => void
}

export function ExerciseSearchDrawer({ open, onClose, onSelect, adding, multiSelect, onConfirm }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null)
  const [selected, setSelected] = useState<Exercise[]>([])
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setMuscleGroup(null)
      setSelected([])
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

  const filteredResults = useMemo(() => {
    if (!muscleGroup) return results
    return results.filter((ex) => ex.muscle_group === muscleGroup)
  }, [results, muscleGroup])

  function isSelected(id: string) {
    return selected.some((ex) => ex.id === id)
  }

  function handlePick(ex: Exercise) {
    if (!multiSelect) {
      onSelect?.(ex)
      return
    }
    setSelected((prev) =>
      isSelected(ex.id) ? prev.filter((x) => x.id !== ex.id) : [...prev, ex]
    )
  }

  function handleConfirm() {
    if (selected.length === 0) return
    onConfirm?.(selected)
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

        {/* Filtro de grupo muscular — container próprio, separado da lista */}
        <div className="px-4 py-3 border-b border-surface-border bg-background/40 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-1.5 mb-2">
            <ListFilter size={11} className="text-text-secondary" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              Grupo muscular
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setMuscleGroup(null)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                muscleGroup === null
                  ? 'border-brand-lime/50 bg-brand-lime/10 text-brand-lime'
                  : 'border-surface-border text-text-secondary hover:text-text-primary'
              }`}
            >
              Todos
            </button>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                onClick={() => setMuscleGroup(muscleGroup === group ? null : group)}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  muscleGroup === group
                    ? 'border-brand-lime/50 bg-brand-lime/10 text-brand-lime'
                    : 'border-surface-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${GROUP_DOT[group] ?? 'bg-text-secondary'}`} />
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredResults.length === 0 && !isPending && (
            <div className="text-center py-12 text-text-secondary">
              <Dumbbell size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum exercício encontrado</p>
            </div>
          )}
          {filteredResults.map((ex) => {
            const picked = multiSelect && isSelected(ex.id)
            return (
              <button
                key={ex.id}
                onClick={() => handlePick(ex)}
                disabled={adding}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
                  picked
                    ? 'border-brand-lime bg-brand-lime/10'
                    : 'bg-background border-surface-border hover:border-brand-lime/40 hover:bg-brand-lime/5'
                }`}
              >
                {multiSelect && (
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    picked ? 'bg-brand-lime border-brand-lime' : 'border-surface-border'
                  }`}>
                    {picked && <Check size={11} className="text-background" />}
                  </div>
                )}
                {ex.video_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ex.video_url} alt="" loading="lazy"
                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={14} className="text-brand-lime" />
                  </div>
                )}
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
                {!multiSelect && (
                  <Plus size={14} className="text-text-secondary group-hover:text-brand-lime transition-colors flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        {multiSelect ? (
          <div className="p-3 border-t border-surface-border">
            <button
              onClick={handleConfirm}
              disabled={selected.length === 0 || adding}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adding
                ? <Loader2 size={14} className="animate-spin" />
                : <Plus size={14} />
              }
              {selected.length > 0
                ? `Adicionar ${selected.length} exercício${selected.length !== 1 ? 's' : ''}`
                : 'Selecione exercícios'}
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-surface-border">
            <p className="text-[11px] text-text-secondary text-center">
              Exibindo globais + seus exercícios customizados
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
