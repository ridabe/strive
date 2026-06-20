import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Video, Globe } from 'lucide-react'
import { muscleColor, loadEmoji, loadLabel, countLabel, MUSCLE_GROUPS } from '@/lib/exercise-config'
import { DeleteGlobalExerciseButton } from './delete-button'

interface SearchParams { q?: string; muscle?: string }
interface Props { searchParams: Promise<SearchParams> }

export default async function AdminBancoExerciciosPage({ searchParams }: Props) {
  const { q, muscle } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('exercises')
    .select('id, name, muscle_group, secondary_muscles, load_type, count_type, video_url, video_path, default_sets, default_reps, default_duration_secs, created_at')
    .eq('is_global', true)
    .order('name')
    .limit(300)

  if (q)      query = query.ilike('name', `%${q}%`)
  if (muscle) query = query.eq('muscle_group', muscle)

  const { data: exercises } = await query
  const total = exercises?.length ?? 0

  const byMuscle = MUSCLE_GROUPS.map(g => ({
    group: g,
    count: exercises?.filter(e => e.muscle_group === g).length ?? 0,
  })).filter(g => g.count > 0)

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Banco de Exercícios
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {total} exercício{total !== 1 ? 's' : ''} globais — disponíveis para todos os tenants
          </p>
        </div>
        <Link
          href="/admin/banco-de-exercicios/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-status-error text-white text-sm font-medium font-body hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={15} />
          Novo exercício global
        </Link>
      </div>

      {/* Stats por grupo muscular */}
      {byMuscle.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {byMuscle.map(({ group, count }) => (
            <Link
              key={group}
              href={muscle === group ? '/admin/banco-de-exercicios' : `?muscle=${encodeURIComponent(group)}`}
              className={`p-3 rounded-xl border text-center transition-colors ${
                muscle === group
                  ? 'bg-brand-lime/10 border-brand-lime/20'
                  : 'bg-surface border-surface-border hover:border-brand-lime/30'
              }`}
            >
              <p className="font-display font-bold text-xl text-text-primary">{count}</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-tight">{group}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Busca + filtro grupo */}
      <div className="flex flex-wrap gap-3 items-center">
        <form method="GET" className="relative">
          {muscle && <input type="hidden" name="muscle" value={muscle} />}
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar exercício..."
            className="bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime transition-colors w-60"
          />
        </form>

        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map(g => {
            const active = muscle === g
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (!active) params.set('muscle', g)
            return (
              <Link
                key={g}
                href={params.toString() ? `?${params}` : '/admin/banco-de-exercicios'}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                  active
                    ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/20'
                    : 'bg-surface text-text-secondary border-surface-border hover:text-text-primary'
                }`}
              >
                {g}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tabela */}
      {!exercises || exercises.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <Globe size={36} className="text-text-secondary/30 mx-auto" />
          <p className="font-body font-medium text-text-primary">
            {q || muscle ? 'Nenhum exercício com esse filtro' : 'Nenhum exercício global cadastrado ainda'}
          </p>
          <Link
            href="/admin/banco-de-exercicios/novo"
            className="inline-flex items-center gap-1.5 text-sm text-brand-lime hover:underline"
          >
            <Plus size={13} /> Criar primeiro exercício do sistema
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Exercício</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Grupo</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden lg:table-cell">Carga</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden lg:table-cell">Contagem</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden sm:table-cell">Padrão</th>
                <th className="px-4 py-3 text-xs text-text-secondary font-body font-medium">Vídeo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {exercises.map(ex => (
                <tr key={ex.id} className="hover:bg-surface-border/10 group">
                  <td className="px-5 py-3.5">
                    <p className="text-text-primary font-medium">{ex.name}</p>
                    {ex.secondary_muscles?.length > 0 && (
                      <p className="text-xs text-text-secondary/60 hidden sm:block">
                        +{ex.secondary_muscles.join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${muscleColor(ex.muscle_group)}`}>
                      {ex.muscle_group}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-text-secondary text-xs hidden lg:table-cell">
                    {loadEmoji(ex.load_type)} {loadLabel(ex.load_type)}
                  </td>
                  <td className="px-4 py-3.5 text-text-secondary text-xs hidden lg:table-cell">
                    {countLabel(ex.count_type)}
                  </td>
                  <td className="px-4 py-3.5 text-text-secondary text-xs hidden sm:table-cell">
                    {[
                      ex.default_sets           ? `${ex.default_sets}×`              : null,
                      ex.default_reps           ? `${ex.default_reps} reps`           : null,
                      ex.default_duration_secs  ? `${ex.default_duration_secs}s`      : null,
                    ].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {ex.video_url
                      ? <a href={ex.video_url} target="_blank" rel="noopener noreferrer">
                          <Video size={15} className="text-brand-lime hover:opacity-80" />
                        </a>
                      : <span className="text-text-secondary/30">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/banco-de-exercicios/${ex.id}`}
                        className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Editar
                      </Link>
                      <DeleteGlobalExerciseButton id={ex.id} videoPath={ex.video_path} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
