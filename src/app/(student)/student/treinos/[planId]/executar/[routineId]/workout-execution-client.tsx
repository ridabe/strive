'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, Pause, CheckCircle2, ChevronLeft, ChevronRight,
  Timer, Dumbbell, Link2, RotateCcw, Flag, Clock, Film,
} from 'lucide-react'
import { startWorkoutSession, finishWorkoutSession, saveSessionExercise } from '@/actions/workout-sessions'
import { muscleColor } from '@/lib/exercise-config'
import type { WorkoutPlanWithRoutines } from '@/actions/workout-plans'
import { VideoModal } from '@/components/student/VideoModal'

type Routine   = WorkoutPlanWithRoutines['workout_routines'][number]
type WItem     = Routine['workout_items'][number]

const INTENSITY_OPTIONS = [
  { value: 'muito_leve',   label: 'Muito Leve',   color: 'text-sky-400    border-sky-400/30    bg-sky-400/10' },
  { value: 'leve',         label: 'Leve',          color: 'text-green-400  border-green-400/30  bg-green-400/10' },
  { value: 'moderado',     label: 'Moderado',      color: 'text-brand-lime border-brand-lime/30 bg-brand-lime/10' },
  { value: 'intenso',      label: 'Intenso',       color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  { value: 'muito_intenso',label: 'Muito Intenso', color: 'text-red-400    border-red-400/30    bg-red-400/10' },
] as const

type IntensityValue = typeof INTENSITY_OPTIONS[number]['value']

type ExerciseState = {
  loadUsed:  string
  setsDone:  number
  repsDone:  string
  feedback:  string
  completed: boolean
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function WorkoutExecutionClient({
  planId,
  planName,
  routine,
}: {
  planId:    string
  planName:  string
  routine:   Routine
}) {
  const router = useRouter()
  const items   = routine.workout_items
  const total   = items.length

  // ── Session state ─────────────────────────────────────────────────────────
  const [sessionId,   setSessionId]   = useState<string | null>(null)
  const [started,     setStarted]     = useState(false)
  const [elapsed,     setElapsed]     = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Navigation ────────────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx] = useState(0)
  const currentItem = items[currentIdx]

  // ── Per-exercise state ────────────────────────────────────────────────────
  const buildInitial = useCallback((): Record<string, ExerciseState> => {
    const map: Record<string, ExerciseState> = {}
    for (const item of items) {
      map[item.id] = {
        loadUsed:  item.load ?? '',
        setsDone:  item.sets ?? 3,
        repsDone:  item.reps ?? '',
        feedback:  '',
        completed: false,
      }
    }
    return map
  }, [items])

  const [exState, setExState] = useState<Record<string, ExerciseState>>(buildInitial)

  // ── Rest timer ────────────────────────────────────────────────────────────
  const [restActive,    setRestActive]    = useState(false)
  const [restRemaining, setRestRemaining] = useState(0)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Finish modal ──────────────────────────────────────────────────────────
  const [showFinish, setShowFinish] = useState(false)
  const [intensity,  setIntensity]  = useState<IntensityValue>('moderado')
  const [finalNotes, setFinalNotes] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // Timer management
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActive])

  useEffect(() => {
    if (restActive && restRemaining > 0) {
      restRef.current = setInterval(() => {
        setRestRemaining((r) => {
          if (r <= 1) {
            setRestActive(false)
            return 0
          }
          return r - 1
        })
      }, 1000)
    } else {
      if (restRef.current) clearInterval(restRef.current)
    }
    return () => { if (restRef.current) clearInterval(restRef.current) }
  }, [restActive, restRemaining])

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  async function handleStart() {
    const result = await startWorkoutSession(planId, routine.id)
    if ('error' in result && result.error) { setError(result.error); return }
    if ('sessionId' in result) setSessionId(result.sessionId)
    setStarted(true)
    setTimerActive(true)
  }

  function updateEx(id: string, patch: Partial<ExerciseState>) {
    setExState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function startRest(seconds: number) {
    if (restRef.current) clearInterval(restRef.current)
    setRestRemaining(seconds)
    setRestActive(true)
  }

  function stopRest() {
    if (restRef.current) clearInterval(restRef.current)
    setRestActive(false)
    setRestRemaining(0)
  }

  async function markComplete(itemId: string) {
    updateEx(itemId, { completed: true })
    if (sessionId) {
      const st = exState[itemId]
      const item = items.find((i) => i.id === itemId)
      if (item?.exercises?.id) {
        await saveSessionExercise({
          sessionId,
          workoutItemId: itemId,
          exerciseId:    item.exercises.id,
          setsDone:      st.setsDone,
          repsDone:      st.repsDone || null,
          loadUsed:      st.loadUsed || null,
          feedback:      st.feedback || null,
        })
      }
    }
    // auto-start rest timer
    const item = items.find((i) => i.id === itemId)
    if (item?.rest_seconds && item.rest_seconds > 0) {
      startRest(item.rest_seconds)
    }
  }

  async function handleFinish() {
    if (!sessionId) return
    setSaving(true)
    setError('')
    // save any remaining incomplete exercises
    for (const item of items) {
      if (!exState[item.id].completed && item.exercises?.id) {
        const st = exState[item.id]
        if (st.loadUsed || st.feedback) {
          await saveSessionExercise({
            sessionId,
            workoutItemId: item.id,
            exerciseId:    item.exercises.id,
            setsDone:      st.setsDone,
            repsDone:      st.repsDone || null,
            loadUsed:      st.loadUsed || null,
            feedback:      st.feedback || null,
          })
        }
      }
    }
    const result = await finishWorkoutSession(sessionId, elapsed, intensity, finalNotes || null)
    if ('error' in result && result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    router.push(`/student/treinos/${planId}?concluido=1`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────
  const completedCount = Object.values(exState).filter((s) => s.completed).length
  const allDone        = completedCount === total
  const ex             = currentItem?.exercises
  const st             = exState[currentItem?.id ?? ''] ?? { loadUsed:'', setsDone:0, repsDone:'', feedback:'', completed:false }

  function countLine(item: WItem) {
    if (item.count_type === 'time') return `${item.sets}× ${item.duration_secs}seg`
    if (item.count_type === 'both') return `${item.sets}× ${item.reps} / ${item.duration_secs}seg`
    return `${item.sets}× ${item.reps ?? '?'} reps`
  }

  // Mapa item.id → letra do combo (A, B, C...)
  const comboLetters: Record<string, string> = {}
  const seenGroups: Record<string, number> = {}
  for (const item of items) {
    if (item.combo_group_id) {
      if (seenGroups[item.combo_group_id] === undefined) seenGroups[item.combo_group_id] = 0
      comboLetters[item.id] = String.fromCharCode(65 + seenGroups[item.combo_group_id])
      seenGroups[item.combo_group_id]++
    }
  }
  const currentComboLetter = currentItem?.combo_group_id ? comboLetters[currentItem.id] : null

  // ─────────────────────────────────────────────────────────────────────────
  // PRE-START SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <>
      <div className="p-5 space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-3">
          <p className="text-xs text-text-secondary uppercase tracking-widest">{planName}</p>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            {routine.name}
          </h1>
          <p className="text-sm text-text-secondary">{total} exercício{total !== 1 ? 's' : ''}</p>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const e = item.exercises
            if (!e) return null
            const letter = comboLetters[item.id]
            const isCombo = !!item.combo_group_id
            return (
              <div
                key={item.id}
                className={`bg-surface rounded-xl p-3 ${
                  isCombo
                    ? 'border-l-[3px] border-l-brand-lime border border-surface-border'
                    : 'border border-surface-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Ícone + info à esquerda */}
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {letter
                        ? <span className="text-[11px] font-bold text-brand-lime">{letter}</span>
                        : <Dumbbell size={12} className="text-brand-lime" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary leading-snug">{e.name}</p>
                      <p className="text-xs text-text-secondary">{countLine(item)}</p>
                      <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${muscleColor(e.muscle_group)}`}>
                        {e.muscle_group}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail à direita */}
                  {e.video_url && (
                    <button
                      onClick={() => setVideoModal({ url: e.video_url!, name: e.name })}
                      className="relative w-24 h-16 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 group"
                    >
                      {e.video_url.toLowerCase().includes('.gif') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.video_url} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <video
                          src={e.video_url}
                          preload="metadata"
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          onLoadedMetadata={(ev) => { ev.currentTarget.currentTime = 0.1 }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/25 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-brand-lime flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play size={12} className="text-background ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 bg-brand-lime text-background font-display font-bold text-base uppercase tracking-widest py-4 rounded-2xl hover:bg-brand-lime/90 transition-colors"
        >
          <Play size={18} />
          Iniciar Treino
        </button>
      </div>

      <VideoModal
        open={videoModal !== null}
        onClose={() => setVideoModal(null)}
        videoUrl={videoModal?.url ?? ''}
        exerciseName={videoModal?.name ?? ''}
      />
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FINISH MODAL
  // ─────────────────────────────────────────────────────────────────────────
  if (showFinish) {
    return (
      <div className="p-5 space-y-6">
        <div className="bg-surface border border-surface-border rounded-2xl p-5 text-center space-y-2">
          <Flag size={32} className="text-brand-lime mx-auto" />
          <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">Treino Concluído!</h2>
          <p className="text-text-secondary text-sm">Tempo total: <span className="text-brand-lime font-bold">{formatTime(elapsed)}</span></p>
          <p className="text-text-secondary text-sm">{completedCount}/{total} exercícios marcados</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Como foi a intensidade?</p>
          <div className="grid grid-cols-1 gap-2">
            {INTENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setIntensity(opt.value)}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                  intensity === opt.value ? opt.color : 'border-surface-border text-text-secondary hover:border-surface-border/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
            Observações (opcional)
          </label>
          <textarea
            value={finalNotes}
            onChange={(e) => setFinalNotes(e.target.value)}
            rows={3}
            placeholder="Como se sentiu? Algo a destacar..."
            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 resize-none font-body"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => setShowFinish(false)}
            className="flex-1 py-3 border border-surface-border rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="flex-1 py-3 bg-brand-lime text-background font-semibold rounded-xl text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar Treino'}
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXECUTION SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">
      {/* ── Top bar ── */}
      <div className="px-5 py-3 border-b border-surface-border bg-background flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-text-secondary truncate">{planName} · {routine.name}</p>
          <p className="text-xs text-text-secondary">{completedCount}/{total} exercícios</p>
        </div>
        {/* Timer total */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[9px] text-text-secondary uppercase tracking-widest leading-none">Tempo total</p>
            <span className="font-display text-brand-lime font-bold text-lg tracking-widest leading-none">
              {formatTime(elapsed)}
            </span>
          </div>
          <button
            onClick={() => setTimerActive((v) => !v)}
            className="p-1.5 rounded-lg bg-surface border border-surface-border text-text-secondary hover:text-text-primary transition-colors"
          >
            {timerActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-surface flex-shrink-0">
        <div
          className="h-full bg-brand-lime transition-all duration-300"
          style={{ width: `${(completedCount / total) * 100}%` }}
        />
      </div>

      {/* ── Exercise card ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* combo badge */}
        {currentItem.combo_group_id && (
          <div className="flex items-center gap-2">
            <Link2 size={12} className="text-brand-lime" />
            <span className="text-[10px] font-bold text-brand-lime tracking-widest">
              {currentItem.combo_type?.toUpperCase() ?? 'COMBO'}
            </span>
            {currentComboLetter && (
              <span className="w-5 h-5 rounded-full bg-brand-lime text-background text-[10px] font-bold flex items-center justify-center">
                {currentComboLetter}
              </span>
            )}
          </div>
        )}

        {/* Header exercício */}
        <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              st.completed ? 'bg-brand-lime/20 border-brand-lime/30' : 'bg-brand-lime/10 border-brand-lime/20'
            }`}>
              {st.completed
                ? <CheckCircle2 size={18} className="text-brand-lime" />
                : currentComboLetter
                  ? <span className="text-sm font-bold text-brand-lime">{currentComboLetter}</span>
                  : <Dumbbell size={14} className="text-brand-lime" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-text-primary leading-snug">
                {ex?.name ?? 'Exercício'}
              </p>
              {ex && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${muscleColor(ex.muscle_group)}`}>
                  {ex.muscle_group}
                </span>
              )}
            </div>
            <span className="text-xs text-text-secondary flex-shrink-0">
              {currentIdx + 1}/{total}
            </span>
          </div>

          {/* Prescrição */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-text-primary bg-background border border-surface-border rounded-lg px-3 py-1.5">
              {countLine(currentItem)}
            </span>
            {currentItem.rest_seconds != null && currentItem.rest_seconds > 0 && (
              <span className="flex items-center gap-1 text-xs text-text-secondary bg-background border border-surface-border rounded-lg px-3 py-1.5">
                <Clock size={11} /> {currentItem.rest_seconds}s descanso
              </span>
            )}
            {currentItem.cadence && (
              <span className="text-xs text-text-secondary bg-background border border-surface-border rounded-lg px-3 py-1.5">
                Cadência: {currentItem.cadence}
              </span>
            )}
          </div>

          {currentItem.notes && (
            <p className="text-xs text-text-secondary italic border-l-2 border-brand-lime/30 pl-3">
              {currentItem.notes}
            </p>
          )}

          {ex?.instructions && (
            <p className="text-xs text-text-secondary leading-relaxed">{ex.instructions}</p>
          )}

          {ex?.video_url && (
            <button
              onClick={() => setVideoModal({ url: ex.video_url!, name: ex.name ?? '' })}
              className="flex items-center gap-1.5 text-xs text-brand-lime hover:underline"
            >
              <Film size={11} /> Ver demonstração
            </button>
          )}
        </div>

        {/* Registro de execução */}
        <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Registrar Execução</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Séries feitas</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateEx(currentItem.id, { setsDone: Math.max(0, st.setsDone - 1) })}
                  className="w-8 h-8 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-border/30 transition-colors flex items-center justify-center text-lg font-light"
                >−</button>
                <span className="flex-1 text-center font-display font-bold text-text-primary text-lg">
                  {st.setsDone}
                </span>
                <button
                  onClick={() => updateEx(currentItem.id, { setsDone: st.setsDone + 1 })}
                  className="w-8 h-8 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-border/30 transition-colors flex items-center justify-center text-lg font-light"
                >+</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Carga usada</label>
              <input
                type="text"
                value={st.loadUsed}
                onChange={(e) => updateEx(currentItem.id, { loadUsed: e.target.value })}
                placeholder="ex: 20kg"
                className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 font-body"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Feedback do exercício</label>
            <textarea
              value={st.feedback}
              onChange={(e) => updateEx(currentItem.id, { feedback: e.target.value })}
              rows={2}
              placeholder="Como foi? Sentiu algum desconforto?"
              className="w-full bg-background border border-surface-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 resize-none font-body"
            />
          </div>

          {/* Marcar concluído + descanso */}
          <div className="flex gap-2">
            <button
              onClick={() => markComplete(currentItem.id)}
              disabled={st.completed}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                st.completed
                  ? 'bg-brand-lime/10 border border-brand-lime/20 text-brand-lime cursor-default'
                  : 'bg-brand-lime text-background hover:bg-brand-lime/90'
              }`}
            >
              <CheckCircle2 size={16} />
              {st.completed ? 'Concluído' : 'Marcar como feito'}
            </button>
            {currentItem.rest_seconds != null && currentItem.rest_seconds > 0 && (
              <button
                onClick={() => restActive ? stopRest() : startRest(currentItem.rest_seconds!)}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  restActive
                    ? 'border-orange-400/30 bg-orange-400/10 text-orange-400'
                    : 'border-surface-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <Timer size={14} />
                {restActive ? formatTime(restRemaining) : 'Descanso'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="px-5 py-4 border-t border-surface-border bg-background flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => { setCurrentIdx((i) => i - 1); stopRest() }}
          disabled={currentIdx === 0}
          className="p-3 rounded-xl border border-surface-border text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Exercise dots */}
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { setCurrentIdx(i); stopRest() }}
              className={`rounded-full transition-all ${
                i === currentIdx
                  ? 'w-4 h-2 bg-brand-lime'
                  : exState[item.id]?.completed
                    ? 'w-2 h-2 bg-brand-lime/60'
                    : 'w-2 h-2 bg-surface-border'
              }`}
            />
          ))}
        </div>

        {currentIdx < total - 1 ? (
          <button
            onClick={() => { setCurrentIdx((i) => i + 1); stopRest() }}
            className="p-3 rounded-xl border border-surface-border text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => { setTimerActive(false); setShowFinish(true) }}
            className="flex items-center gap-2 bg-brand-lime text-background font-semibold text-sm px-4 py-3 rounded-xl hover:bg-brand-lime/90 transition-colors"
          >
            <RotateCcw size={14} />
            Finalizar
          </button>
        )}
      </div>

      <VideoModal
        open={videoModal !== null}
        onClose={() => setVideoModal(null)}
        videoUrl={videoModal?.url ?? ''}
        exerciseName={videoModal?.name ?? ''}
      />
    </div>
  )
}
