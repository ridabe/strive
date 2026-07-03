'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { addExistingStudentAsParticipant, inviteNewParticipant } from '@/app/actions/challenges'

interface StudentOption {
  id: string
  full_name: string
  email: string | null
}

interface Props {
  challengeId: string
  availableStudents: StudentOption[]
}

type Mode = 'existing' | 'invite'

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null
  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
}

export function AddParticipantButton({ challengeId, availableStudents }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>(availableStudents.length > 0 ? 'existing' : 'invite')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleClose() {
    setOpen(false)
    setError('')
    formRef.current?.reset()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)

    const initialData = {
      initial_age: numOrNull(fd.get('initial_age')),
      initial_weight: numOrNull(fd.get('initial_weight')),
      initial_body_fat: numOrNull(fd.get('initial_body_fat')),
      initial_arm: numOrNull(fd.get('initial_arm')),
      initial_chest: numOrNull(fd.get('initial_chest')),
      initial_waist: numOrNull(fd.get('initial_waist')),
      initial_hip: numOrNull(fd.get('initial_hip')),
      initial_thigh: numOrNull(fd.get('initial_thigh')),
    }

    startTransition(async () => {
      const result = mode === 'existing'
        ? await addExistingStudentAsParticipant(challengeId, String(fd.get('student_id') ?? ''), initialData)
        : await inviteNewParticipant(
            challengeId,
            {
              full_name: String(fd.get('full_name') ?? ''),
              email: String(fd.get('email') ?? ''),
              phone: String(fd.get('phone') ?? '') || null,
              birth_date: String(fd.get('birth_date') ?? '') || null,
              goal: String(fd.get('goal') ?? '') || null,
            },
            initialData
          )

      if (result.error) { setError(result.error); return }
      handleClose()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity"
      >
        <Plus size={15} />
        Adicionar Participante
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-widest">
                Adicionar Participante
              </h2>
              <button onClick={handleClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'existing'
                    ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                    : 'bg-background border border-surface-border text-text-secondary'
                }`}
              >
                Aluno existente
              </button>
              <button
                type="button"
                onClick={() => setMode('invite')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  mode === 'invite'
                    ? 'bg-brand-lime/10 text-brand-lime border border-brand-lime/20'
                    : 'bg-background border border-surface-border text-text-secondary'
                }`}
              >
                Convidar novo
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {mode === 'existing' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                    Aluno
                  </label>
                  {availableStudents.length === 0 ? (
                    <p className="text-xs text-text-secondary">
                      Todos os alunos ativos já participam deste desafio.
                    </p>
                  ) : (
                    <select
                      name="student_id"
                      required
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                    >
                      <option value="">Selecione um aluno...</option>
                      {availableStudents.map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                      Nome completo
                    </label>
                    <input
                      name="full_name"
                      required
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                      E-mail
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                    />
                    <p className="text-[11px] text-text-secondary/60">
                      Receberá e-mail de boas-vindas com senha provisória, como um aluno normal.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                        Telefone
                      </label>
                      <input
                        name="phone"
                        className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-text-secondary uppercase tracking-widest">
                        Nascimento
                      </label>
                      <input
                        name="birth_date"
                        type="date"
                        className="w-full bg-background border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-surface-border space-y-3">
                <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
                  Dados iniciais
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">Idade</label>
                    <input name="initial_age" type="number" min={0}
                      className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">Peso (kg)</label>
                    <input name="initial_weight" type="number" step="0.1" min={0}
                      className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">% Gordura</label>
                    <input name="initial_body_fat" type="number" step="0.1" min={0}
                      className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors" />
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary/60">
                  Medidas abaixo são opcionais.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'initial_arm', label: 'Braço' },
                    { name: 'initial_chest', label: 'Peito' },
                    { name: 'initial_waist', label: 'Cintura' },
                    { name: 'initial_hip', label: 'Quadril' },
                    { name: 'initial_thigh', label: 'Coxa' },
                  ].map((f) => (
                    <div key={f.name} className="space-y-1">
                      <label className="text-[10px] text-text-secondary uppercase">{f.label}</label>
                      <input name={f.name} type="number" step="0.1" min={0}
                        className="w-full bg-background border border-surface-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-status-error">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || (mode === 'existing' && availableStudents.length === 0)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-lime text-background text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
