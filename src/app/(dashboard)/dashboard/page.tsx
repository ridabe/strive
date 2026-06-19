import { createClient } from '@/lib/supabase/server'
import { Users, Dumbbell, TrendingUp, DollarSign } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, tenant_id')
    .eq('id', user!.id)
    .single()

  // Contagens básicas do tenant
  const [{ count: studentCount }, { count: planCount }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('workout_plans').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Alunos ativos',   value: studentCount ?? 0, icon: Users,       color: 'text-brand-lime' },
    { label: 'Fichas de treino', value: planCount ?? 0,   icon: Dumbbell,    color: 'text-status-success' },
    { label: 'Avaliações',       value: 0,                icon: TrendingUp,  color: 'text-status-warning' },
    { label: 'Mensalidades',     value: 0,                icon: DollarSign,  color: 'text-status-error' },
  ]

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Personal'

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Olá, {firstName}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Aqui está um resumo da sua operação hoje.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-surface border border-surface-border rounded-xl p-5 space-y-3"
            >
              <div className={`${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="font-display font-bold text-3xl text-text-primary">
                  {stat.value}
                </div>
                <div className="text-text-secondary text-xs mt-0.5">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Placeholder próximas etapas */}
      <div className="bg-surface border border-surface-border rounded-xl p-6">
        <h2 className="font-body font-semibold text-text-primary mb-2">
          Próximos passos
        </h2>
        <p className="text-text-secondary text-sm">
          Módulos de alunos, treinos, avaliações e financeiro chegam nas próximas etapas.
        </p>
      </div>
    </div>
  )
}
