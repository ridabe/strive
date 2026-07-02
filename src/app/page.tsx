import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Users, Dumbbell, TrendingUp, Calendar,
  MessageSquare, Trophy, Apple, BarChart2, CheckCircle,
  ChevronDown, Smartphone, Globe, Star,
  Bell, Shield, Clock, Sparkles
} from 'lucide-react'
import { LogoVertical, LogoHorizontal } from '@/components/logo'
import { MobileNav } from '@/components/landing/mobile-nav'
import { createClient } from '@/lib/supabase/server'

// ─── Data ────────────────────────────────────────────────────────────────────
// Max IA usa o accent violeta (tokens `max` / `max-light` em tailwind.config.ts),
// documentado em DESIGN.md como accent secundário restrito a esta feature —
// nunca fora do bloco/menções do Max.
const MAX_COLOR = '#7C3AED'

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Max IA',          href: '#max' },
  { label: 'Planos',          href: '#planos' },
  { label: 'Como funciona',   href: '#como-funciona' },
  { label: 'FAQ',             href: '#faq' },
]

const MAX_FEATURES = [
  {
    icon: Dumbbell,
    title: 'Cria treinos em segundos',
    desc: 'Descreva o objetivo do aluno e o Max monta a ficha completa, pronta para você revisar e enviar.',
  },
  {
    icon: TrendingUp,
    title: 'Ajusta cargas automaticamente',
    desc: 'Com base no histórico de execução, o Max sugere os próximos ajustes de carga para cada aluno.',
  },
  {
    icon: MessageSquare,
    title: 'Motiva seus alunos',
    desc: 'Mensagens de incentivo personalizadas, enviadas no momento certo — sem você precisar lembrar.',
  },
  {
    icon: BarChart2,
    title: 'Analisa o progresso individual',
    desc: 'Relatórios automáticos mostram quem está evoluindo e quem precisa da sua atenção agora.',
  },
]

const MODULES = [
  {
    id: 'treinos',
    icon: Dumbbell,
    tag: 'Prescrição de Treinos',
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
    icon: Apple,
    tag: 'Planos de Nutrição',
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
    icon: Trophy,
    tag: 'Ranqueamento',
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
    icon: MessageSquare,
    tag: 'Mensagens Diretas',
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
    icon: Calendar,
    tag: 'Agendamento',
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
      'Até 30 alunos',
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
      'Alunos Ilimitados',
      'Marca personalizada no app',
      'Acesso antecipado a novidades',
      'Implantação assistida',
      'Acesso ao Assistente de Personal MAX IA',
    ],
    cta: 'Começar com Elite',
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
          featured ? 'border-brand-lime' : 'border-surface-border'
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
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden w-full max-w-lg">
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
                  href="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-body font-medium text-text-secondary hover:text-brand-lime border border-surface-border hover:border-brand-lime/40 rounded-full px-4 py-2 transition-colors"
                >
                  <Dumbbell size={12} />
                  Área de Cadastro Personal Trainer
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-body font-semibold bg-brand-lime text-text-inverse px-5 py-2.5 rounded-full hover:bg-brand-dark transition-colors"
                >
                  Entrar
                  <ArrowRight size={14} />
                </Link>
              </>
            )}

            <MobileNav links={NAV_LINKS} isLoggedIn={!!user} />
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
        <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="flex flex-col gap-7">
            {/* Max — kicker discreto, subordinado ao headline (não compete pelo primeiro olhar) */}
            <div className="inline-flex items-center gap-2 w-fit">
              <Image
                src="/max-avatar.png"
                alt=""
                width={20}
                height={20}
                className="object-contain opacity-80"
              />
              <p className="text-xs font-body text-text-secondary">
                <span className="font-semibold text-max-light">Max</span> — seu assistente de IA, incluso no painel
              </p>
            </div>

            {/* Headline */}
            <div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary uppercase leading-[0.9] tracking-tight">
                Seu negócio,
              </h1>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-brand-lime uppercase leading-[0.9] tracking-tight mt-1">
                no controle.
              </h1>
            </div>

            {/* Sub */}
            <p className="font-body text-base sm:text-lg text-text-secondary max-w-md leading-relaxed">
              Gerencie treinos, nutrição, agenda, mensagens e financeiro num só painel.
              Com o Max, seu assistente de IA, criando treinos, ajustando cargas e
              acompanhando a evolução de cada aluno — você foca no que importa.
            </p>

            {/* Benefit list — 3 itens, o essencial antes do scroll */}
            <ul className="space-y-3">
              {[
                { icon: <Sparkles size={15} />, text: 'Max IA cria treinos e ajusta cargas automaticamente', max: true },
                { icon: <Dumbbell size={15} />, text: 'Prescrição de treinos com banco de exercícios' },
                { icon: <Calendar size={15} />, text: 'Nutrição, ranqueamento e agenda no mesmo painel' },
              ].map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-sm font-body text-text-secondary">
                  <span className={`flex-shrink-0 ${b.max ? 'text-max-light' : 'text-brand-lime'}`}>
                    {b.icon}
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 font-body font-semibold text-base bg-brand-lime text-text-inverse px-8 py-4 rounded-full hover:bg-brand-dark transition-all hover:scale-105"
              >
                Entrar na plataforma
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 font-body font-medium text-base text-text-primary border border-surface-border px-8 py-4 rounded-full hover:border-brand-lime/50 hover:text-brand-lime transition-colors"
              >
                <Dumbbell size={16} />
                Cadastro de Personal — Criar conta
              </Link>
            </div>

            {/* Trust line */}
            <p className="text-xs font-body text-text-secondary flex items-center gap-2">
              <Shield size={12} className="text-brand-lime" />
              Alunos: acesse com o link do seu personal · Sem cartão · Cancele quando quiser
            </p>
          </div>

          {/* Right — dashboard mockup */}
          <div className="hidden lg:flex justify-center relative">
            <DashboardMockup />

            {/* Max — assistente de IA, "garoto propaganda" espiando o painel */}
            <a
              href="#max"
              className="absolute -bottom-7 -right-7 flex items-center gap-3 bg-surface border border-max/30 rounded-2xl pl-2 pr-4 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform"
            >
              <div className="relative w-11 h-11 flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: `radial-gradient(circle, ${MAX_COLOR}40 0%, transparent 70%)` }}
                />
                <Image
                  src="/max-avatar.png"
                  alt="Max Strive IA"
                  width={44}
                  height={44}
                  className="relative z-10 object-contain"
                />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-body font-semibold text-max-light">
                  Max sugeriu +5kg pro Lucas
                </p>
                <p className="text-[10px] font-body text-text-secondary">
                  Conhecer o Max →
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#stats"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-secondary/30 hover:text-brand-lime transition-colors animate-scroll-hint"
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
              <div className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-1">{s.value}</div>
              <div className="font-body text-text-secondary text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAX — ASSISTENTE DE IA ── */}
      <section id="max" className="relative py-24 px-6 overflow-hidden border-b border-surface-border">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 60% 60% at 50% 0%, ${MAX_COLOR}14 0%, transparent 70%)` }}
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-14">
            {/* Avatar */}
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${MAX_COLOR}30 0%, transparent 70%)` }}
              />
              <div
                className="absolute w-28 h-28 rounded-full border"
                style={{ borderColor: `${MAX_COLOR}30`, background: `${MAX_COLOR}10` }}
              />
              <Image
                src="/max-avatar.png"
                alt="Max Strive IA"
                width={112}
                height={112}
                className="relative z-10 object-contain"
                style={{ filter: `drop-shadow(0 0 20px ${MAX_COLOR}60)` }}
              />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-max/25 bg-max/[0.08] text-xs font-body font-semibold uppercase tracking-wider mb-5 text-max-light">
              <Sparkles size={12} />
              Assistente de IA
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-5xl text-text-primary uppercase tracking-tight leading-[0.9] mb-4">
              Este é o Max.<br />Seu novo parceiro de treino.
            </h2>
            <p className="font-body text-text-secondary text-base max-w-xl leading-relaxed">
              O Max não substitui você — ele te dá mais tempo para o que importa.
              Enquanto ele cuida da parte repetitiva, você foca na relação com seus alunos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MAX_FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-surface border border-surface-border rounded-2xl p-6 transition-colors hover:border-max/30"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-max/[0.08] text-max-light">
                  <f.icon size={20} />
                </div>
                <h3 className="font-body font-semibold text-text-primary text-sm mb-1.5">{f.title}</h3>
                <p className="font-body text-text-secondary text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-body font-semibold text-base text-white bg-max px-8 py-4 rounded-full transition-all hover:scale-105"
            >
              Quero o Max no meu painel
              <ArrowRight size={18} />
            </Link>
          </div>
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
                <div className="inline-flex w-fit items-center gap-2 bg-surface border border-surface-border text-text-secondary text-xs font-body font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  <mod.icon size={13} className="text-brand-lime" />
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
                      <CheckCircle size={16} className="text-text-secondary flex-shrink-0 mt-0.5" />
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
              className="group bg-surface border border-surface-border rounded-2xl p-7 hover:border-brand-lime/25 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color} mb-5`}>
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
            <div className="bg-surface border border-brand-lime/20 rounded-2xl p-7">
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
                    <CheckCircle size={16} className="text-text-secondary flex-shrink-0" />
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
                <div className="w-16 h-16 rounded-2xl bg-surface border border-surface-border flex items-center justify-center">
                  <span className="font-display font-bold text-2xl text-text-primary">{step.number}</span>
                </div>
                <h3 className="font-body font-semibold text-text-primary text-base">{step.title}</h3>
                <p className="font-body text-text-secondary text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-body font-semibold text-base bg-brand-lime text-text-inverse px-8 py-4 rounded-full hover:bg-brand-dark transition-colors"
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
                className={`relative flex flex-col rounded-2xl p-7 border transition-colors ${
                  plan.highlight
                    ? 'bg-brand-lime text-text-inverse border-brand-lime'
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
                      <CheckCircle size={14} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-text-inverse' : 'text-text-secondary'}`} />
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

          <p className="text-center text-xs font-body text-text-secondary mt-6">
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
                  {['Treinos', 'Nutrição', 'Max IA', 'Ranqueamento', 'Mensagens', 'Agenda'].map((l) => (
                    <li key={l}>
                      <a href={l === 'Max IA' ? '#max' : `#${l.toLowerCase()}`} className="font-body text-text-secondary text-sm hover:text-text-primary transition-colors">
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
            <div className="flex items-center gap-2 text-text-secondary text-xs font-body">
              <Shield size={12} />
              LGPD · Dados protegidos
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
