'use client'

import { useState } from 'react'
import { submitStudentAssessment } from '@/actions/assessments'
import { Plus, X, Save, Loader2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface Assessment {
  id: string
  assessed_at: string
  weight: number | null
  height: number | null
  body_fat: number | null
  arm: number | null
  chest: number | null
  waist: number | null
  hip: number | null
  thigh: number | null
  notes: string | null
}

const GENERAL_FIELDS = [
  { name: 'weight',   label: 'Peso',       unit: 'kg',  step: '0.1' },
  { name: 'height',   label: 'Altura',     unit: 'cm',  step: '0.1' },
  { name: 'body_fat', label: '% Gordura',  unit: '%',   step: '0.1' },
] as const

const CIRCUM_FIELDS = [
  { name: 'arm',   label: 'Braço'    },
  { name: 'chest', label: 'Peitoral' },
  { name: 'waist', label: 'Cintura'  },
  { name: 'hip',   label: 'Quadril'  },
  { name: 'thigh', label: 'Coxa'     },
] as const

type FieldValues = Record<string, string>

function emptyValues(): FieldValues {
  return {
    assessed_at: new Date().toISOString().split('T')[0],
    weight: '', height: '', body_fat: '',
    arm: '', chest: '', waist: '', hip: '', thigh: '',
    notes: '',
  }
}

function toNum(v: string): number | null {
  if (!v.trim()) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

// ─── Form de nova avaliação ───────────────────────────────────────────────────

export function NewAssessmentForm() {
  const [open, setOpen]       = useState(false)
  const [vals, setVals]       = useState<FieldValues>(emptyValues)
  const [isPending, setPending] = useState(false)
  const [banner, setBanner]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setBanner(null)
    try {
      const res = await submitStudentAssessment({
        assessed_at: vals.assessed_at || new Date().toISOString().split('T')[0],
        weight:   toNum(vals.weight),
        height:   toNum(vals.height),
        body_fat: toNum(vals.body_fat),
        arm:      toNum(vals.arm),
        chest:    toNum(vals.chest),
        waist:    toNum(vals.waist),
        hip:      toNum(vals.hip),
        thigh:    toNum(vals.thigh),
        notes:    vals.notes.trim() || null,
      })
      if (res.error) {
        setBanner({ type: 'error', msg: res.error })
      } else {
        setBanner({ type: 'success', msg: 'Avaliação registrada! Seu personal já pode visualizá-la.' })
        setVals(emptyValues())
        setOpen(false)
      }
    } catch {
      setBanner({ type: 'error', msg: 'Erro ao salvar. Verifique sua conexão e tente novamente.' })
    } finally {
      setPending(false)
    }
  }

  const inputCls =
    'w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body placeholder:text-text-secondary/40'

  return (
    <div className="space-y-3">
      {banner && !open && (
        <div className={`flex items-center gap-3 rounded-xl p-4 border ${
          banner.type === 'success'
            ? 'bg-status-success/10 border-status-success/20 text-status-success'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {banner.type === 'success'
            ? <CheckCircle size={15} className="flex-shrink-0" />
            : <AlertTriangle size={15} className="flex-shrink-0" />}
          <p className="text-sm font-medium">{banner.msg}</p>
        </div>
      )}

      {!open ? (
        <button
          onClick={() => { setOpen(true); setBanner(null) }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors"
        >
          <Plus size={15} />
          Nova Avaliação
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-brand-lime/30 rounded-2xl p-5 space-y-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-display font-bold uppercase tracking-widest text-text-primary">
              Nova Avaliação Física
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {banner && (
            <div className={`flex items-center gap-3 rounded-xl p-3 border text-sm ${
              banner.type === 'success'
                ? 'bg-status-success/10 border-status-success/20 text-status-success'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {banner.type === 'success'
                ? <CheckCircle size={14} className="flex-shrink-0" />
                : <AlertTriangle size={14} className="flex-shrink-0" />}
              {banner.msg}
            </div>
          )}

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Data da Avaliação
            </label>
            <input
              type="date"
              value={vals.assessed_at}
              onChange={(e) => set('assessed_at', e.target.value)}
              required
              className={inputCls}
            />
          </div>

          {/* Medidas gerais */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest pb-2 border-b border-surface-border">
              Medidas Gerais
            </p>
            <div className="grid grid-cols-3 gap-3">
              {GENERAL_FIELDS.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <label className="text-xs text-text-secondary">
                    {f.label} <span className="text-text-secondary/50">({f.unit})</span>
                  </label>
                  <input
                    type="number"
                    step={f.step}
                    min="0"
                    placeholder="—"
                    value={vals[f.name]}
                    onChange={(e) => set(f.name, e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Circunferências */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest pb-2 border-b border-surface-border">
              Circunferências (cm)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CIRCUM_FIELDS.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <label className="text-xs text-text-secondary">{f.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="—"
                    value={vals[f.name]}
                    onChange={(e) => set(f.name, e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Observações
            </label>
            <textarea
              rows={3}
              placeholder="Observações gerais..."
              value={vals.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-3 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-brand-lime text-background text-sm font-display font-bold uppercase tracking-widest hover:bg-brand-lime/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending
                ? <><Loader2 size={14} className="animate-spin" /> Salvando…</>
                : <><Save size={14} /> Salvar</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Card de avaliação (leitura) ──────────────────────────────────────────────

export function AssessmentHistoryCard({ assessment }: { assessment: Assessment }) {
  const [expanded, setExpanded] = useState(false)

  const fmt = (v: number | null, suffix = '') => v !== null ? `${v}${suffix}` : '—'

  const hasMeasurements =
    assessment.arm !== null || assessment.chest !== null ||
    assessment.waist !== null || assessment.hip !== null || assessment.thigh !== null

  return (
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-body font-semibold text-sm text-text-primary">
            {new Date(assessment.assessed_at + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {assessment.weight !== null && (
              <span className="text-sm font-medium text-brand-lime">{assessment.weight} kg</span>
            )}
            {assessment.height !== null && (
              <span className="text-xs text-text-secondary">{assessment.height} cm</span>
            )}
            {assessment.body_fat !== null && (
              <span className="text-xs text-text-secondary">{assessment.body_fat}% gordura</span>
            )}
          </div>
        </div>
        {(hasMeasurements || assessment.notes) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Menos' : 'Detalhes'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-surface-border px-5 py-4 space-y-4">
          {hasMeasurements && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
                Circunferências
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Braço',    value: fmt(assessment.arm,   ' cm') },
                  { label: 'Peitoral', value: fmt(assessment.chest, ' cm') },
                  { label: 'Cintura',  value: fmt(assessment.waist, ' cm') },
                  { label: 'Quadril',  value: fmt(assessment.hip,   ' cm') },
                  { label: 'Coxa',     value: fmt(assessment.thigh, ' cm') },
                ].map((m) => (
                  <div key={m.label} className="bg-background rounded-xl p-3 text-center">
                    <p className="text-xs text-text-secondary mb-0.5">{m.label}</p>
                    <p className="text-sm font-medium text-text-primary">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {assessment.notes && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">
                Observações
              </p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{assessment.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
