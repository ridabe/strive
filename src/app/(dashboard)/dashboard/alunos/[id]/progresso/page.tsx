import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, ImageIcon, StickyNote } from 'lucide-react'
import Image from 'next/image'

interface Props {
  params: Promise<{ id: string }>
}

interface ProgressEntry {
  id: string
  recorded_at: string
  weight: number | null
  notes: string | null
  photo_urls: string[]
}

export default async function AlunoProgressoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('full_name, status')
    .eq('id', id)
    .single()

  if (!student) notFound()

  const { data: entries } = await supabase
    .from('student_progress')
    .select('id, recorded_at, weight, notes, photo_urls')
    .eq('student_id', id)
    .order('recorded_at', { ascending: false })

  const list = (entries ?? []) as ProgressEntry[]

  const withWeight = list.filter((e) => e.weight !== null)
  const weightDelta =
    withWeight.length > 1
      ? +(withWeight[0].weight! - withWeight[withWeight.length - 1].weight!).toFixed(1)
      : null

  const totalPhotos = list.reduce((acc, e) => acc + e.photo_urls.length, 0)

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/dashboard/alunos" className="hover:text-text-primary transition-colors">Alunos</Link>
        <span>/</span>
        <Link href={`/dashboard/alunos/${id}`} className="hover:text-text-primary transition-colors">
          {student.full_name}
        </Link>
        <span>/</span>
        <span className="text-text-primary">Progresso</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Progresso
        </h1>
        <p className="text-text-secondary text-sm mt-1">{student.full_name}</p>
      </div>

      {/* Stats */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Registros',      value: list.length,    color: 'text-text-primary' },
            { label: 'Peso atual',
              value: withWeight[0]?.weight !== null && withWeight[0]?.weight !== undefined
                ? `${withWeight[0].weight} kg` : '—',
              color: 'text-brand-lime' },
            { label: 'Variação total',
              value: weightDelta !== null
                ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg` : '—',
              color: weightDelta === null ? 'text-text-secondary'
                : weightDelta <= 0 ? 'text-status-success' : 'text-status-warning' },
            { label: 'Fotos',          value: totalPhotos,    color: 'text-text-primary' },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-surface-border rounded-xl p-4">
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {list.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center mx-auto">
            <TrendingUp size={22} className="text-brand-lime" />
          </div>
          <p className="font-body font-medium text-text-primary">Nenhum registro ainda</p>
          <p className="text-sm text-text-secondary">O aluno ainda não registrou progresso.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
            Histórico ({list.length})
          </p>
          {list.map((entry) => (
            <ProgressEntryView key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Componente de exibição de uma entrada (Server) ───────────────────────────

function ProgressEntryView({ entry }: { entry: ProgressEntry }) {
  const hasContent = !!entry.notes || entry.photo_urls.length > 0

  return (
    <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Data */}
        <div className="flex-shrink-0 text-center bg-background border border-surface-border rounded-lg px-3 py-2 min-w-[52px]">
          <p className="text-[10px] text-text-secondary uppercase leading-none">
            {new Date(entry.recorded_at + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
          </p>
          <p className="font-display font-bold text-lg text-text-primary leading-tight">
            {new Date(entry.recorded_at + 'T12:00:00').getDate()}
          </p>
          <p className="text-[10px] text-text-secondary leading-none">
            {new Date(entry.recorded_at + 'T12:00:00').getFullYear()}
          </p>
        </div>

        {/* Info resumida */}
        <div className="flex-1 min-w-0">
          {entry.weight !== null && (
            <p className="font-body font-semibold text-text-primary">{entry.weight} kg</p>
          )}
          <div className="flex items-center gap-3 mt-0.5 text-xs text-text-secondary">
            {entry.notes && (
              <span className="flex items-center gap-1">
                <StickyNote size={11} />
                nota
              </span>
            )}
            {entry.photo_urls.length > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon size={11} />
                {entry.photo_urls.length} foto{entry.photo_urls.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fotos + notas */}
      {hasContent && (
        <div className="border-t border-surface-border px-5 py-4 space-y-4">
          {entry.photo_urls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {entry.photo_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-square rounded-lg overflow-hidden border border-surface-border hover:border-brand-lime/40 transition-colors"
                >
                  <Image
                    src={url}
                    alt={`Foto ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-200"
                    unoptimized
                  />
                </a>
              ))}
            </div>
          )}
          {entry.notes && (
            <p className="text-sm text-text-primary whitespace-pre-wrap">{entry.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
