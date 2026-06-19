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
  users:  'Usuários',
  modules: 'Módulos',
}

const CATEGORY_COLORS: Record<string, string> = {
  auth:    'text-brand-lime    bg-brand-lime/10    border-brand-lime/20',
  tenant:  'text-status-warning bg-status-warning/10 border-status-warning/20',
  user:    'text-blue-400      bg-blue-400/10      border-blue-400/20',
  users:   'text-blue-400      bg-blue-400/10      border-blue-400/20',
  system:  'text-text-secondary bg-surface-border/30 border-surface-border',
  modules: 'text-purple-400    bg-purple-400/10    border-purple-400/20',
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

  const lastSignIn: string | null = Array.isArray(lastSignInRow)
    ? lastSignInRow[0]?.last_sign_in_at ?? null
    : (lastSignInRow as { last_sign_in_at: string } | null)?.last_sign_in_at ?? null

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Boas-vindas */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Bem-vindo, {profile?.full_name ?? profile?.email ?? 'Admin'}.
          {lastSignIn && (
            <span className="ml-1 text-text-secondary/60">
              Último acesso{' '}
              {formatDistanceToNow(new Date(lastSignIn), { addSuffix: true, locale: ptBR })}.
            </span>
          )}
        </p>
      </div>

      {/* Cards de perfil + métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminProfileCard
          name={profile?.full_name ?? null}
          email={profile?.email ?? ''}
        />

        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-surface border border-surface-border rounded-xl p-5 flex items-center gap-4 hover:border-brand-lime/30 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
              <s.icon size={22} className="text-brand-lime" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-2xl font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            </div>
            <ArrowRight size={16} className="text-text-secondary/30 group-hover:text-brand-lime transition-colors" />
          </Link>
        ))}
      </div>

      {/* Atividade recente */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-text-secondary" />
            <h2 className="font-body font-semibold text-text-primary text-sm">Atividade recente</h2>
          </div>
          <Link
            href="/admin/logs"
            className="text-xs text-text-secondary hover:text-brand-lime transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {(!recentLogs || recentLogs.length === 0) ? (
          <p className="text-center text-text-secondary text-sm py-10">
            Nenhuma ação registrada ainda.
          </p>
        ) : (
          <div className="divide-y divide-surface-border">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${
                  CATEGORY_COLORS[log.category as keyof typeof CATEGORY_COLORS] ?? CATEGORY_COLORS.system
                }`}>
                  {CATEGORY_LABELS[log.category as keyof typeof CATEGORY_LABELS] ?? log.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{log.description}</p>
                  <p className="text-xs text-text-secondary/60 mt-0.5">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
