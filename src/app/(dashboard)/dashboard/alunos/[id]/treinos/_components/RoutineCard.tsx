'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Link2 } from 'lucide-react'
import { WorkoutItemCard, type WorkoutItemData } from './WorkoutItemCard'
import { ExerciseSearchDrawer } from './ExerciseSearchDrawer'
import { CombineModal } from './CombineModal'
import { addWorkoutItem } from '@/actions/workout-items'
import { deleteRoutine, updateRoutine } from '@/actions/workout-routines'
import { joinOne } from '@/lib/supabase/join'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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

type Routine = {
  id: string
  name: string
  day_of_week: number | null
  display_order: number
  notes: string | null
  workout_items: WorkoutItemData[]
}

type Props = {
  routine: Routine
  studentId?: string
  planId: string
  onDelete: (id: string) => void
}

export function RoutineCard({ routine, studentId, planId, onDelete }: Props) {
  const [items, setItems]             = useState<WorkoutItemData[]>(routine.workout_items)
  const [name, setName]               = useState(routine.name)
  const [collapsed, setCollapsed]     = useState(false)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [combineOpen, setCombineOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [adding, setAdding]           = useState(false)
  const [isPending, startTransition]  = useTransition()

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id))
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  async function handleAddExercise(ex: Exercise) {
    setAdding(true)
    const result = await addWorkoutItem(routine.id, ex.id, items.length)
    setAdding(false)
    if (result.item) {
      const raw = result.item as Record<string, unknown>
      const normalized: WorkoutItemData = {
        ...(raw as Omit<WorkoutItemData, 'exercises'>),
        exercises: joinOne(raw.exercises),
      }
      setItems((prev) => [...prev, normalized])
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteRoutine(routine.id, planId, studentId)
      onDelete(routine.id)
    })
  }

  function handleNameBlur() {
    if (name.trim() && name !== routine.name) {
      startTransition(async () => {
        await updateRoutine(routine.id, { name: name.trim() })
      })
    }
  }

  const comboLabel: Record<string, string> = { biset: 'BI-SET', triset: 'TRI-SET', circuit: 'CIRCUITO' }

  // Group items by combo for visual rendering
  type Block = { type: 'single'; item: WorkoutItemData } | { type: 'combo'; comboGroupId: string; comboType: string; items: WorkoutItemData[] }
  const blocks: Block[] = []
  const seen = new Set<string>()
  for (const item of items) {
    if (!item.combo_group_id) {
      blocks.push({ type: 'single', item })
    } else if (!seen.has(item.combo_group_id)) {
      seen.add(item.combo_group_id)
      const grouped = items.filter((x) => x.combo_group_id === item.combo_group_id)
      blocks.push({ type: 'combo', comboGroupId: item.combo_group_id, comboType: item.combo_type ?? 'biset', items: grouped })
    }
  }

  return (
    <>
      <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
        {/* Header da rotina */}
        <div className="flex items-center gap-3 p-4 border-b border-surface-border">
          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              className="bg-transparent font-display font-bold text-text-primary uppercase tracking-widest text-sm outline-none border-b border-transparent focus:border-brand-lime/50 transition-colors w-full"
            />
            {routine.day_of_week != null && (
              <p className="text-xs text-text-secondary mt-0.5">
                {DAY_LABELS[routine.day_of_week]}
              </p>
            )}
          </div>
          <span className="text-xs text-text-secondary bg-background border border-surface-border px-2 py-0.5 rounded-full">
            {items.length} exercício{items.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {!collapsed && (
          <div className="p-3 space-y-2">
            {/* Toolbar de combinação */}
            {selectedIds.length >= 2 && (
              <div className="flex items-center gap-2 p-2 bg-brand-lime/10 border border-brand-lime/30 rounded-xl">
                <p className="flex-1 text-xs text-brand-lime font-medium">
                  {selectedIds.length} exercícios selecionados
                </p>
                <button
                  onClick={() => setCombineOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-background bg-brand-lime px-3 py-1.5 rounded-lg hover:bg-brand-lime/90 transition-colors"
                >
                  <Link2 size={11} />
                  Combinar
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-brand-lime/70 hover:text-brand-lime"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Blocos de exercícios */}
            {blocks.length === 0 && (
              <p className="text-xs text-text-secondary text-center py-4">
                Nenhum exercício ainda. Clique em &quot;+ Exercício&quot; para adicionar.
              </p>
            )}

            {blocks.map((block) => {
              if (block.type === 'single') {
                return (
                  <WorkoutItemCard
                    key={block.item.id}
                    item={block.item}
                    selected={selectedIds.includes(block.item.id)}
                    onToggleSelect={toggleSelect}
                    onRemove={handleRemoveItem}
                  />
                )
              }
              return (
                <div key={block.comboGroupId} className="space-y-1">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-4 bg-brand-lime rounded-full" />
                    <span className="text-[10px] font-bold text-brand-lime tracking-widest">
                      {comboLabel[block.comboType] ?? block.comboType.toUpperCase()}
                    </span>
                  </div>
                  {block.items.map((item) => (
                    <WorkoutItemCard
                      key={item.id}
                      item={item}
                      selected={selectedIds.includes(item.id)}
                      onToggleSelect={toggleSelect}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              )
            })}

            {/* Botão adicionar */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-surface-border text-text-secondary hover:border-brand-lime/40 hover:text-brand-lime hover:bg-brand-lime/5 transition-all text-sm font-medium"
            >
              <Plus size={14} />
              Exercício
            </button>
          </div>
        )}
      </div>

      <ExerciseSearchDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={(ex) => { handleAddExercise(ex); setDrawerOpen(false) }}
        adding={adding}
      />

      <CombineModal
        open={combineOpen}
        selectedIds={selectedIds}
        onClose={() => setCombineOpen(false)}
        onSuccess={() => setSelectedIds([])}
      />
    </>
  )
}
