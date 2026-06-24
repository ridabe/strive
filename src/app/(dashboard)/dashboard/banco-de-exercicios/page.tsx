import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Dumbbell, Globe, Lock } from 'lucide-react'
import { muscleColor, loadEmoji, loadLabel, countLabel, MUSCLE_GROUPS } from '@/lib/exercise-config'
import { DeleteExerciseButton } from './delete-button'
import { VideoPreviewButton } from '@/components/exercises/VideoPreviewButton'
import { PaginationBar } from '@/components/ui/PaginationBar'

const PAGE_SIZE = 30

interface SearchParams { q?: string; muscle?: string; scope?: string; page?: string }
interface Props { searchParams: Promise<SearchParams> }

export default async function BancoDeExerciciosPage({ searchParams }: Props) {
  const { q, muscle, scope, page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1') || 1)
  const supabase = await createClient()

  const from = (pageNum - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('exercises')
    .select('id, name, muscle_group, secondary_muscles, load_type, count_type, video_url, is_global, default_sets, default_reps, default_duration_secs', { count: 'exact' })
    .order('is_global', { ascending: false })
    .order('name')
    .range(from, to)

  if (q)      query = query.ilike('name', `%${q}%`)
  if (muscle) query = query.eq('muscle_group', muscle)
  if (scope === 'global') query = query.eq('is_global', true)
  if (scope === 'mine')   query = query.eq('is_global', false)

  const { data: exercises, count: total } = await query

  // Global total counts for header (unfiltered by current page)
  const { data: allStats } = await supabase
    .from('exercises')
    .select('is_global')
  const globals = allStats?.filter(e => e.is_global).length ?? 0
  const custom  = (allStats?.length ?? 0) - globals

  const totalCount = total ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (q)      params.set('q', q)
    if (muscle) params.set('muscle', muscle)
    if (scope)  params.set('scope', scope)
    if (p > 1)  params.set('page', String(p))
    const s = params.toString()
    return s ? `?${s}` : '/dashboard/banco-de-exercicios'
  }

  const scopeBase = (s: string) => {
    const p = new URLSearchParams()
    if (q)      p.set('q', q)
    if (muscle) p.set('muscle', muscle)
    if (s !== 'all') p.set('scope', s)
    const str = p.toString()
    return str ? `?${str}` : '/dashboard/banco-de-exercicios'
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Banco de Exercícios
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {globals} globais · {custom} personalizados
          </p>
        </div>
        <Link
          href="/dashboard/banco-de-exercicios/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-lime text-background text-sm font-medium font-body hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={15} />
          Novo exercício
        </Link>
      </div>

      {/* Busca + filtros */}
      <div className="space-y-3">
        <form method="GET" className="relative">
          {muscle && <input type="hidden" name="muscle" value={muscle} />}
          {scope  && <input type="hidden" name="scope"  value={scope}  />}
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar exercício..."
            className="w-full max-w-sm bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime transition-colors"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          {/* Scope */}
          {(['all', 'global', 'mine'] as const).map(s => (
            <Link
              key={s}
              href={scopeBase(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors border ${
                (s === 'all' && !scope) || scope === s
                  ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/20'
                  : 'bg-surface text-text-secondary border-surface-border hover:text-text-primary'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'global' ? '🌐 Globais' : '🔒 Meus'}
            </Link>
          ))}

          <div className="w-px bg-surface-border mx-1" />

          {/* Grupos musculares */}
          {MUSCLE_GROUPS.map(g => {
            const active = muscle === g
            const base   = new URLSearchParams()
            if (q)     base.set('q', q)
            if (scope) base.set('scope', scope)
            if (!active) base.set('muscle', g)
            const href = base.toString() ? `?${base}` : '/dashboard/banco-de-exercicios'
            return (
              <Link
                key={g}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors border ${
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

      {/* Lista */}
      {!exercises || exercises.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <Dumbbell size={22} className="text-brand-lime" />
          </div>
          <p className="font-body font-medium text-text-primary">
            {q || muscle || scope ? 'Nenhum exercício encontrado com esse filtro' : 'Banco vazio'}
          </p>
          <p className="text-sm text-text-secondary">
            {!q && !muscle && !scope && 'Crie seu primeiro exercício ou aguarde os exercícios Padrão do sistema.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs text-text-secondary font-body font-medium">Exercício</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-body font-medium hidden md:table-cell">Grupo muscular</th>
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
                    <div className="flex items-center gap-2.5">
                      {ex.video_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ex.video_url} alt="" loading="lazy"
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-border/50 flex items-center justify-center flex-shrink-0">
                          <Dumbbell size={14} className="text-text-secondary/30" />
                        </div>
                      )}
                      {ex.is_global
                        ? <Globe size={13} className="text-brand-lime flex-shrink-0" />
                        : <Lock  size={13} className="text-purple-400 flex-shrink-0" />
                      }
                      <div>
                        <p className="text-text-primary font-medium">{ex.name}</p>
                        {ex.secondary_muscles?.length > 0 && (
                          <p className="text-xs text-text-secondary/60 hidden sm:block">
                            +{ex.secondary_muscles.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${muscleColor(ex.muscle_group)}`}>
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
                    {ex.default_sets ? `${ex.default_sets}×` : '—'}
                    {ex.default_reps ? ` ${ex.default_reps} reps` : ''}
                    {ex.default_duration_secs ? ` ${ex.default_duration_secs}s` : ''}
                    {!ex.default_sets && !ex.default_reps && !ex.default_duration_secs ? '—' : ''}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {ex.video_url
                      ? <VideoPreviewButton url={ex.video_url} name={ex.name} />
                      : <span className="text-text-secondary/30">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!ex.is_global && (
                        <>
                          <Link
                            href={`/dashboard/banco-de-exercicios/${ex.id}`}
                            className="text-xs text-text-secondary hover:text-brand-lime transition-colors"
                          >
                            Editar
                          </Link>
                          <DeleteExerciseButton id={ex.id} videoPath={ex.video_url ? undefined : undefined} />
                        </>
                      )}
                      {ex.is_global && (
                        <Link
                          href={`/dashboard/banco-de-exercicios/${ex.id}`}
                          className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                        >
                          Ver
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <PaginationBar
            page={pageNum}
            totalPages={totalPages}
            total={totalCount}
            pageSize={PAGE_SIZE}
            prevUrl={pageNum > 1 ? buildUrl(pageNum - 1) : null}
            nextUrl={pageNum < totalPages ? buildUrl(pageNum + 1) : null}
          />
        </div>
      )}
    </div>
  )
}
