import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Users, Dumbbell, TrendingUp, Calendar,
  MessageSquare, Trophy, Apple, BarChart2, CheckCircle,
  ChevronDown, Smartphone, Globe, Zap, Star, Play,
  Bell, Shield, Clock
} from 'lucide-react'
import { LogoVertical, LogoHorizontal } from '@/components/logo'
import { createClient } from '@/lib/supabase/server'

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos',          href: '#planos' },
  { label: 'Como funciona',   href: '#como-funciona' },
  { label: 'FAQ',             href: '#faq' },
]

const MODULES = [
  {
    id: 'treinos',
    tag: '💪 Prescrição de Treinos',
    title: 'Monte fichas completas em minutos, não em horas.',
    desc: 'Banco de exercícios com vídeos, séries, cargas e repetições. Crie fichas personalizadas para cada aluno e envie direto para o app deles. Eles executam, você acompanha.',
    bullets: [
      'Banco de exercícios com instruções e vídeos',
      'Fichas por fase, objetivo e nível do aluno',
      'Aluno executa e registra cargas direto no app',
      'Você acompanha o progresso em tempo real',
    ],
    screen: '/screens/tela2_execucao.png',
    alt: 'Tela de execução de treino',
    side: 'right' as const,
  },
  {
    id: 'nutricao',
    tag: '🥗 Planos de Nutrição',
    title: 'Nutrição integrada ao treino, tudo no mesmo lugar.',
    desc: 'Crie planos alimentares e vincule direto ao perfil do aluno. Ele visualiza as refeições, registra o que comeu e você acompanha a aderência sem precisar ficar no WhatsApp.',
    bullets: [
      'Criação de planos com refeições e macros',
      'Aluno registra refeições pelo app',
      'Acompanhamento de aderência no painel',
      'Histórico alimentar por aluno',
    ],
    screen: '/screens/tela1_home.png',
    alt: 'Tela principal do app',
    side: 'left' as const,
  },
  {
    id: 'ranqueamento',
    tag: '🏆 Ranqueamento',
    title: 'Gamificação que retém. Ranking que motiva.',
    desc: 'Leaderboard mensal entre seus alunos. Os que mais treinam e seguem o plano sobem no ranking — medalhas para o top 3. Seus alunos viram uma comunidade competitiva e engajada.',
    bullets: [
      'Ranking mensal baseado em treinos e aderência',
      'Medalhas para top 3 alunos do mês',
      'Alunos se motivam mutuamente',
      'Você vê quem está engajado e quem está caindo',
    ],
    screen: '/screens/tela3_evolucao.png',
    alt: 'Tela de evolução e ranqueamento',
    side: 'right' as const,
  },
  {
    id: 'mensagens',
    tag: '💬 Mensagens Diretas',
    title: 'Canal direto com seu aluno. Sem misturar no WhatsApp.',
    desc: 'Chat integrado com cada aluno, dentro da plataforma. Histórico organizado, sem se perder em grupos. Você mantém o profissionalismo e o aluno tem suporte quando precisa.',
    bullets: [
      'Chat individual por aluno no painel',
      'Histórico completo de conversas',
      'Notificações em tempo real no app',
      'Sem misturar vida pessoal e profissional',
    ],
    screen: '/screens/tela1_home.png',
    alt: 'Tela de mensagens',
    side: 'left' as const,
  },
  {
    id: 'agenda',
    tag: '📅 Agendamento',
    title: 'Aluno agenda. Você confirma. Chega de marcar no zap.',
    desc: 'Configure sua disponibilidade semanal e deixe o aluno agendar sessões direto pelo app. Confirmações automáticas, lembretes de horário e visualização mensal da sua agenda.',
    bullets: [
      'Disponibilidade configurada por você',
      'Aluno agenda direto pelo app',
      'Confirmação e lembretes automáticos',
      'Visão mensal e semanal da agenda',
    ],
    screen: '/screens/tela3_evolucao.png',
    alt: 'Tela de agenda',
    side: 'right' as const,
  },
]

const STATS = [
  { value: 'Grátis',  label: 'para começar — sem cartão' },
  { value: 'Web',     label: '+ App Android + instalar no celular' },
  { value: '1 lugar', label: 'treino, nutrição, agenda e financeiro' },
]

const PLANS = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: 'para sempre',
    desc: 'Comece sem custo. Experimente tudo sem compromisso.',
    highlight: false,
    features: [
      'Até 5 alunos ativos',
      'Prescrição de treinos',
      'Banco de exercícios',
      'App para seus alunos',
      'Mensagens diretas',
      'Agendamento básico',
    ],
    cta: 'Criar conta grátis',
    href: '/register',
  },
  {
    name: 'Pro',
    price: 'R$ 79',
    period: '/mês',
    desc: 'Para o personal que quer profissionalizar o negócio.',
    highlight: true,
    badge: 'MAIS POPULAR',
    features: [
      'Alunos ilimitados',
      'Planos de nutrição',
      'Ranqueamento de alunos',
      'Controle financeiro',
      'Relatórios de evolução',
      'Suporte prioritário',
    ],
    cta: 'Começar com Pro',
    href: '/register?plano=pro',
  },
  {
    name: 'Elite',
    price: 'R$ 149',
    period: '/mês',
    desc: 'Para quem atende em escala e quer o máximo.',
    highlight: false,
    features: [
      'Tudo do Pro, mais',
      'Múltiplos personal (equipe)',
      'Marca personalizada no app',
      'Acesso antecipado a novidades',
      'Implantação assistida',
      'Garantia contratual de SLA',
    ],
    cta: 'Falar com a equipe',
    href: '/register?plano=elite',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Crie sua conta em 2 minutos',
    desc: 'Sem cartão de crédito. Preencha os dados básicos e seu painel está pronto para uso imediato.',
  },
  {
    number: '02',
    title: 'Convide seus alunos',
    desc: 'Link exclusivo gerado pelo painel. Aluno acessa pelo app Android ou direto no navegador.',
  },
  {
    number: '03',
    title: 'Gerencie tudo em um só lugar',
    desc: 'Treinos, nutrição, agenda, mensagens e financeiro — tudo centralizado no seu painel.',
  },
]

const FAQS = [
  {
    q: 'Quanto custa para o meu aluno?',
    a: 'Zero. O app é 100% gratuito para o aluno — sua assinatura cobre o acesso completo dele. Ele baixa, entra com o link que você envia e começa a usar.',
  },
  {
    q: 'O aluno precisa baixar um app?',
    a: 'Não necessariamente. O StrivePersonal funciona direto no navegador (web) e também tem app para Android. Em celulares, o aluno pode instalar na tela inicial como se fosse um app nativo — sem precisar da loja.',
  },
  {
    q: 'Posso usar no plano gratuito sem limite de tempo?',
    a: 'Sim. O plano gratuito não expira. Você pode gerenciar até 5 alunos para sempre, sem cartão de crédito. Só faz upgrade quando quiser crescer.',
  },
  {
    q: 'Como o ranqueamento funciona?',
    a: 'Cada treino concluído e refeição registrada pelo aluno gera pontos. No final do mês, os 3 mais engajados recebem medalhas. Seus alunos viram um grupo que se motiva — a taxa de retenção aumenta.',
  },
  {
    q: 'Posso criar planos de nutrição?',
    a: 'Sim. O módulo de nutrição permite criar planos com refeições e macros. O aluno vê o plano no app e pode registrar o que comeu. Você acompanha a aderência no painel.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Conformidade com LGPD, criptografia em trânsito e em repouso. Seus dados e os dos seus alunos ficam protegidos.',
  },
]

// ─── Components ──────────────────────────────────────────────────────────────

function PhoneMockup({
  src, alt, featured = false, className = '',
}: {
  src: string; alt: string; featured?: boolean; className?: string
}) {
  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: featured ? 240 : 190 }}
    >
      <div
        className={`relative rounded-[2.4rem] overflow-hidden border-[3px] ${
          featured
            ? 'border-brand-lime shadow-[0_0_60px_rgba(232,255,71,0.25)]'
            : 'border-surface-border shadow-[0_20px_60px_rgba(0,0,0,0.4)]'
        } bg-surface`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-background rounded-b-2xl z-10" />
        <Image
          src={src}
          alt={alt}
          width={480}
          height={854}
          className="w-full h-auto block"
          quality={85}
        />
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] w-full max-w-lg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-error" />
          <div className="w-3 h-3 rounded-full bg-status-warning" />
          <div className="w-3 h-3 rounded-full bg-status-success" />
        </div>
        <div className="text-xs font-body text-text-secondary bg-background/60 px-3 py-1 rounded-full">
          app.strivepersonal.com.br
        </div>
        <div className="w-16" />
      </div>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-surface-border/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-body text-text-secondary">Bom dia, Personal</p>
            <p className="text-base font-body font-semibold text-text-primary">Seu painel · Quinta-feira</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-lime/20 flex items-center justify-center">
            <span className="text-brand-lime text-sm font-bold">R</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-surface-border/50 border-b border-surface-border/50">
        {[
          { label: 'Alunos ativos', value: '24' },
          { label: 'Treinos hoje', value: '8' },
          { label: 'Faturado/mês', value: 'R$ 4.800' },
        ].map((s) => (
          <div key={s.label} className="px-3 py-3 text-center">
            <div className="text-base font-body font-bold text-brand-lime">{s.value}</div>
            <div className="text-[10px] font-body text-text-secondary mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alunos list */}
      <div className="p-4 space-y-2">
        <p className="text-xs font-body text-text-secondary uppercase tracking-wider mb-3">Alunos recentes</p>
        {[
          { name: 'Lucas Mendes',   tag: 'Treino A · Hoje',         status: 'Concluído',  color: 'text-status-success' },
          { name: 'Camila Rocha',   tag: 'Nutrição · Aderência 90%', status: 'No plano',   color: 'text-brand-lime' },
          { name: 'Rafael Duarte',  tag: 'Treino B · Pendente',      status: 'Pendente',   color: 'text-status-warning' },
        ].map((a) => (
          <div key={a.name} className="flex items-center justify-between bg-background/50 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-text-secondary">
                {a.name[0]}
              </div>
              <div>
                <p className="text-xs font-body font-semibold text-text-primary">{a.name}</p>
                <p className="text-[10px] font-body text-text-secondary">{a.tag}</p>
              </div>
            </div>
            <span className={`text-[10px] font-body font-semibold ${a.color}`}>{a.status}</span>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around px-4 py-3 border-t border-surface-border/50">
        {[
          { icon: <Users size={15} />, label: 'Alunos', active: true },
          { icon: <Dumbbell size={15} />, label: 'Treinos', active: false },
          { icon: <Apple size={15} />, label: 'Nutrição', active: false },
          { icon: <Calendar size={15} />, label: 'Agenda', active: false },
          { icon: <BarChart2 size={15} />, label: 'Finanças', active: false },
        ].map((n) => (
          <div key={n.label} className={`flex flex-col items-center gap-1 ${n.active ? 'text-brand-lime' : 'text-text-secondary'}`}>
            {n.icon}
            <span className="text-[9px] font-body">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background text-text-primary">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border/60 bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <LogoHorizontal size="sm" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-body text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="text-sm font-body font-semibold text-brand-lime hover:text-brand-dark transition-colors flex items-center gap-1"
              >
                Ir para o Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-body text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-body font-semibold bg-brand-lime text-text-inverse px-5 py-2.5 rounded-full hover:bg-brand-dark transition-all hover:shadow-[0_0_20px_rgba(232,255,71,0.4)]"
                >
                  Começar Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 pb-12 px-6 overflow-hidden">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_60%_50%,_#1a1a2e_0%,_#0e0e1a_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 15v22L30 52 0 37V15z' fill='none' stroke='%23E8FF47' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 52px',
          }}
        />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-lime/4 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-lime/3 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="flex flex-col gap-7">
            {/* Badge */}
            <div className="inline-flex w-fit items-center gap-2 bg-brand-lime/10 border border-brand-lime/25 text-brand-lime text-xs font-body font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
              Plataforma para Personal Trainers
            </div>

            {/* Headline */}
            <div>
              <h1 className="font-display font-bold text-5xl sm:text-6xl text-text-primary uppercase leading-[0.88] tracking-tight">
                Seu negócio,
              </h1>
              <h1 className="font-display font-bold text-5xl sm:text-6xl text-brand-lime uppercase leading-[0.88] tracking-tight mt-1">
                no controle.
              </h1>
            </div>

            {/* Sub */}
            <p className="font-body text-base sm:text-lg text-text-secondary max-w-md leading-relaxed">
              Gerencie treinos, nutrição, agenda, mensagens e financeiro num só painel.
              Seus alunos executam pelo app — você vê tudo em tempo real.
            </p>

            {/* Benefit list */}
            <ul className="space-y-3">
              {[
                { icon: <Dumbbell size={15} />, text: 'Prescrição de treinos com banco de exercícios' },
                { icon: <Apple size={15} />, text: 'Planos de nutrição integrados ao treino' },
                { icon: <Trophy size={15} />, text: 'Ranqueamento que retém e motiva seus alunos' },
                { icon: <Calendar size={15} />, text: 'Agendamento direto pelo app, sem WhatsApp' },
              ].map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-sm font-body text-text-secondary">
                  <span className="text-brand-lime flex-shrink-0">{b.icon}</span>
                  {b.text}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 font-body font-semibold text-base bg-brand-lime text-text-inverse px-8 py-4 rounded-full hover:bg-brand-dark transition-all hover:shadow-[0_0_32px_rgba(232,255,71,0.4)] hover:scale-105"
              >
                Criar Conta Grátis
                <ArrowRight size={18} />
              </Link>
              <a
                href="#funcionalidades"
                className="inline-flex items-center justify-center gap-2 font-body font-medium text-base text-text-primary border border-surface-border px-8 py-4 rounded-full hover:border-brand-lime/50 hover:text-brand-lime transition-colors"
              >
                <Play size={16} className="fill-current" />
                Ver funcionalidades
              </a>
            </div>

            {/* Trust line */}
            <p className="text-xs font-body text-text-secondary/50 flex items-center gap-2">
              <Shield size={12} className="text-brand-lime/50" />
              Gratuito para começar · Sem cartão · Cancele quando quiser
            </p>
          </div>

          {/* Right — dashboard mockup */}
          <div className="hidden lg:flex justify-center">
            <DashboardMockup />
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#stats"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-secondary/30 hover:text-brand-lime transition-colors animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown size={28} />
        </a>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" className="border-y border-surface-border bg-surface/40 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label} className="py-2">
              <div className="font-display font-bold text-3xl sm:text-4xl text-brand-lime mb-1">{s.value}</div>
              <div className="font-body text-text-secondary text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULE SECTIONS ── */}
      <div id="funcionalidades" className="py-4">
        {MODULES.map((mod, i) => (
          <section
            key={mod.id}
            id={mod.id}
            className={`py-20 px-6 ${i % 2 === 1 ? 'bg-surface/20' : ''}`}
          >
            <div className={`max-w-6xl mx-auto flex flex-col ${mod.side === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-14 items-center`}>

              {/* Text side */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="inline-flex w-fit items-center gap-2 bg-brand-lime/10 border border-brand-lime/20 text-brand-lime text-xs font-body font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {mod.tag}
                </div>

                <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase leading-[0.9] tracking-tight">
                  {mod.title}
                </h2>

                <p className="font-body text-text-secondary text-base leading-relaxed max-w-md">
                  {mod.desc}
                </p>

                <ul className="space-y-3 mt-2">
                  {mod.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm font-body text-text-secondary">
                      <CheckCircle size={16} className="text-brand-lime flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Screen side */}
              <div className="flex-shrink-0 flex justify-center">
                <PhoneMockup
                  src={mod.screen}
                  alt={mod.alt}
                  featured={i === 0}
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── ACESSO MULTIPLATAFORMA ── */}
      <section className="py-20 px-6 bg-surface/30 border-y border-surface-border">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <p className="font-body text-brand-lime text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            Acesse de qualquer lugar
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight leading-[0.9] mb-4">
            Web, Android e<br />tela inicial do celular.
          </h2>
          <p className="font-body text-text-secondary text-base max-w-lg mx-auto leading-relaxed">
            Você e seus alunos acessam de qualquer dispositivo. Sem precisar baixar da loja, sem complicação.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Globe size={28} />,
              title: 'Acesso Web',
              desc: 'Funciona em qualquer navegador — Chrome, Safari, Edge. Acesse seu painel direto em app.strivepersonal.com.br.',
              color: 'text-brand-lime',
              bg: 'bg-brand-lime/10',
            },
            {
              icon: <Smartphone size={28} />,
              title: 'App Android',
              desc: 'Seus alunos baixam o app na Google Play, entram com o código e já começam a treinar.',
              color: 'text-status-success',
              bg: 'bg-status-success/10',
            },
            {
              icon: <Bell size={28} />,
              title: 'Instalar no celular',
              desc: 'No navegador mobile, basta tocar em "Adicionar à tela inicial". Funciona como um app nativo — sem precisar da loja.',
              color: 'text-status-warning',
              bg: 'bg-status-warning/10',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group bg-surface border border-surface-border rounded-2xl p-7 hover:border-brand-lime/25 transition-all hover:shadow-[0_0_32px_rgba(232,255,71,0.06)]"
            >
              <div className={`w-13 h-13 rounded-xl ${item.bg} flex items-center justify-center ${item.color} mb-5`}>
                {item.icon}
              </div>
              <h3 className="font-body font-semibold text-text-primary text-base mb-2">{item.title}</h3>
              <p className="font-body text-text-secondary text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight leading-[0.9]">
              Como era antes.<br />Como fica depois.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before */}
            <div className="bg-surface border border-surface-border/60 rounded-2xl p-7">
              <div className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-5">
                Antes · WhatsApp + planilha
              </div>
              <ul className="space-y-3">
                {[
                  'Fichas de treino no Word ou à mão',
                  'Aluno perde a ficha na conversa',
                  'Agenda marcada em grupo de WhatsApp',
                  'Pagamento controlado em planilha',
                  'Sem visão da evolução do aluno',
                  'Vida pessoal misturada com trabalho',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-body text-text-secondary/70">
                    <span className="w-4 h-4 rounded-full border border-status-error/40 flex items-center justify-center text-status-error/60 text-xs flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-surface border border-brand-lime/20 rounded-2xl p-7 shadow-[0_0_40px_rgba(232,255,71,0.05)]">
              <div className="text-xs font-body font-semibold text-brand-lime uppercase tracking-widest mb-5">
                Depois · StrivePersonal
              </div>
              <ul className="space-y-3">
                {[
                  'Fichas prescritas em minutos no painel',
                  'Aluno executa e registra pelo app',
                  'Agendamento automático com confirmação',
                  'Controle financeiro com PIX integrado',
                  'Gráficos de evolução por aluno',
                  'Profissionalismo em tudo que você entrega',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-body text-text-primary">
                    <CheckCircle size={16} className="text-brand-lime flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="py-20 px-6 bg-surface/20 border-y border-surface-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-brand-lime text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              Como funciona
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight leading-[0.9]">
              Três passos.<br />Você está rodando.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="relative text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center">
                  <span className="font-display font-bold text-2xl text-brand-lime">{step.number}</span>
                </div>
                <h3 className="font-body font-semibold text-text-primary text-base">{step.title}</h3>
                <p className="font-body text-text-secondary text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-body font-semibold text-base bg-brand-lime text-text-inverse px-8 py-4 rounded-full hover:bg-brand-dark transition-all hover:shadow-[0_0_24px_rgba(232,255,71,0.35)]"
            >
              Criar conta grátis agora
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="planos" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-brand-lime text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              Planos
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight leading-[0.9] mb-4">
              Comece grátis.<br />Escale quando precisar.
            </h2>
            <p className="font-body text-text-secondary text-base max-w-md mx-auto">
              Cadastre-se sem custo e use as funcionalidades principais com até 5 alunos. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 border transition-all ${
                  plan.highlight
                    ? 'bg-brand-lime text-text-inverse border-brand-lime shadow-[0_0_60px_rgba(232,255,71,0.2)]'
                    : 'bg-surface border-surface-border hover:border-brand-lime/30'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background text-brand-lime text-[10px] font-body font-bold px-3 py-1 rounded-full border border-brand-lime/30 uppercase tracking-wider whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-5">
                  <h3 className={`font-display font-bold text-xl uppercase tracking-tight mb-1 ${plan.highlight ? 'text-text-inverse' : 'text-text-primary'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs font-body leading-relaxed ${plan.highlight ? 'text-text-inverse/70' : 'text-text-secondary'}`}>
                    {plan.desc}
                  </p>
                </div>

                <div className="mb-6">
                  <span className={`font-display font-bold text-4xl ${plan.highlight ? 'text-text-inverse' : 'text-text-primary'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm font-body ml-1 ${plan.highlight ? 'text-text-inverse/60' : 'text-text-secondary'}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm font-body ${plan.highlight ? 'text-text-inverse/90' : 'text-text-secondary'}`}>
                      <CheckCircle size={14} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-text-inverse' : 'text-brand-lime'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full text-center font-body font-semibold text-sm py-3.5 rounded-full transition-all ${
                    plan.highlight
                      ? 'bg-background text-brand-lime hover:bg-surface'
                      : 'bg-brand-lime/10 border border-brand-lime/25 text-brand-lime hover:bg-brand-lime/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs font-body text-text-secondary/50 mt-6">
            Plano gratuito não expira · Upgrade quando quiser · Sem fidelidade
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6 border-t border-surface-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-brand-lime text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              Perguntas frequentes
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight leading-[0.9]">
              Sem letra miúda.
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="bg-surface border border-surface-border rounded-xl p-6 hover:border-brand-lime/20 transition-colors"
              >
                <h3 className="font-body font-semibold text-text-primary text-sm mb-2">
                  {faq.q}
                </h3>
                <p className="font-body text-text-secondary text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-brand-lime rounded-2xl p-10 sm:p-16 text-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='34' viewBox='0 0 40 34' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 10v14L20 34 0 24V10z' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundSize: '40px 34px',
              }}
            />
            <div className="relative z-10">
              <div className="flex justify-center gap-1 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={16} className="text-text-inverse fill-text-inverse opacity-80" />
                ))}
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-5xl text-text-inverse uppercase tracking-tight leading-[0.88] mb-4">
                O painel está pronto.<br />Só falta você.
              </h2>
              <p className="font-body text-text-inverse/60 text-base mb-8 max-w-md mx-auto">
                Para personal trainer e para seus alunos. Plano gratuito para sempre, até 5 alunos. Sem cartão. Sem contrato.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 font-body font-bold text-base bg-background text-brand-lime px-8 py-4 rounded-full hover:bg-surface transition-all hover:scale-105"
                >
                  Criar minha conta grátis
                  <ArrowRight size={18} />
                </Link>
                <div className="flex items-center gap-2 text-text-inverse/50 text-sm font-body">
                  <Clock size={14} />
                  Leva menos de 2 minutos
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-surface-border py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div>
              <LogoHorizontal size="sm" />
              <p className="font-body text-text-secondary text-sm mt-3 max-w-xs leading-relaxed">
                Gerencie seu negócio como personal trainer. Treino, nutrição, agenda, mensagens e financeiro em um só lugar.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <p className="font-body font-semibold text-text-primary text-sm mb-3">Produto</p>
                <ul className="space-y-2">
                  {[
                    { label: 'Funcionalidades', href: '#funcionalidades' },
                    { label: 'Planos', href: '#planos' },
                    { label: 'Como funciona', href: '#como-funciona' },
                  ].map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="font-body text-text-secondary text-sm hover:text-text-primary transition-colors">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-body font-semibold text-text-primary text-sm mb-3">Módulos</p>
                <ul className="space-y-2">
                  {['Treinos', 'Nutrição', 'Ranqueamento', 'Mensagens', 'Agenda'].map((l) => (
                    <li key={l}>
                      <a href={`#${l.toLowerCase()}`} className="font-body text-text-secondary text-sm hover:text-text-primary transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-body font-semibold text-text-primary text-sm mb-3">Suporte</p>
                <ul className="space-y-2">
                  {[
                    { label: 'FAQ', href: '#faq' },
                    { label: 'Termos de Uso', href: '/termos' },
                    { label: 'Privacidade', href: '/privacidade' },
                    { label: 'Contato', href: 'mailto:suporte@strivepersonal.com.br' },
                  ].map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="font-body text-text-secondary text-sm hover:text-text-primary transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-body text-text-secondary/40 text-xs">
              © {new Date().getFullYear()} Strive Personal. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-text-secondary/40 text-xs font-body">
              <Shield size={12} />
              LGPD · Dados protegidos
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
