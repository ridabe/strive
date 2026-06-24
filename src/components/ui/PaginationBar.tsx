import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  total: number
  pageSize: number
  prevUrl: string | null
  nextUrl: string | null
}

export function PaginationBar({ page, totalPages, total, pageSize, prevUrl, nextUrl }: Props) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  const btnBase = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors border'
  const btnActive = `${btnBase} bg-surface border-surface-border text-text-secondary hover:text-text-primary`
  const btnDisabled = `${btnBase} border-transparent text-text-secondary/30 cursor-not-allowed`

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
      <p className="text-xs text-text-secondary">
        {from}–{to} de {total} exercício{total !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2">
        {prevUrl ? (
          <Link href={prevUrl} className={btnActive}>
            <ChevronLeft size={13} /> Anterior
          </Link>
        ) : (
          <span className={btnDisabled}>
            <ChevronLeft size={13} /> Anterior
          </span>
        )}
        <span className="text-xs text-text-secondary font-medium px-1">
          {page} / {totalPages}
        </span>
        {nextUrl ? (
          <Link href={nextUrl} className={btnActive}>
            Próxima <ChevronRight size={13} />
          </Link>
        ) : (
          <span className={btnDisabled}>
            Próxima <ChevronRight size={13} />
          </span>
        )}
      </div>
    </div>
  )
}
