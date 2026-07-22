'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2, Loader2, Dumbbell, BookOpen, Paperclip, Lightbulb,
  Link2, Unlink, Repeat, ArrowUp, ArrowDown,
} from 'lucide-react'
import type { ChallengeDayItem, ChallengeItemType } from '@/app/actions/challenges'
import {
  deleteChallengeDayItem, groupChallengeDayItems, ungroupChallengeDayItems, reorderChallengeDayItems,
} from '@/app/actions/challenges'
import { AddDayItemButton } from './AddDayItemButton'
import { CombineModal } from '../../alunos/[id]/treinos/_components/CombineModal'

type ComboType = 'biset' | 'triset' | 'circuit'
type Item = ChallengeDayItem & { exercise_name: string | null }
type Block = { type: 'single'; item: Item } | { type: 'combo'; comboGroupId: string; comboType: string; items: Item[] }

const ITEM_ICON: Record<ChallengeItemType, typeof Dumbbell> = {
  exercise: Dumbbell, reading: BookOpen, file: Paperclip, tip: Lightbulb,
}
const ITEM_LABEL: Record<ChallengeItemType, string> = {
  exercise: 'Exercício', reading: 'Leitura', file: 'Arquivo', tip: 'Recado',
}
const COMBO_LABEL: Record<string, string> = { biset: 'BI-SET', triset: 'TRI-SET', circuit: 'CIRCUITO' }

interface Props {
  dayId: string
  challengeId: string
  items: Item[]
  canManage: boolean
}

export function ChallengeDayItems({ dayId, challengeId, items: itemsProp, canManage }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>(itemsProp)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [combineOpen, setCombineOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setItems(itemsProp) }, [itemsProp])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleDeleteItem(itemId: string) {
    setBusyId(itemId)
    startTransition(async () => {
      await deleteChallengeDayItem(itemId, challengeId)
      setBusyId(null)
      router.refresh()
    })
  }

  function handleRecombine(comboGroupId: string, memberIds: string[]) {
    setEditingGroupId(comboGroupId)
    setSelectedIds(memberIds)
    setCombineOpen(true)
  }

  async function handleGroupConfirm(ids: string[], type: ComboType) {
    if (editingGroupId) {
      const res = await ungroupChallengeDayItems(editingGroupId, challengeId)
      if (res.error) return res
    }
    return groupChallengeDayItems(ids, type, challengeId)
  }

  function handleCombineSuccess(type: ComboType, comboGroupId?: string) {
    const staleGroupId = editingGroupId
    setItems((prev) => prev.map((it) => {
      if (selectedIds.includes(it.id)) {
        return comboGroupId ? { ...it, combo_group_id: comboGroupId, combo_type: type } : it
      }
      if (staleGroupId && it.combo_group_id === staleGroupId) {
        return { ...it, combo_group_id: null, combo_type: null }
      }
      return it
    }))
    setSelectedIds([])
    setEditingGroupId(null)
    router.refresh()
  }

  function handleUngroup(comboGroupId: string) {
    startTransition(async () => {
      await ungroupChallengeDayItems(comboGroupId, challengeId)
      setItems((prev) => prev.map((it) =>
        it.combo_group_id === comboGroupId ? { ...it, combo_group_id: null, combo_type: null } : it
      ))
    })
  }

  // Agrupa a lista ordenada por sort_order em blocos (solto ou combo) — mesmo
  // padrão visual usado em rotinas de treino.
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

  function persistReorder(newBlocks: Block[]) {
    const flat = newBlocks.flatMap((b) => (b.type === 'single' ? [b.item] : b.items))
    setItems(flat)
    startTransition(async () => {
      await reorderChallengeDayItems(dayId, flat.map((it) => it.id), challengeId)
    })
  }

  function moveBlock(blockIdx: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1
    if (swapIdx < 0 || swapIdx >= blocks.length) return
    const newBlocks = [...blocks]
    ;[newBlocks[blockIdx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[blockIdx]]
    persistReorder(newBlocks)
  }

  function moveMember(comboGroupId: string, itemId: string, direction: 'up' | 'down') {
    const block = blocks.find((b) => b.type === 'combo' && b.comboGroupId === comboGroupId)
    if (!block || block.type !== 'combo') return
    const idx = block.items.findIndex((it) => it.id === itemId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx === -1 || swapIdx < 0 || swapIdx >= block.items.length) return
    const newMembers = [...block.items]
    ;[newMembers[idx], newMembers[swapIdx]] = [newMembers[swapIdx], newMembers[idx]]
    const newBlocks = blocks.map((b) =>
      b.type === 'combo' && b.comboGroupId === comboGroupId ? { ...b, items: newMembers } : b
    )
    persistReorder(newBlocks)
  }

  function renderItemRow(item: Item, opts: {
    comboLetter?: string
    onMoveUp?: () => void; onMoveDown?: () => void
    canMoveUp?: boolean; canMoveDown?: boolean
  } = {}) {
    const Icon = ITEM_ICON[item.item_type]
    const isExercise = item.item_type === 'exercise'
    return (
      <div
        key={item.id}
        className={`flex items-start gap-2.5 rounded-lg p-3 transition-all ${
          selectedIds.includes(item.id)
            ? 'border border-brand-lime bg-brand-lime/5'
            : item.combo_group_id
              ? 'border border-l-[3px] border-l-brand-lime border-surface-border bg-background'
              : 'border border-surface-border bg-background'
        }`}
      >
        {isExercise && canManage && (
          <button
            onClick={() => toggleSelect(item.id)}
            className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 transition-colors ${
              selectedIds.includes(item.id)
                ? 'bg-brand-lime border-brand-lime'
                : 'border-surface-border hover:border-brand-lime/50'
            }`}
          />
        )}

        {(opts.onMoveUp || opts.onMoveDown) && canManage && (
          <div className="flex flex-col flex-shrink-0">
            <button
              onClick={opts.onMoveUp}
              disabled={!opts.canMoveUp}
              className="text-text-secondary/60 hover:text-brand-lime disabled:opacity-20 transition-colors"
            >
              <ArrowUp size={11} />
            </button>
            <button
              onClick={opts.onMoveDown}
              disabled={!opts.canMoveDown}
              className="text-text-secondary/60 hover:text-brand-lime disabled:opacity-20 transition-colors"
            >
              <ArrowDown size={11} />
            </button>
          </div>
        )}

        <Icon size={14} className="text-text-secondary flex-shrink-0 mt-0.5" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {opts.comboLetter && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-lime text-background text-[10px] font-bold flex items-center justify-center">
                {opts.comboLetter}
              </span>
            )}
            <p className="text-xs text-text-secondary uppercase tracking-wide">{ITEM_LABEL[item.item_type]}</p>
          </div>
          <p className="text-sm text-text-primary">{item.exercise_name ?? item.title}</p>
          {item.content && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{item.content}</p>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {item.combo_group_id && canManage && (
            <button
              onClick={() => handleUngroup(item.combo_group_id!)}
              title="Desfazer combinação"
              className="p-1.5 rounded-lg text-brand-lime/60 hover:text-brand-lime hover:bg-brand-lime/10 transition-colors"
            >
              <Unlink size={12} />
            </button>
          )}
          {canManage && (
            <button
              onClick={() => handleDeleteItem(item.id)}
              disabled={isPending}
              className="text-text-secondary hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {busyId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
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
            <button onClick={() => setSelectedIds([])} className="text-xs text-brand-lime/70 hover:text-brand-lime">
              Cancelar
            </button>
          </div>
        )}

        {blocks.length === 0 ? (
          <p className="text-xs text-text-secondary">Nenhum item adicionado neste dia.</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block, blockIdx) => {
              const canBlockUp = blockIdx > 0
              const canBlockDown = blockIdx < blocks.length - 1

              if (block.type === 'single') {
                return renderItemRow(block.item, {
                  onMoveUp: () => moveBlock(blockIdx, 'up'),
                  onMoveDown: () => moveBlock(blockIdx, 'down'),
                  canMoveUp: canBlockUp,
                  canMoveDown: canBlockDown,
                })
              }
              return (
                <div key={block.comboGroupId} className="space-y-1">
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex flex-col flex-shrink-0">
                      <button
                        onClick={() => moveBlock(blockIdx, 'up')}
                        disabled={!canBlockUp}
                        title="Mover combinação para cima"
                        className="text-text-secondary/60 hover:text-brand-lime disabled:opacity-20 transition-colors"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={() => moveBlock(blockIdx, 'down')}
                        disabled={!canBlockDown}
                        title="Mover combinação para baixo"
                        className="text-text-secondary/60 hover:text-brand-lime disabled:opacity-20 transition-colors"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>
                    <div className="w-1 h-4 bg-brand-lime rounded-full" />
                    <span className="text-[10px] font-bold text-brand-lime tracking-widest">
                      {COMBO_LABEL[block.comboType] ?? block.comboType.toUpperCase()} · {block.items.length} exercícios
                    </span>
                    {canManage && (
                      <button
                        onClick={() => handleRecombine(block.comboGroupId, block.items.map((it) => it.id))}
                        className="ml-auto flex items-center gap-1 text-[10px] font-medium text-text-secondary hover:text-brand-lime transition-colors"
                      >
                        <Repeat size={10} />
                        Recombinar
                      </button>
                    )}
                  </div>
                  {block.items.map((item, idx) => renderItemRow(item, {
                    comboLetter: String.fromCharCode(65 + idx),
                    onMoveUp: () => moveMember(block.comboGroupId, item.id, 'up'),
                    onMoveDown: () => moveMember(block.comboGroupId, item.id, 'down'),
                    canMoveUp: idx > 0,
                    canMoveDown: idx < block.items.length - 1,
                  }))}
                </div>
              )
            })}
          </div>
        )}

        {canManage && (
          <div className="pt-1">
            <AddDayItemButton dayId={dayId} challengeId={challengeId} />
          </div>
        )}
      </div>

      <CombineModal
        open={combineOpen}
        selectedIds={selectedIds}
        onClose={() => { setCombineOpen(false); setEditingGroupId(null) }}
        onGroup={handleGroupConfirm}
        onSuccess={handleCombineSuccess}
      />
    </>
  )
}
