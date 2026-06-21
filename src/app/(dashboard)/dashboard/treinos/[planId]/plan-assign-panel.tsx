'use client'

import { useState, useTransition } from 'react'
import { Users, UserPlus, X, ChevronDown, ChevronUp, UserCheck } from 'lucide-react'
import { assignPlanToStudents, assignPlanToAllStudents, removePlanAssignment } from '@/actions/plan-assignments'
import { joinOne } from '@/lib/supabase/join'

type Student = { id: string; full_name: string; avatar_url: string | null }
type Assignment = { student_id: string; students: unknown }

type Props = {
  planId:      string
  allStudents: Student[]
  assignments: Assignment[]
}

export function PlanAssignPanel({ planId, allStudents, assignments }: Props) {
  const [isPending, startTransition] = useTransition()
  const [open,       setOpen]        = useState(false)
  const [selected,   setSelected]    = useState<string[]>([])
  const [error,      setError]       = useState('')

  const assignedIds = new Set(assignments.map((a) => a.student_id))
  const unassigned  = allStudents.filter((s) => !assignedIds.has(s.id))

  function toggleStudent(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleAssign() {
    if (selected.length === 0) { setError('Selecione ao menos um aluno'); return }
    setError('')
    startTransition(async () => {
      const result = await assignPlanToStudents(planId, selected)
      if ('error' in result && result.error) { setError(result.error); return }
      setSelected([])
      setOpen(false)
    })
  }

  function handleAssignAll() {
    setError('')
    startTransition(async () => {
      const result = await assignPlanToAllStudents(planId)
      if ('error' in result && result.error) { setError(result.error); return }
      setOpen(false)
    })
  }

  function handleRemove(studentId: string) {
    startTransition(async () => {
      await removePlanAssignment(planId, studentId)
    })
  }

  return (
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-border/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
          <Users size={14} className="text-blue-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-text-primary">Atribuição de Alunos</p>
          <p className="text-xs text-text-secondary">
            {assignedIds.size} aluno{assignedIds.size !== 1 ? 's' : ''} com este plano
          </p>
        </div>
        {open ? <ChevronUp size={14} className="text-text-secondary" /> : <ChevronDown size={14} className="text-text-secondary" />}
      </button>

      {open && (
        <div className="border-t border-surface-border p-5 space-y-4">
          {/* Alunos já atribuídos */}
          {assignments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Com este plano</p>
              {assignments.map((a) => {
                const student = joinOne<{ full_name: string }>(a.students)
                return (
                  <div key={a.student_id} className="flex items-center gap-3 bg-background border border-surface-border rounded-xl px-3 py-2.5">
                    <UserCheck size={14} className="text-status-success flex-shrink-0" />
                    <span className="flex-1 text-sm text-text-primary">{student?.full_name ?? a.student_id}</span>
                    <button
                      onClick={() => handleRemove(a.student_id)}
                      disabled={isPending}
                      className="p-1 rounded-md text-text-secondary/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Remover atribuição"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Adicionar alunos */}
          {unassigned.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Adicionar alunos</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {unassigned.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selected.includes(s.id)
                        ? 'border-brand-lime bg-brand-lime/10 text-brand-lime'
                        : 'border-surface-border text-text-secondary hover:border-surface-border/60 hover:text-text-primary'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 transition-colors ${
                      selected.includes(s.id)
                        ? 'bg-brand-lime border-brand-lime'
                        : 'border-surface-border'
                    }`} />
                    <span className="text-sm">{s.full_name}</span>
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAssign}
                  disabled={isPending || selected.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-lime text-background font-semibold text-sm rounded-xl hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  Atribuir {selected.length > 0 ? `(${selected.length})` : ''}
                </button>
                <button
                  onClick={handleAssignAll}
                  disabled={isPending}
                  className="px-4 py-2.5 border border-surface-border text-text-secondary text-sm rounded-xl hover:text-text-primary hover:border-surface-border/60 transition-colors disabled:opacity-50"
                  title="Atribuir a todos os alunos ativos"
                >
                  Todos
                </button>
              </div>
            </div>
          )}

          {unassigned.length === 0 && assignments.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">
              Nenhum aluno ativo no tenant.
            </p>
          )}
          {unassigned.length === 0 && assignments.length > 0 && (
            <p className="text-xs text-text-secondary text-center">
              Todos os alunos já têm este plano atribuído.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
