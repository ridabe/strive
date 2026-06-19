import { ShieldCheck, Mail, Clock, Activity } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AdminProfileCardProps {
  fullName: string | null
  email: string
  lastSignIn: string | null
  totalActions: number
}

export function AdminProfileCard({
  fullName,
  email,
  lastSignIn,
  totalActions,
}: AdminProfileCardProps) {
  const lastSignInDate = lastSignIn ? new Date(lastSignIn) : null

  return (
    <div className="bg-surface border border-status-error/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={26} className="text-status-error" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-body font-semibold text-text-primary text-lg leading-tight">
              {fullName ?? 'Admin Global'}
            </h2>
            <span className="inline-flex items-center gap-1 bg-status-error/10 border border-status-error/20 text-status-error text-xs font-body font-semibold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
              Admin Global
            </span>
          </div>

          {/* Info fields */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Mail size={14} className="flex-shrink-0 text-text-secondary/60" />
              <span className="truncate">{email}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock size={14} className="flex-shrink-0 text-text-secondary/60" />
              {lastSignInDate ? (
                <span title={format(lastSignInDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}>
                  Último acesso{' '}
                  <span className="text-text-primary font-medium">
                    {formatDistanceToNow(lastSignInDate, { addSuffix: true, locale: ptBR })}
                  </span>
                  {' '}
                  <span className="text-text-secondary/60">
                    ({format(lastSignInDate, "dd/MM/yyyy HH:mm", { locale: ptBR })})
                  </span>
                </span>
              ) : (
                <span>Primeiro acesso</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Activity size={14} className="flex-shrink-0 text-text-secondary/60" />
              <span>
                <span className="text-text-primary font-medium">{totalActions}</span>
                {' '}ações registradas no sistema
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
