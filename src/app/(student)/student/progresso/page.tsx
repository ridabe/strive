import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'
import { NewProgressForm, ProgressEntryCard, type ProgressEntry } from './progress-form'

export default async function ProgressoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!student) redirect('/student')

  const { data: entries } = await supabase
    .from('student_progress')
    .select('id, recorded_at, weight, notes, photo_urls, created_at')
    .eq('student_id', student.id)
    .order('recorded_at', { ascending: false })

  const list = (entries ?? []) as ProgressEntry[]

  const withWeight = list.filter((e) => e.weight !== null)
  const weightDelta =
    withWeight.length > 1
      ? +(withWeight[0].weight! - withWeight[withWeight.length - 1].weight!).toFixed(1)
      : null

  const totalPhotos = list.reduce((acc, e) => acc + e.photo_urls.length, 0)

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Meu Progresso
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Registre peso, fotos e notas. Visível para seu personal.
          </p>
        </div>
      </div>

      {/* Stats */}
      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <p className="text-2xl font-display font-bold text-text-primary">{list.length}</p>
            <p className="text-xs text-text-secondary mt-0.5">registro{list.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <p className={`text-2xl font-display font-bold ${
              weightDelta === null ? 'text-text-secondary'
              : weightDelta <= 0 ? 'text-status-success'
              : 'text-status-warning'
            }`}>
              {weightDelta !== null
                ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`
                : list[0]?.weight !== null && list[0]?.weight !== undefined
                  ? `${list[0].weight} kg`
                  : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {weightDelta !== null ? 'variação total' : 'peso atual'}
            </p>
          </div>
          <div className="bg-surface border border-surface-border rounded-2xl p-4">
            <p className="text-2xl font-display font-bold text-text-primary">{totalPhotos}</p>
            <p className="text-xs text-text-secondary mt-0.5">foto{totalPhotos !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Botão / Form */}
      <NewProgressForm />

      {/* Histórico */}
      {list.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Histórico ({list.length})
          </p>
          {list.map((entry) => (
            <ProgressEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-2xl p-10 text-center">
          <TrendingUp size={32} className="text-text-secondary/30 mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Nenhum registro ainda.</p>
          <p className="text-xs text-text-secondary/60 mt-1">
            Clique em &quot;Novo Registro&quot; para começar a acompanhar sua evolução.
          </p>
        </div>
      )}
    </div>
  )
}
