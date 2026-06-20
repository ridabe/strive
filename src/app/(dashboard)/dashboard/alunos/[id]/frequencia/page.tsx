import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarCheck, Flame, TrendingUp, Trophy } from 'lucide-react'
import {
  AttendanceCalendar,
  RegisterAttendanceForm,
  type AttendanceRecord,
} from './attendance-client'

interface Props {
  params: Promise<{ id: string }>
}

// ─── Utilidade: streak ────────────────────────────────────────────────────────
function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) /
      86_400_000,
  )
}

function computeStreaks(sorted: string[]): { current: number; best: number } {
  if (!sorted.length) return { current: 0, best: 0 }

  let best = 1, run = 1
  for (let i = 1; i < sorted.length; i++) {
    const d = daysBetween(sorted[i - 1], sorted[i])
    if (d === 1) { run++; if (run > best) best = run }
    else if (d > 1) run = 1
  }

  const today = new Date().toISOString().split('T')[0]
  const last  = sorted[sorted.length - 1]
  if (daysBetween(last, today) > 1) return { current: 0, best }

  let current = 1
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (daysBetween(sorted[i], sorted[i + 1]) === 1) current++
    else break
  }
  return { current, best }
}

export default async function StudentFrequenciaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('full_name, status')
    .eq('id', id)
    .single()

  if (!student) notFound()

  const { data: rows } = await supabase
    .from('attendance')
    .select('id, attended_at, notes')
    .eq('student_id', id)
    .order('attended_at', { ascending: true })

  // Normaliza para YYYY-MM-DD e desduplicata
  const seen = new Set<string>()
  const records: AttendanceRecord[] = []
  for (const r of rows ?? []) {
    const date = r.attended_at.substring(0, 10)
    if (seen.has(date)) continue
    seen.add(date)
    records.push({ id: r.id, date, notes: r.notes })
  }

  const sorted = records.map(r => r.date).sort()
  const { current, best } = computeStreaks(sorted)

  const thisMonth  = new Date().toISOString().slice(0, 7)
  const lastMonth  = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()

  const thisMonthCount = sorted.filter(d => d.startsWith(thisMonth)).length
  const lastMonthCount = sorted.filter(d => d.startsWith(lastMonth)).length
  const total          = sorted.length

  // Assiduidade: % de dias com treino nos últimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const since30 = thirtyDaysAgo.toISOString().split('T')[0]
  const last30Count = sorted.filter(d => d >= since30).length
  const assiduity = Math.round((last30Count / 30) * 100)

  // Últimas sessões para o histórico
  const recent = [...records].reverse().slice(0, 10)

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/alunos" className="hover:text-text-primary transition-colors">
          Alunos
        </Link>
        <span>/</span>
        <Link href={`/dashboard/alunos/${id}`} className="hover:text-text-primary transition-colors">
          {student.full_name}
        </Link>
        <span>/</span>
        <span className="text-text-primary">Frequência</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Frequência
          </h1>
          <p className="text-text-secondary text-sm mt-1">{student.full_name}</p>
        </div>
        <RegisterAttendanceForm studentId={id} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: CalendarCheck,
            label: 'Total de treinos',
            value: total,
            color: 'text-text-primary',
            iconColor: 'text-brand-lime bg-brand-lime/10 border-brand-lime/20',
          },
          {
            icon: TrendingUp,
            label: 'Este mês',
            value: `${thisMonthCount} (↑${lastMonthCount} mês ant.)`,
            color: 'text-brand-lime',
            iconColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
          },
          {
            icon: Flame,
            label: 'Streak atual',
            value: `${current} dia${current !== 1 ? 's' : ''}`,
            color: current > 0 ? 'text-orange-400' : 'text-text-secondary',
            iconColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
          },
          {
            icon: Trophy,
            label: 'Melhor streak',
            value: `${best} dia${best !== 1 ? 's' : ''}`,
            color: 'text-yellow-400',
            iconColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
          },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="bg-surface border border-surface-border rounded-xl p-4 space-y-2"
            >
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${s.iconColor}`}>
                <Icon size={15} />
              </div>
              <div>
                <p className={`font-display font-bold text-xl leading-tight ${s.color}`}>
                  {total === 0 && s.icon !== CalendarCheck ? '—' : s.value}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Assiduidade 30 dias */}
      {total > 0 && (
        <div className="bg-surface border border-surface-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
              Assiduidade — últimos 30 dias
            </p>
            <span className={`text-sm font-display font-bold ${
              assiduity >= 60 ? 'text-status-success' :
              assiduity >= 30 ? 'text-status-warning'  :
              'text-status-error'
            }`}>
              {assiduity}%
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                assiduity >= 60 ? 'bg-status-success' :
                assiduity >= 30 ? 'bg-status-warning'  :
                'bg-status-error'
              }`}
              style={{ width: `${Math.min(assiduity, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {last30Count} treino{last30Count !== 1 ? 's' : ''} nos últimos 30 dias
          </p>
        </div>
      )}

      {/* Calendário */}
      <section className="space-y-2">
        <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
          Calendário de treinos
        </h2>
        <AttendanceCalendar records={records} studentId={id} />
      </section>

      {/* Histórico recente */}
      {recent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
            Sessões recentes
          </h2>
          <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
            {recent.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                  i !== 0 ? 'border-t border-surface-border' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-lime flex-shrink-0" />
                  <span className="text-text-primary">
                    {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                {r.notes && (
                  <span className="text-xs text-text-secondary truncate max-w-[160px]">
                    {r.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="bg-surface border border-surface-border rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <CalendarCheck size={22} className="text-brand-lime" />
          </div>
          <p className="font-body font-medium text-text-primary">
            Nenhum treino registrado ainda
          </p>
          <p className="text-sm text-text-secondary">
            Clique em &quot;Registrar Treino&quot; ou em um dia no calendário para começar.
          </p>
        </div>
      )}
    </div>
  )
}
