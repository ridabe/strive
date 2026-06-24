import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Globe, Lock } from 'lucide-react'
import { muscleColor, loadEmoji, loadLabel, countLabel } from '@/lib/exercise-config'
import { ExerciseForm } from '@/components/exercises/exercise-form'

interface Props { params: Promise<{ id: string }> }

export default async function ExercicioPage({ params }: Props) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const { data: ex } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (!ex) notFound()

  const canEdit = !ex.is_global && ex.tenant_id === profile?.tenant_id

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/banco-de-exercicios" className="hover:text-text-primary transition-colors">
          Banco de Exercícios
        </Link>
        <span>/</span>
        <span className="text-text-primary">{ex.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {ex.is_global
              ? <span className="flex items-center gap-1 text-xs text-brand-lime"><Globe size={12} /> Global</span>
              : <span className="flex items-center gap-1 text-xs text-purple-400"><Lock size={12} /> Meu exercício</span>
            }
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${muscleColor(ex.muscle_group)}`}>
              {ex.muscle_group}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            {ex.name}
          </h1>
        </div>
      </div>

      {/* Mídia demonstrativa */}
      {ex.video_url && (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          {ex.video_url.toLowerCase().includes('.gif') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ex.video_url} alt={ex.name} className="w-full max-h-72 object-contain" />
          ) : (
            <video src={ex.video_url} controls preload="metadata"
              className="w-full max-h-72 object-contain bg-black" />
          )}
        </div>
      )}

      {/* Info rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Carga',     value: `${loadEmoji(ex.load_type)} ${loadLabel(ex.load_type)}` },
          { label: 'Contagem',  value: countLabel(ex.count_type) },
          { label: 'Séries',    value: ex.default_sets ? `${ex.default_sets}×` : '—' },
          {
            label: 'Reps / Tempo',
            value: [
              ex.default_reps             ? `${ex.default_reps} reps` : null,
              ex.default_duration_secs    ? `${ex.default_duration_secs}s` : null,
            ].filter(Boolean).join(' · ') || '—',
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-surface-border rounded-xl p-3">
            <p className="text-xs text-text-secondary">{label}</p>
            <p className="text-sm font-medium text-text-primary mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Músculos secundários */}
      {ex.secondary_muscles?.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">Músculos secundários</p>
          <div className="flex flex-wrap gap-2">
            {ex.secondary_muscles.map((m: string) => (
              <span key={m} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${muscleColor(m)}`}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Instruções */}
      {ex.instructions && (
        <div className="bg-surface border border-surface-border rounded-xl p-5">
          <p className="text-xs text-text-secondary uppercase tracking-widest font-medium mb-3">Instruções</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{ex.instructions}</p>
        </div>
      )}

      {/* Formulário de edição (só para exercícios próprios) */}
      {canEdit && (
        <div className="pt-4 border-t border-surface-border">
          <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-5">
            Editar exercício
          </h2>
          <ExerciseForm
            isGlobal={false}
            tenantId={ex.tenant_id ?? undefined}
            exercise={ex}
            redirectTo="/dashboard/banco-de-exercicios"
          />
        </div>
      )}

      {!ex.is_global && !canEdit && (
        <p className="text-sm text-text-secondary">Você não tem permissão para editar este exercício.</p>
      )}
    </div>
  )
}
