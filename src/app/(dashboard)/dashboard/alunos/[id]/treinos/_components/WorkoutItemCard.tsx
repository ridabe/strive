'use client'

import { useState, useTransition } from 'react'
import { Trash2, GripVertical, Unlink, ChevronDown, ChevronUp } from 'lucide-react'
import { updateWorkoutItem, removeWorkoutItem, ungroupWorkoutItems } from '@/actions/workout-items'
import { muscleColor } from '@/lib/exercise-config'

export type WorkoutItemData = {
  id: string
  display_order: number
  combo_group_id: string | null
  combo_type: string | null
  sets: number | null
  reps: string | null
  duration_secs: number | null
  rest_seconds: number | null
  load: string | null
  count_type: string
  notes: string | null
  exercises: {
    id: string
    name: string
    muscle_group: string
    load_type: string
    is_global: boolean
    video_url: string | null
    instructions: string | null
    count_type: string
  } | null
}

type ItemActions = {
  update: (id: string, fields: Record<string, unknown>) => Promise<{ error?: string }>
  remove: (id: string) => Promise<{ error?: string }>
  ungroup: (comboGroupId: string) => Promise<{ error?: string }>
}

type Props = {
  item: WorkoutItemData
  selected: boolean
  onToggleSelect: (id: string) => void
  onRemove: (id: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  actions?: ItemActions
}

export function WorkoutItemCard({ item, selected, onToggleSelect, onRemove, dragHandleProps, actions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [fields, setFields] = useState({
    sets:         item.sets?.toString() ?? '3',
    reps:         item.reps ?? '10-12',
    load:         item.load ?? '',
    rest_seconds: item.rest_seconds?.toString() ?? '60',
    notes:        item.notes ?? '',
  })

  function saveField(key: string, value: string) {
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        [key]: key === 'sets' || key === 'rest_seconds'
          ? (parseInt(value) || null)
          : value || null,
      }
      if (actions) {
        await actions.update(item.id, payload)
      } else {
        await updateWorkoutItem(item.id, payload as Parameters<typeof updateWorkoutItem>[1])
      }
    })
  }

  function handleUngroup() {
    if (!item.combo_group_id) return
    startTransition(async () => {
      if (actions) {
        await actions.ungroup(item.combo_group_id!)
      } else {
        await ungroupWorkoutItems(item.combo_group_id!)
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      if (actions) {
        await actions.remove(item.id)
      } else {
        await removeWorkoutItem(item.id)
      }
      onRemove(item.id)
    })
  }

  const ex = item.exercises

  return (
    <div className={`rounded-xl border transition-all ${
      selected
        ? 'border-brand-lime bg-brand-lime/5'
        : item.combo_group_id
          ? 'border-l-[3px] border-l-brand-lime border-surface-border bg-background'
          : 'border-surface-border bg-background'
    }`}>
      {/* Row principal */}
      <div className="flex items-center gap-2 p-3">
        {/* Checkbox de seleção */}
        <button
          onClick={() => onToggleSelect(item.id)}
          className={`w-4 h-4 rounded border flex-shrink-0 transition-colors ${
            selected
              ? 'bg-brand-lime border-brand-lime'
              : 'border-surface-border hover:border-brand-lime/50'
          }`}
        />

        {/* Drag handle */}
        <div {...dragHandleProps} className="cursor-grab text-text-secondary/40 hover:text-text-secondary flex-shrink-0">
          <GripVertical size={14} />
        </div>

        {/* Exercício */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {ex?.name ?? 'Exercício removido'}
          </p>
          {ex && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${muscleColor(ex.muscle_group)}`}>
              {ex.muscle_group}
            </span>
          )}
        </div>

        {/* Resumo inline */}
        <span className="text-xs text-text-secondary hidden sm:block flex-shrink-0">
          {fields.sets}×{fields.reps}
          {fields.load ? ` · ${fields.load}` : ''}
        </span>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {item.combo_group_id && (
            <button
              onClick={handleUngroup}
              title="Desfazer combinação"
              className="p-1.5 rounded-lg text-brand-lime/60 hover:text-brand-lime hover:bg-brand-lime/10 transition-colors"
            >
              <Unlink size={12} />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Campos expandidos */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-surface-border pt-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <FieldInput
              label="Séries"
              value={fields.sets}
              onChange={(v) => setFields((f) => ({ ...f, sets: v }))}
              onBlur={() => saveField('sets', fields.sets)}
              type="number"
              min={1}
            />
            <FieldInput
              label="Reps / Tempo"
              value={fields.reps}
              onChange={(v) => setFields((f) => ({ ...f, reps: v }))}
              onBlur={() => saveField('reps', fields.reps)}
              placeholder="10-12"
            />
            <FieldInput
              label="Carga"
              value={fields.load}
              onChange={(v) => setFields((f) => ({ ...f, load: v }))}
              onBlur={() => saveField('load', fields.load)}
              placeholder="kg ou descrição"
            />
            <FieldInput
              label="Descanso (s)"
              value={fields.rest_seconds}
              onChange={(v) => setFields((f) => ({ ...f, rest_seconds: v }))}
              onBlur={() => saveField('rest_seconds', fields.rest_seconds)}
              type="number"
              min={0}
            />
          </div>
          <FieldInput
            label="Observações"
            value={fields.notes}
            onChange={(v) => setFields((f) => ({ ...f, notes: v }))}
            onBlur={() => saveField('notes', fields.notes)}
            placeholder="Dicas de execução..."
          />
        </div>
      )}
    </div>
  )
}

function FieldInput({
  label, value, onChange, onBlur, type = 'text', placeholder = '', min,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  type?: string
  placeholder?: string
  min?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="bg-surface border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body w-full"
      />
    </div>
  )
}
