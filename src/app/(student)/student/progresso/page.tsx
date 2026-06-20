import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'
import { NewProgressForm, ProgressEntryCard, type ProgressEntry } from './progress-form'

export default async function ProgressoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca o student vinculado ao usuário
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/student')

  const { data: entries } = await supabase
    .from('student_progress')
    .select('id, recorded_at, weight, notes, photo_urls, created_at')
    .eq('student_id', student.id)
    .order('recorded_at', { ascending: false })

  const list = (entries ?? []) as ProgressEntry[]

  // Stats: peso mais recente e mais antigo (para delta)
  const latest  = list[0]
  const withWeight = list.filter((e) => e.weight !== null)

  const weightDelta =
    withWeight.length > 1
      ? +(withWeight[0].weight! - withWeight[withWeight.length - 1].weight!).toFixed(1)
      : null

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Meu Progresso
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Registre seu peso, fotos e notas ao longo do tempo.
          </p>
        </div>
        <NewProgressForm />
      </div>

      {/* Stats */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-surface border border-surface-border rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-text-primary">
              {list.length}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              registro{list.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-4">
            <p className="font-display font-bold text-2xl text-brand-lime">
              {latest?.weight !== null && latest?.weight !== undefined
                ? `${latest.weight} kg`
                : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">peso atual</p>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-4">
            <p className={`font-display font-bold text-2xl ${
              weightDelta === null
                ? 'text-text-secondary'
                : weightDelta <= 0
                ? 'text-status-success'
                : 'text-status-warning'
            }`}>
              {weightDelta !== null
                ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`
                : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">variação total</p>
          </div>
        </div>
      )}

      {/* Lista de registros */}
      {list.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <TrendingUp size={22} className="text-brand-lime" />
          </div>
          <div>
            <p className="font-body font-medium text-text-primary">
              Nenhum registro ainda
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Clique em &quot;Novo Registro&quot; para começar a acompanhar sua evolução.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-text-secondary" />
            <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
              Histórico ({list.length})
            </h2>
          </div>
          {list.map((entry) => (
            <ProgressEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
