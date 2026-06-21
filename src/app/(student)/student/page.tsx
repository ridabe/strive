import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Dumbbell, Zap, TrendingUp, CalendarCheck,
  ClipboardList, Activity, MessageSquare,
} from 'lucide-react'

export default async function StudentHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from('profiles').select('full_name, tenant_id').eq('id', user.id).single(),
    supabase.from('students').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Aluno'

  // Tenant + personal name
  let personalName: string | null = null
  let businessName = 'Strive Personal'

  if (profile?.tenant_id) {
    const [{ data: tenant }, { data: personal }] = await Promise.all([
      supabase.from('tenants').select('business_name').eq('id', profile.tenant_id).single(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('tenant_id', profile.tenant_id)
        .eq('role', 'personal')
        .limit(1)
        .single(),
    ])
    businessName = tenant?.business_name ?? 'Strive Personal'
    personalName = personal?.full_name ?? null
  }

  // Active plan + streak
  let activePlan: { id: string; name: string } | null = null
  let streak = 0

  if (student) {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const [{ data: plan }, { data: attendanceRows }] = await Promise.all([
      supabase
        .from('workout_plans')
        .select('id, name')
        .eq('student_id', student.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('attendance')
        .select('attended_at')
        .eq('student_id', student.id)
        .gte('attended_at', sixtyDaysAgo.toISOString())
        .order('attended_at', { ascending: false }),
    ])

    activePlan = plan

    if (attendanceRows && attendanceRows.length > 0) {
      const trainedDates = new Set(
        attendanceRows.map((r) => new Date(r.attended_at).toISOString().split('T')[0]),
      )
      const cursor = new Date()
      cursor.setHours(0, 0, 0, 0)
      while (trainedDates.has(cursor.toISOString().split('T')[0])) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }
    }
  }

  const quickLinks = [
    { label: 'Meus Treinos',    href: '/student/treinos',        icon: Dumbbell,      desc: 'Planos e fichas do dia' },
    { label: 'Treinos Extras',  href: '/student/treinos-extras', icon: Zap,           desc: 'Treinos avulsos' },
    { label: 'Meu Progresso',   href: '/student/progresso',      icon: TrendingUp,    desc: 'Evolução e medidas' },
    { label: 'Frequência',      href: '/student/frequencia',     icon: CalendarCheck, desc: 'Histórico de treinos' },
    { label: 'Anamnese',        href: '/student/anamnese',       icon: ClipboardList, desc: 'Sua ficha de saúde' },
    { label: 'Avaliação Física',href: '/student/avaliacao',      icon: Activity,      desc: 'Medidas e composição' },
  ]

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-2xl">

      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Olá, {firstName}!
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {personalName
            ? <>Seu personal: <span className="text-text-primary font-medium">{personalName}</span> · {businessName}</>
            : businessName
          }
        </p>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-3 bg-brand-lime/10 border border-brand-lime/20 rounded-xl p-4">
          <span className="text-2xl leading-none">🔥</span>
          <div>
            <p className="font-display font-bold text-brand-lime text-lg leading-tight">
              {streak} dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-text-secondary">Mantenha o streak!</p>
          </div>
        </div>
      )}

      {/* Active plan banner */}
      {activePlan && (
        <Link
          href="/student/treinos"
          className="group flex items-center gap-4 bg-surface border border-surface-border rounded-xl p-4 hover:border-brand-lime/30 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
            <Dumbbell size={18} className="text-brand-lime" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold">
              Treino ativo
            </p>
            <p className="text-sm font-body font-semibold text-text-primary group-hover:text-brand-lime transition-colors truncate">
              {activePlan.name}
            </p>
          </div>
          <span className="text-xs text-brand-lime font-medium flex-shrink-0">
            Ver →
          </span>
        </Link>
      )}

      {/* Feedback CTA */}
      <Link
        href="/student/feedback"
        className="group flex items-center gap-4 bg-surface border border-surface-border rounded-xl p-4 hover:border-brand-lime/30 transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-purple-400/10 border border-purple-400/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={18} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-semibold text-text-primary group-hover:text-brand-lime transition-colors">
            Feedback de treino
          </p>
          <p className="text-xs text-text-secondary">Avalie seu treino de hoje</p>
        </div>
        <span className="text-xs text-text-secondary group-hover:text-brand-lime transition-colors flex-shrink-0">
          →
        </span>
      </Link>

      {/* Quick links grid */}
      <div>
        <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-3">
          Módulos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-surface border border-surface-border rounded-xl p-4 hover:border-brand-lime/30 transition-all space-y-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
                  <Icon size={16} className="text-brand-lime" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-text-primary group-hover:text-brand-lime transition-colors leading-tight">
                    {link.label}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{link.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
