import { createClient } from '@/lib/supabase/server'
import { Dumbbell, CalendarDays, TrendingUp } from 'lucide-react'

export default async function StudentHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Aluno'

  const quickLinks = [
    { label: 'Ver meus treinos',  href: '/student/treinos',    icon: Dumbbell,    desc: 'Acesse a ficha do dia' },
    { label: 'Meu progresso',     href: '/student/progresso',  icon: TrendingUp,  desc: 'Evolução e medidas' },
    { label: 'Frequência',        href: '/student/frequencia', icon: CalendarDays, desc: 'Histórico de treinos' },
  ]

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Olá, {firstName}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Pronto para treinar hoje?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <a
              key={link.href}
              href={link.href}
              className="group bg-surface border border-surface-border rounded-xl p-5 hover:border-brand-lime/30 transition-all hover:shadow-[0_0_24px_rgba(232,255,71,0.06)] space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-lime/10 flex items-center justify-center text-brand-lime group-hover:bg-brand-lime/20 transition-colors">
                <Icon size={18} />
              </div>
              <div>
                <div className="font-body font-semibold text-text-primary text-sm">
                  {link.label}
                </div>
                <div className="text-text-secondary text-xs mt-0.5">{link.desc}</div>
              </div>
            </a>
          )
        })}
      </div>

      <div className="bg-surface border border-surface-border rounded-xl p-6">
        <p className="text-text-secondary text-sm">
          Módulos de execução de treino, feedback e progresso chegam nas próximas etapas.
        </p>
      </div>
    </div>
  )
}
