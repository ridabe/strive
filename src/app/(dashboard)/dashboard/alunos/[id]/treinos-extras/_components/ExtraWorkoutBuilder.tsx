'use client'

import { useState } from 'react'
import { Plus, Link2 } from 'lucide-react'
import { WorkoutItemCard, type WorkoutItemData } from '../../treinos/_components/WorkoutItemCard'
import { ExerciseSearchDrawer } from '../../treinos/_components/ExerciseSearchDrawer'
import { CombineModal } from '../../treinos/_components/CombineModal'
import { addExtraWorkoutItem, groupExtraWorkoutItems, updateExtraWorkoutItem, removeExtraWorkoutItem, ungroupExtraWorkoutItems } from '@/actions/extra-workout-items'
import type { ExtraWorkoutItemData } from '@/actions/extra-workouts'
import { joinOne } from '@/lib/supabase/join'

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
  extraWorkoutId: string
  initialItems: ExtraWorkoutItemData[]
}

function toWorkoutItemData(item: ExtraWorkoutItemData): WorkoutItemData {
  return {
    id: item.id,
    display_order: item.display_order,
    combo_group_id: item.combo_group_id,
    combo_type: item.combo_type,
    sets: item.sets,
    reps: item.reps,
    duration_secs: item.duration_secs,
    rest_seconds: item.rest_seconds,
    load: item.load,
    count_type: item.count_type,
    notes: item.notes,
    exercises: item.exercises,
  }
}

const COMBO_LABEL: Record<string, string> = { biset: 'BI-SET', triset: 'TRI-SET', circuit: 'CIRCUITO' }

export function ExtraWorkoutBuilder({ extraWorkoutId, initialItems }: Props) {
  const [items, setItems]             = useState<WorkoutItemData[]>(initialItems.map(toWorkoutItemData))
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [combineOpen, setCombineOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [adding, setAdding]           = useState(false)

  const itemActions = {
    update: async (id: string, fields: Record<string, unknown>) => {
      return updateExtraWorkoutItem(id, fields as Parameters<typeof updateExtraWorkoutItem>[1])
    },
    remove: removeExtraWorkoutItem,
    ungroup: ungroupExtraWorkoutItems,
  }

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
    const result = await addExtraWorkoutItem(extraWorkoutId, ex.id, items.length)
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

  type Block =
    | { type: 'single'; item: WorkoutItemData }
    | { type: 'combo'; comboGroupId: string; comboType: string; items: WorkoutItemData[] }

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
      <div className="space-y-2">
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

        {blocks.length === 0 && (
          <p className="text-xs text-text-secondary text-center py-6">
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
                actions={itemActions}
              />
            )
          }
          return (
            <div key={block.comboGroupId} className="space-y-1">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-4 bg-brand-lime rounded-full" />
                <span className="text-[10px] font-bold text-brand-lime tracking-widest">
                  {COMBO_LABEL[block.comboType] ?? block.comboType.toUpperCase()}
                </span>
              </div>
              {block.items.map((item) => (
                <WorkoutItemCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(item.id)}
                  onToggleSelect={toggleSelect}
                  onRemove={handleRemoveItem}
                  actions={itemActions}
                />
              ))}
            </div>
          )
        })}

        <button
          onClick={() => setDrawerOpen(true)}
          disabled={adding}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-surface-border text-text-secondary hover:border-brand-lime/40 hover:text-brand-lime hover:bg-brand-lime/5 transition-all text-sm font-medium disabled:opacity-50"
        >
          <Plus size={14} />
          {adding ? 'Adicionando...' : 'Exercício'}
        </button>
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
        onGroup={groupExtraWorkoutItems}
      />
    </>
  )
}
