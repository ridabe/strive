'use client'

import { useState, useMemo } from 'react'
import { markAttendanceToday } from '@/actions/attendance'
import { Flame, ChevronLeft, ChevronRight, CalendarCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const WEEKDAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset   = firstDay === 0 ? 6 : firstDay - 1 // Seg=0
  const total    = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
}

function ds(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

interface Props {
  attendedDates: string[]
  streak: number
  thisMonthCount: number
  totalCount: number
  hasCheckedInToday: boolean
  today: string
}

export function FrequenciaClient({
  attendedDates,
  streak,
  thisMonthCount,
  totalCount,
  hasCheckedInToday,
  today,
}: Props) {
  const now       = new Date(today + 'T12:00:00')
  const [vYear,  setVYear]  = useState(now.getFullYear())
  const [vMonth, setVMonth] = useState(now.getMonth())
  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday)
  const [isPending, setPending]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Set mutável para reflectir check-in optimista
  const [extraDates, setExtraDates] = useState<string[]>([])
  const attendedSet = useMemo(
    () => new Set([...attendedDates, ...extraDates]),
    [attendedDates, extraDates],
  )

  const cells = useMemo(() => getMonthGrid(vYear, vMonth), [vYear, vMonth])

  const minYear  = now.getFullYear() - 1
  const minMonth = now.getMonth()
  const canPrev  = !(vYear === minYear && vMonth === minMonth)
  const canNext  = !(vYear === now.getFullYear() && vMonth === now.getMonth())

  function prev() {
    if (!canPrev) return
    if (vMonth === 0) { setVYear(y => y - 1); setVMonth(11) }
    else setVMonth(m => m - 1)
  }
  function next() {
    if (!canNext) return
    if (vMonth === 11) { setVYear(y => y + 1); setVMonth(0) }
    else setVMonth(m => m + 1)
  }

  async function handleCheckIn() {
    setPending(true)
    setError(null)
    try {
      const res = await markAttendanceToday()
      if (res.error) {
        setError(res.error)
      } else {
        setCheckedIn(true)
        setExtraDates(prev => [...prev, today])
      }
    } catch {
      setError('Erro ao registrar. Tente novamente.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-surface-border rounded-2xl p-4">
          <div className="flex items-center gap-1 text-orange-400 mb-1">
            <Flame size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Streak</span>
          </div>
          <p className="text-3xl font-display font-bold text-text-primary">
            {checkedIn && streak === 0 ? 1 : streak}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">dias seguidos</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-4">
          <p className="text-3xl font-display font-bold text-brand-lime">
            {checkedIn && !hasCheckedInToday ? thisMonthCount + 1 : thisMonthCount}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">este mês</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-4">
          <p className="text-3xl font-display font-bold text-text-primary">
            {checkedIn && !hasCheckedInToday ? totalCount + 1 : totalCount}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">total</p>
        </div>
      </div>

      {/* Check-in */}
      {checkedIn ? (
        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-status-success/10 border border-status-success/20 text-status-success text-sm font-display font-bold uppercase tracking-widest">
          <CheckCircle2 size={16} />
          Treino registrado hoje!
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
        >
          {isPending
            ? <><Loader2 size={15} className="animate-spin" /> Registrando…</>
            : <><CalendarCheck size={15} /> Marcar treino de hoje</>}
        </button>
      )}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* Calendário */}
      <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3">
        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={!canPrev}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-20"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-display font-bold text-text-primary uppercase tracking-widest">
            {MONTHS[vMonth]} {vYear}
          </p>
          <button
            onClick={next}
            disabled={!canNext}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-20"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Cabeçalho dias */}
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS.map(d => (
            <p key={d} className="text-[10px] font-bold text-text-secondary uppercase py-1">{d}</p>
          ))}
        </div>

        {/* Células */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />
            const date     = ds(vYear, vMonth, day)
            const attended = attendedSet.has(date)
            const isToday  = date === today
            const isFuture = date > today
            return (
              <div key={date} className="flex justify-center py-0.5">
                <div className={`
                  w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium select-none
                  ${attended
                    ? 'bg-brand-lime text-black font-bold'
                    : isToday
                    ? 'border-2 border-brand-lime text-brand-lime font-bold'
                    : isFuture
                    ? 'text-text-secondary/25'
                    : 'text-text-secondary'}
                `}>
                  {day}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 pt-2 border-t border-surface-border">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-3 h-3 rounded-full bg-brand-lime" />
            Treinou
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-3 h-3 rounded-full border-2 border-brand-lime" />
            Hoje
          </div>
        </div>
      </div>
    </div>
  )
}
