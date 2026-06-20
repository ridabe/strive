'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight,
  Plus, X, CheckCircle2, Loader2,
} from 'lucide-react'
import { registerAttendance, removeAttendance } from '@/app/actions/attendance'

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: string
  date: string        // YYYY-MM-DD
  notes: string | null
}

// ─── Constantes de UI ─────────────────────────────────────────────────────────
const WEEKDAYS    = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS_PT   = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// ─── Calendário interativo ────────────────────────────────────────────────────
export function AttendanceCalendar({
  records,
  studentId,
}: {
  records: AttendanceRecord[]
  studentId: string
}) {
  const router = useRouter()
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [loading, setLoading]          = useState<string | null>(null)
  const [isPending, startTransition]   = useTransition()

  // date string → record id
  const dateMap: Record<string, string> = {}
  for (const r of records) dateMap[r.date] = r.id

  const today     = now.toISOString().split('T')[0]
  const monthStr  = `${year}-${String(month + 1).padStart(2, '0')}`
  const maxMonth  = now.toISOString().slice(0, 7)
  const canGoNext = monthStr < maxMonth

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (!canGoNext) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function handleDayClick(dateStr: string) {
    if (dateStr > today || isPending) return
    setLoading(dateStr)
    const existingId = dateMap[dateStr]
    startTransition(async () => {
      if (existingId) {
        await removeAttendance(existingId, studentId)
      } else {
        await registerAttendance(studentId, dateStr)
      }
      setLoading(null)
      router.refresh()
    })
  }

  // Grid: padding + days
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow    = new Date(year, month, 1).getDay()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Count attended days this month
  const monthAttended = Object.keys(dateMap).filter(d => d.startsWith(monthStr)).length

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-4">
      {/* Header do mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-border/30"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-body font-semibold text-sm text-text-primary">
            {MONTHS_PT[month]} {year}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {monthAttended} treino{monthAttended !== 1 ? 's' : ''} registrado{monthAttended !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={nextMonth}
          disabled={!canGoNext}
          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-border/30 disabled:opacity-30 disabled:cursor-default"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="text-center text-xs text-text-secondary font-body font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const dateStr    = `${monthStr}-${String(day).padStart(2, '0')}`
          const isAttended = !!dateMap[dateStr]
          const isToday    = dateStr === today
          const isFuture   = dateStr > today
          const isLoading  = loading === dateStr

          return (
            <button
              key={i}
              onClick={() => handleDayClick(dateStr)}
              disabled={isFuture || isPending}
              title={isAttended ? 'Clique para remover' : isFuture ? '' : 'Clique para registrar'}
              className={cn(
                'aspect-square rounded-lg text-xs font-body font-medium transition-all flex items-center justify-center relative',
                isAttended
                  ? 'bg-brand-lime/20 text-brand-lime border border-brand-lime/40 hover:bg-status-error/10 hover:border-status-error/30 hover:text-status-error'
                  : isToday
                  ? 'bg-background border border-brand-lime/40 text-text-primary hover:bg-brand-lime/10'
                  : isFuture
                  ? 'text-text-secondary/25 cursor-default'
                  : 'text-text-secondary hover:bg-surface-border/40 hover:text-text-primary',
              )}
            >
              {isLoading
                ? <Loader2 size={10} className="animate-spin" />
                : day
              }
            </button>
          )
        })}
      </div>

      <p className="text-xs text-text-secondary/60 text-center pt-1">
        Clique em um dia para registrar · Clique novamente para remover
      </p>
    </div>
  )
}

// ─── Formulário de registro manual ───────────────────────────────────────────
export function RegisterAttendanceForm({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [open, setOpen]              = useState(false)
  const [error, setError]            = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd    = new FormData(e.currentTarget)
    const date  = String(fd.get('date') || '').trim()
    const notes = String(fd.get('notes') || '').trim() || undefined

    if (!date) return

    setError(null)
    startTransition(async () => {
      const res = await registerAttendance(studentId, date, notes)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
        ;(e.target as HTMLFormElement).reset()
        router.refresh()
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-body font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={15} />
        Registrar Treino
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-brand-lime/30 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-body font-semibold text-text-primary">
          Registrar treino
        </h3>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Data</label>
          <input
            type="date"
            name="date"
            required
            max={new Date().toISOString().split('T')[0]}
            defaultValue={new Date().toISOString().split('T')[0]}
            className="bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
          />
        </div>
        <div className="flex-1 min-w-44">
          <label className="text-xs text-text-secondary block mb-1">
            Observação (opcional)
          </label>
          <input
            type="text"
            name="notes"
            placeholder="Ex: Treino A, cardio, musculação…"
            className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50 placeholder:text-text-secondary/40"
          />
        </div>
      </div>

      {error && <p className="text-xs text-status-error">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-lime text-background text-xs font-body font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending
            ? <Loader2 size={12} className="animate-spin" />
            : <CheckCircle2 size={12} />
          }
          Salvar
        </button>
      </div>
    </form>
  )
}
