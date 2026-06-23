'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Clock, UtensilsCrossed,
  Pencil, Check, X, Search, Flame, Dumbbell, Wheat, Droplets, Save,
} from 'lucide-react'
import {
  addMeal, updateMeal, deleteMeal,
  replaceMealFoods, publishMealPlan, deactivateMealPlan,
} from '@/app/actions/meal-plans'
import type { Meal, MealFood } from '@/app/actions/meal-plans'
import type { FoodItem } from '@/app/actions/food-items'

// ─── Types ────────────────────────────────────────────────────────────────────

type DraftFood = {
  localId: string
  dbId?: string
  foodItem: FoodItem
  quantity: number
}

type DraftMeals = Record<string, DraftFood[]>   // mealId → foods

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function calcFood(food: FoodItem, qty: number) {
  const f = qty / food.portion_grams
  return {
    calories: food.calories  * f,
    protein:  food.protein_g * f,
    carbs:    food.carbs_g   * f,
    fat:      food.fat_g     * f,
  }
}

function sumNutrition(foods: DraftFood[]) {
  return foods.reduce(
    (acc, { foodItem, quantity }) => {
      const n = calcFood(foodItem, quantity)
      return {
        calories: acc.calories + n.calories,
        protein:  acc.protein  + n.protein,
        carbs:    acc.carbs    + n.carbs,
        fat:      acc.fat      + n.fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  cafe_da_manha: 'Café da Manhã',
  lanche_manha:  'Lanche da Manhã',
  almoco:        'Almoço',
  lanche_tarde:  'Lanche da Tarde',
  jantar:        'Jantar',
  ceia:          'Ceia',
  pre_treino:    'Pré-Treino',
  pos_treino:    'Pós-Treino',
  outro:         'Outro',
}

// ─── FoodSearchPanel ──────────────────────────────────────────────────────────

function FoodSearchPanel({
  foodItems,
  onAdd,
  onClose,
}: {
  foodItems: FoodItem[]
  onAdd: (food: FoodItem, qty: number) => void
  onClose: () => void
}) {
  const [query,   setQuery]   = useState('')
  const [selFood, setSelFood] = useState<FoodItem | null>(null)
  const [qty,     setQty]     = useState('100')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return foodItems.slice(0, 30)
    return foodItems
      .filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q))
      .slice(0, 30)
  }, [query, foodItems])

  function handleAdd() {
    if (!selFood) return
    const q = Number(qty)
    if (!q || q <= 0) return
    onAdd(selFood, q)
    setSelFood(null)
    setQty('100')
    setQuery('')
  }

  const preview = selFood ? calcFood(selFood, Number(qty) || 0) : null

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelFood(null) }}
          placeholder="Buscar alimento... (nome ou categoria)"
          className="w-full bg-background border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 font-body"
        />
      </div>

      {/* Results list */}
      {!selFood && (
        <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4">Nenhum alimento encontrado.</p>
          ) : filtered.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelFood(f)}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border border-surface-border hover:border-brand-lime/40 hover:bg-brand-lime/5 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate group-hover:text-brand-lime transition-colors">
                  {f.name}
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {f.category} · {fmt(f.calories)} kcal · P {fmt(f.protein_g)}g · C {fmt(f.carbs_g)}g · G {fmt(f.fat_g)}g
                  <span className="ml-1 opacity-60">por {f.portion_label}</span>
                </p>
              </div>
              <Plus size={13} className="text-text-secondary/40 group-hover:text-brand-lime transition-colors flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}

      {/* Selected food — quantity picker */}
      {selFood && (
        <div className="bg-background border border-brand-lime/30 rounded-xl p-3 space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{selFood.name}</p>
              <p className="text-[10px] text-text-secondary">{selFood.category} · porção padrão: {selFood.portion_label}</p>
            </div>
            <button onClick={() => setSelFood(null)} className="p-1 rounded text-text-secondary hover:text-text-primary">
              <X size={13} />
            </button>
          </div>

          {/* Quantity input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-secondary whitespace-nowrap">Quantidade:</label>
            <input
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              type="number"
              min={1}
              className="w-20 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand-lime/50 font-body text-right"
            />
            <span className="text-xs text-text-secondary">g</span>
          </div>

          {/* Live nutrition preview */}
          {preview && Number(qty) > 0 && (
            <div className="grid grid-cols-4 gap-2 py-2 border-t border-surface-border/50">
              <div className="text-center">
                <p className="text-xs font-bold text-orange-400">{fmt(preview.calories)}</p>
                <p className="text-[9px] text-text-secondary">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-blue-400">{fmt(preview.protein)}g</p>
                <p className="text-[9px] text-text-secondary">Prot</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-yellow-400">{fmt(preview.carbs)}g</p>
                <p className="text-[9px] text-text-secondary">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-red-400">{fmt(preview.fat)}g</p>
                <p className="text-[9px] text-text-secondary">Gord</p>
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!qty || Number(qty) <= 0}
            className="w-full py-2 bg-brand-lime text-background text-sm font-semibold rounded-xl hover:bg-brand-lime/90 transition-colors disabled:opacity-40"
          >
            Adicionar à Refeição
          </button>
        </div>
      )}

      <button onClick={onClose} className="w-full text-xs text-text-secondary hover:text-text-primary transition-colors py-1">
        Cancelar
      </button>
    </div>
  )
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

function MealCard({
  meal,
  draft,
  foodItems,
  onDraftChange,
  onDeleteMeal,
  isPending,
  planId,
}: {
  meal: Meal
  draft: DraftFood[]
  foodItems: FoodItem[]
  onDraftChange: (foods: DraftFood[]) => void
  onDeleteMeal: () => void
  isPending: boolean
  planId: string
}) {
  const [open,       setOpen]       = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [editName,   setEditName]   = useState(meal.name)
  const [editType,   setEditType]   = useState(meal.meal_type)
  const [editTime,   setEditTime]   = useState(meal.suggested_time ?? '')
  const [addingFood, setAddingFood] = useState(false)
  const [editQtyId,  setEditQtyId]  = useState<string | null>(null)
  const [editQtyVal, setEditQtyVal] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [isPendingMeal, startMeal]  = useTransition()

  const nutrition = useMemo(() => sumNutrition(draft), [draft])

  const isDirty = useMemo(() => {
    if (draft.length !== meal.meal_plan_foods.length) return true
    return draft.some((d, i) => {
      const orig = meal.meal_plan_foods[i]
      return !orig || d.quantity !== orig.quantity || d.foodItem.id !== orig.food_items?.id
    })
  }, [draft, meal.meal_plan_foods])

  function handleAddFood(food: FoodItem, qty: number) {
    const newFood: DraftFood = {
      localId:  crypto.randomUUID(),
      foodItem: food,
      quantity: qty,
    }
    onDraftChange([...draft, newFood])
    setAddingFood(false)
  }

  function handleRemoveFood(localId: string) {
    onDraftChange(draft.filter((f) => f.localId !== localId))
  }

  function handleUpdateQty(localId: string) {
    const q = Number(editQtyVal)
    if (!q || q <= 0) return
    onDraftChange(draft.map((f) => f.localId === localId ? { ...f, quantity: q } : f))
    setEditQtyId(null)
  }

  async function handleSaveMeal() {
    setSaving(true)
    setSaveError('')
    const foods = draft.map((f, i) => ({
      foodItemId: f.foodItem.id,
      quantity:   f.quantity,
      sortOrder:  i,
    }))
    const result = await replaceMealFoods(meal.id, planId, foods)
    setSaving(false)
    if ('error' in result && result.error) {
      setSaveError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function handleSaveEdit() {
    if (!editName.trim()) return
    startMeal(async () => {
      await updateMeal(meal.id, planId, editName, editType, editTime || null, null)
      setEditing(false)
    })
  }

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden transition-colors ${isDirty ? 'border-brand-lime/40' : 'border-surface-border'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setOpen((v) => !v)} className="flex-1 flex items-center gap-2 text-left min-w-0">
          {open
            ? <ChevronUp size={14} className="text-text-secondary flex-shrink-0" />
            : <ChevronDown size={14} className="text-text-secondary flex-shrink-0" />}
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-background border border-brand-lime/50 rounded-lg px-2 py-1 text-sm text-text-primary outline-none font-body"
            />
          ) : (
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-sm text-text-primary truncate">{meal.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-secondary">{MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}</span>
                {meal.suggested_time && (
                  <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                    <Clock size={9} />{meal.suggested_time}
                  </span>
                )}
              </div>
            </div>
          )}
        </button>

        {/* Nutrition summary */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-text-secondary flex-shrink-0">
          <span className="text-orange-400 font-semibold">{fmt(nutrition.calories)} kcal</span>
          <span>P {fmt(nutrition.protein)}g</span>
          <span>C {fmt(nutrition.carbs)}g</span>
          <span>G {fmt(nutrition.fat)}g</span>
        </div>
        <span className="sm:hidden text-[10px] text-orange-400 font-semibold flex-shrink-0">
          {fmt(nutrition.calories)} kcal
        </span>

        {/* Save button */}
        {isDirty && !editing && (
          <button
            onClick={handleSaveMeal}
            disabled={saving}
            title="Salvar alimentos desta refeição"
            className="flex items-center gap-1 px-2.5 py-1 bg-brand-lime text-background text-[10px] font-bold rounded-lg hover:bg-brand-lime/90 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {saving ? '...' : saved ? <><Check size={11} /> Salvo</> : <><Save size={11} /> Salvar</>}
          </button>
        )}

        {/* Edit / delete meal */}
        {editing ? (
          <div className="flex items-center gap-1">
            <button onClick={handleSaveEdit} disabled={isPendingMeal} className="p-1.5 rounded-lg bg-brand-lime/10 text-brand-lime hover:bg-brand-lime/20 transition-colors">
              <Check size={13} />
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-border/30 transition-colors">
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-border/30 transition-colors">
              <Pencil size={13} />
            </button>
            <button
              onClick={() => { if (confirm(`Remover refeição "${meal.name}"?`)) onDeleteMeal() }}
              disabled={isPending}
              className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Edit fields */}
      {editing && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-2 border-t border-surface-border/50 pt-2">
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="bg-background border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-lime/50 font-body"
          >
            {Object.entries(MEAL_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            placeholder="Horário (08:00)"
            className="bg-background border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 font-body"
          />
        </div>
      )}

      {/* Body */}
      {open && (
        <div className="border-t border-surface-border/50">
          {/* Food list */}
          {draft.length > 0 && (
            <div className="divide-y divide-surface-border/40">
              {draft.map((f) => {
                const n = calcFood(f.foodItem, f.quantity)
                return (
                  <div key={f.localId} className="flex items-center gap-3 px-4 py-2.5 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{f.foodItem.name}</p>
                      <p className="text-[10px] text-text-secondary">
                        {fmt(n.calories)} kcal · P {fmt(n.protein)}g · C {fmt(n.carbs)}g · G {fmt(n.fat)}g
                      </p>
                    </div>

                    {/* Qty editor */}
                    {editQtyId === f.localId ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={editQtyVal}
                          onChange={(e) => setEditQtyVal(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateQty(f.localId)}
                          type="number"
                          min={1}
                          className="w-16 bg-background border border-brand-lime/50 rounded-lg px-2 py-1 text-xs text-text-primary outline-none font-body text-right"
                        />
                        <span className="text-[10px] text-text-secondary">g</span>
                        <button onClick={() => handleUpdateQty(f.localId)} className="p-1 rounded text-brand-lime"><Check size={12} /></button>
                        <button onClick={() => setEditQtyId(null)} className="p-1 rounded text-text-secondary"><X size={12} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditQtyId(f.localId); setEditQtyVal(String(f.quantity)) }}
                        className="text-[10px] text-text-secondary hover:text-brand-lime transition-colors px-1.5 py-0.5 rounded border border-surface-border hover:border-brand-lime/50 flex-shrink-0"
                      >
                        {f.quantity}g
                      </button>
                    )}

                    <button
                      onClick={() => handleRemoveFood(f.localId)}
                      className="p-1 rounded text-text-secondary/30 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add food */}
          {addingFood ? (
            <div className="p-3 border-t border-surface-border/40">
              <FoodSearchPanel
                foodItems={foodItems}
                onAdd={handleAddFood}
                onClose={() => setAddingFood(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingFood(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-secondary hover:text-brand-lime hover:bg-surface-border/20 transition-colors border-t border-surface-border/40"
            >
              <Plus size={12} />
              Adicionar alimento
            </button>
          )}

          {/* Per-meal nutrition bar */}
          {draft.length > 0 && (
            <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-background border-t border-surface-border/40 text-center">
              <div>
                <p className="text-[10px] font-bold text-orange-400">{fmt(nutrition.calories)}</p>
                <p className="text-[9px] text-text-secondary">kcal</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400">{fmt(nutrition.protein)}g</p>
                <p className="text-[9px] text-text-secondary">Prot</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-yellow-400">{fmt(nutrition.carbs)}g</p>
                <p className="text-[9px] text-text-secondary">Carbs</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-400">{fmt(nutrition.fat)}g</p>
                <p className="text-[9px] text-text-secondary">Gord</p>
              </div>
            </div>
          )}

          {/* Save error */}
          {saveError && (
            <p className="text-xs text-red-400 px-4 pb-3">{saveError}</p>
          )}

          {/* Dirty hint */}
          {isDirty && !saving && (
            <p className="text-[10px] text-brand-lime/70 px-4 pb-2 text-center">
              Alterações não salvas — clique em Salvar nesta refeição
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MealPlanEditor ───────────────────────────────────────────────────────────

type Props = {
  planId: string
  initialMeals: Meal[]
  foodItems: FoodItem[]
  status: string
}

export function MealPlanEditor({ planId, initialMeals, foodItems, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const [addingMeal, setAddingMeal]  = useState(false)
  const [mealName,   setMealName]    = useState('')
  const [mealType,   setMealType]    = useState('outro')
  const [mealTime,   setMealTime]    = useState('')
  const [mealError,  setMealError]   = useState('')

  // Draft foods: mealId → DraftFood[]
  // Initialized from server data; each MealCard owns its own draft slice
  const [draftMap, setDraftMap] = useState<DraftMeals>(() =>
    Object.fromEntries(
      initialMeals.map((m) => [
        m.id,
        (m.meal_plan_foods ?? []).map((f) => ({
          localId:  f.id,
          dbId:     f.id,
          foodItem: f.food_items as FoodItem,
          quantity: f.quantity,
        })),
      ]),
    ),
  )

  // When server re-renders with new initialMeals (after meal add/delete),
  // merge: keep existing draft foods for existing meals, init new meals empty
  useEffect(() => {
    setDraftMap((prev) => {
      const next: DraftMeals = {}
      for (const m of initialMeals) {
        next[m.id] = prev[m.id] ?? (m.meal_plan_foods ?? []).map((f) => ({
          localId:  f.id,
          dbId:     f.id,
          foodItem: f.food_items as FoodItem,
          quantity: f.quantity,
        }))
      }
      return next
    })
  }, [initialMeals])

  const totalNutrition = useMemo(() =>
    Object.values(draftMap).reduce(
      (acc, foods) => {
        const n = sumNutrition(foods)
        return {
          calories: acc.calories + n.calories,
          protein:  acc.protein  + n.protein,
          carbs:    acc.carbs    + n.carbs,
          fat:      acc.fat      + n.fat,
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ),
    [draftMap],
  )

  function handleDeleteMeal(mealId: string, planId: string) {
    startTransition(async () => {
      await deleteMeal(mealId, planId)
      setDraftMap((prev) => {
        const next = { ...prev }
        delete next[mealId]
        return next
      })
    })
  }

  function handleAddMeal() {
    if (!mealName.trim()) { setMealError('Nome da refeição é obrigatório'); return }
    setMealError('')
    startTransition(async () => {
      await addMeal(planId, mealName, mealType, mealTime || null, null)
      setMealName('')
      setMealType('outro')
      setMealTime('')
      setAddingMeal(false)
    })
  }

  function handleToggleStatus() {
    startTransition(async () => {
      if (status === 'active') await deactivateMealPlan(planId)
      else await publishMealPlan(planId)
    })
  }

  const anyDirty = useMemo(() =>
    initialMeals.some((m) => {
      const draft = draftMap[m.id] ?? []
      if (draft.length !== m.meal_plan_foods.length) return true
      return draft.some((d, i) => {
        const orig = m.meal_plan_foods[i]
        return !orig || d.quantity !== orig.quantity || d.foodItem.id !== orig.food_items?.id
      })
    }), [draftMap, initialMeals])

  return (
    <div className="space-y-3">
      {/* Empty state */}
      {initialMeals.length === 0 && !addingMeal && (
        <div className="bg-surface border border-surface-border rounded-2xl p-8 text-center space-y-2">
          <UtensilsCrossed size={28} className="text-text-secondary/30 mx-auto" />
          <p className="text-sm text-text-secondary">Nenhuma refeição ainda. Adicione a primeira abaixo.</p>
        </div>
      )}

      {/* Meal cards */}
      {initialMeals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          draft={draftMap[meal.id] ?? []}
          foodItems={foodItems}
          onDraftChange={(foods) => setDraftMap((prev) => ({ ...prev, [meal.id]: foods }))}
          onDeleteMeal={() => handleDeleteMeal(meal.id, planId)}
          isPending={isPending}
          planId={planId}
        />
      ))}

      {/* Add meal form */}
      {addingMeal ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nova Refeição</p>
          <input
            autoFocus
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Nome da refeição"
            className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 font-body"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="bg-background border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand-lime/50 font-body"
            >
              {Object.entries(MEAL_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <input
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              placeholder="Horário (08:00)"
              className="bg-background border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 font-body"
            />
          </div>
          {mealError && <p className="text-xs text-red-400">{mealError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAddMeal}
              disabled={isPending}
              className="flex-1 py-2.5 bg-brand-lime text-background text-sm font-semibold rounded-xl hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
            >
              Adicionar
            </button>
            <button
              onClick={() => { setAddingMeal(false); setMealError('') }}
              className="px-4 py-2.5 border border-surface-border text-text-secondary text-sm rounded-xl hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingMeal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-surface-border rounded-2xl text-sm text-text-secondary hover:text-brand-lime hover:border-brand-lime/40 transition-colors"
        >
          <Plus size={14} />
          Adicionar Refeição
        </button>
      )}

      {/* Grand total */}
      {initialMeals.length > 0 && (
        <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total do Dia</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Flame size={11} className="text-orange-400" />
                <p className="font-body font-bold text-base text-orange-400">{fmt(totalNutrition.calories)}</p>
              </div>
              <p className="text-[10px] text-text-secondary">kcal</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Dumbbell size={11} className="text-blue-400" />
                <p className="font-body font-bold text-base text-blue-400">{fmt(totalNutrition.protein)}g</p>
              </div>
              <p className="text-[10px] text-text-secondary">Proteína</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Wheat size={11} className="text-yellow-400" />
                <p className="font-body font-bold text-base text-yellow-400">{fmt(totalNutrition.carbs)}g</p>
              </div>
              <p className="text-[10px] text-text-secondary">Carboidrato</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Droplets size={11} className="text-red-400" />
                <p className="font-body font-bold text-base text-red-400">{fmt(totalNutrition.fat)}g</p>
              </div>
              <p className="text-[10px] text-text-secondary">Gordura</p>
            </div>
          </div>

          {anyDirty && (
            <p className="text-[11px] text-brand-lime/80 text-center">
              Salve cada refeição alterada antes de publicar o plano.
            </p>
          )}
        </div>
      )}

      {/* Publish / Deactivate */}
      <button
        onClick={handleToggleStatus}
        disabled={isPending || anyDirty}
        title={anyDirty ? 'Salve todas as refeições antes de publicar' : undefined}
        className={`w-full py-3 rounded-xl font-display font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 ${
          status === 'active'
            ? 'bg-background border border-surface-border text-text-secondary hover:text-red-400 hover:border-red-400/40'
            : 'bg-brand-lime text-background hover:bg-brand-lime/90'
        }`}
      >
        {status === 'active' ? 'Desativar Plano' : anyDirty ? 'Salve as refeições para Publicar' : 'Publicar Plano →'}
      </button>
    </div>
  )
}
