import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminProfileCard } from '@/components/admin/admin-profile-card'
import { Building2, Users, Activity, FileText, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORY_LABELS: Record<string, string> = {
  auth:   'Autenticação',
  tenant: 'Tenant',
  user:   'Usuário',
  system: 'Sistema',
}

const CATEGORY_COLORS: Record<string, string> = {
  auth:   'text-brand-lime   bg-brand-lime/10   border-brand-lime/20',
  tenant: 'text-status-warning bg-status-warning/10 border-status-warning/20',
  user:   'text-blue-400      bg-blue-400/10     border-blue-400/20',
  system: 'text-text-secondary bg-surface-border/30 border-surface-border',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Perfil do admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user!.id)
    .single()

  // Último login via função SQL
  const { data: lastSignInRow } = await supabase
    .rpc('get_admin_last_sign_in', { p_user_id: user!.id })

  // Contagens gerais da plataforma
  const [
    { count: tenantCount },
    { count: profileCount },
    { count: totalActions },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('admin_audit_logs').select('*', { count: 'exact', head: true }),
  ])

  // Logs recentes (5 últimas ações)
  const { data: recentLogs } = await supabase
    .from('admin_audit_logs')
    .select('id, action, category, description, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Clientes ativos', value: tenantCount ?? 0,  icon: Building2, href: '/admin/clientes' },
    { label: 'Usuários totais', value: profileCount ?? 0, icon: Users,     href: '/admin/usuarios' },
    { label: 'Ações auditadas', value: totalActions ?? 0, icon: Activity,  href: '/admin/logs' },
  ]

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Título */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Painel Admin
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Visão geral de toda a plataforma Strive Personal.
        </p>
      </div>

      {/* Card do admin logado */}
      <AdminProfileCard
        fullName={profile?.full_name ?? null}
        email={profile?.email ?? user!.email!}
        lastSignIn={lastSignInRow as string | null}
        totalActions={totalActions ?? 0}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group bg-surface border border-surface-border rounded-xl p-5 hover:border-status-error/30 transition-all space-y-3"
            >
              <Icon size={20} className="text-status-error" />
              <div>
                <div className="font-display font-bold text-3xl text-text-primary">
                  {stat.value}
                </div>
                <div className="text-text-secondary text-xs mt-0.5 flex items-center gap-1">
                  {stat.label}
                  <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Últimas ações */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-text-secondary" />
            <h2 className="font-body font-semibold text-text-primary text-sm">
              Últimas ações registradas
            </h2>
          </div>
          <Link
            href="/admin/logs"
            className="text-xs text-brand-lime hover:text-brand-dark transition-colors flex items-center gap-1"
          >
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        {!recentLogs || recentLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-text-secondary text-sm">
            Nenhuma ação registrada ainda.
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-4 px-6 py-4">
                {/* Badge categoria */}
                <span
                  className={`mt-0.5 inline-flex items-center text-xs font-body font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    CATEGORY_COLORS[log.category] ?? CATEGORY_COLORS.system
                  }`}
                >
                  {CATEGORY_LABELS[log.category] ?? log.category}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-body">
                    {log.description}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>

                <span className="text-xs font-mono text-text-secondary/60 flex-shrink-0 mt-0.5">
                  {log.action}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
