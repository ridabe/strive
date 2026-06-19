import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Users, Dumbbell, TrendingUp, DollarSign, Zap, BarChart2, CheckCircle, ChevronDown } from 'lucide-react'
import { LogoVertical, LogoHorizontal } from '@/components/logo'
import { createClient } from '@/lib/supabase/server'

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Users size={22} />,
    title: 'Gestão de Alunos',
    description: 'Todos os seus alunos organizados com histórico de treinos, medidas corporais, anamnese e dados de contato.',
  },
  {
    icon: <Dumbbell size={22} />,
    title: 'Prescrição de Treinos',
    description: 'Monte fichas personalizadas e envie direto para o app do aluno — com exercícios, séries, cargas e vídeos.',
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Evolução em Tempo Real',
    description: 'Gráficos de carga, frequência e progresso por exercício. Veja a evolução real de cada aluno com dados precisos.',
  },
  {
    icon: <DollarSign size={22} />,
    title: 'Controle Financeiro',
    description: 'Gerencie mensalidades, pagamentos e a saúde financeira do seu negócio em um painel simples e direto.',
  },
]

const SCREENS = [
  { src: '/screens/tela3_evolucao.png', alt: 'Tela de evolução do aluno', rotate: '-6deg', translateY: '16px', opacity: 0.75 },
  { src: '/screens/tela1_home.png',     alt: 'Tela principal do app',       rotate: '0deg',  translateY: '0px',  opacity: 1,    featured: true },
  { src: '/screens/tela2_execucao.png', alt: 'Tela de execução do treino',  rotate: '6deg',  translateY: '16px', opacity: 0.75 },
]

const STATS = [
  { value: '100%', label: 'gratuito para começar' },
  { value: '∞',    label: 'alunos sem limite no plano inicial' },
  { value: '24/7', label: 'acesso via app mobile' },
]

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup({
  src, alt, featured = false, style,
}: {
  src: string
  alt: string
  featured?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: featured ? 220 : 175,
        ...style,
      }}
    >
      {/* Outer frame */}
      <div
        className={`relative rounded-[2.2rem] overflow-hidden border-[3px] ${
          featured
            ? 'border-brand-lime shadow-[0_0_40px_rgba(232,255,71,0.2)]'
            : 'border-surface-border'
        } bg-surface`}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-background rounded-b-2xl z-10" />
        {/* Screen image */}
        <Image
          src={src}
          alt={alt}
          width={440}
          height={783}
          className="w-full h-auto block"
          quality={85}
        />
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background text-text-primary">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <LogoHorizontal size="sm" />
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
                  href="/login"
                  className="text-sm font-body font-semibold bg-brand-lime text-text-inverse px-5 py-2 rounded-full hover:bg-brand-dark transition-all hover:shadow-[0_0_16px_rgba(232,255,71,0.35)]"
                >
                  Começar Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-12 px-6 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_#1a1a2e_0%,_#0e0e1a_65%)]" />
        {/* Hex grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 15v22L30 52 0 37V15z' fill='none' stroke='%23E8FF47' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 52px',
          }}
        />
        {/* Lime accent glow blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-lime/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-8">
          {/* Logo */}
          <LogoVertical size="lg" glow />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-lime/10 border border-brand-lime/30 text-brand-lime text-xs font-body font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
            Plataforma para Personal Trainers
          </div>

          {/* Headline */}
          <div>
            <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl text-text-primary uppercase leading-[0.88] tracking-tight">
              Evolução que
            </h1>
            <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl text-brand-lime uppercase leading-[0.88] tracking-tight mt-1">
              você vê.
            </h1>
          </div>

          {/* Subheadline */}
          <p className="font-body text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed">
            Gerencie seus alunos, prescreva treinos e acompanhe a evolução
            de cada um — tudo em um só lugar. Seus alunos executam pelo app.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-body font-semibold text-base bg-brand-lime text-text-inverse px-8 py-4 rounded-full hover:bg-brand-dark transition-all hover:shadow-[0_0_32px_rgba(232,255,71,0.35)] hover:scale-105"
            >
              Criar Conta Grátis
              <ArrowRight size={18} />
            </Link>
            <a
              href="#funcionalidades"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-body font-medium text-base text-text-primary border border-surface-border px-8 py-4 rounded-full hover:border-brand-lime/50 hover:text-brand-lime transition-colors"
            >
              Ver Funcionalidades
            </a>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: <Zap size={13} />,         label: 'Treinos personalizados' },
              { icon: <BarChart2 size={13} />,    label: 'Evolução em tempo real' },
              { icon: <CheckCircle size={13} />,  label: 'App para seus alunos' },
            ].map((chip) => (
              <div
                key={chip.label}
                className="flex items-center gap-1.5 text-xs font-body text-text-secondary bg-surface border border-surface-border px-3 py-1.5 rounded-full"
              >
                <span className="text-brand-lime">{chip.icon}</span>
                {chip.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#app-preview"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-secondary/40 hover:text-brand-lime transition-colors animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown size={28} />
        </a>
      </section>

      {/* ── APP PREVIEW ── */}
      <section id="app-preview" className="py-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-brand-lime text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              O app dos seus alunos
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight leading-[0.9]">
              Seus alunos vão<br />amar executar.
            </h2>
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {SCREENS.map((screen, i) => (
              <div
                key={i}
                className={screen.featured ? '' : 'hidden sm:block'}
                style={{
                  transform: `rotate(${screen.rotate}) translateY(${screen.translateY})`,
                  opacity: screen.opacity,
                }}
              >
                <PhoneMockup
                  src={screen.src}
                  alt={screen.alt}
                  featured={screen.featured}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-brand-lime text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              Para personal trainers
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight leading-[0.9] mb-4">
              Tudo que você precisa<br />para escalar.
            </h2>
            <p className="font-body text-text-secondary text-base max-w-md mx-auto leading-relaxed">
              Pare de usar planilhas e WhatsApp. Gerencie seu negócio como um profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-surface border border-surface-border rounded-xl p-6 hover:border-brand-lime/30 transition-all hover:shadow-[0_0_24px_rgba(232,255,71,0.06)]"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-lime/10 flex items-center justify-center text-brand-lime mb-4 group-hover:bg-brand-lime/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-body font-semibold text-text-primary text-base mb-2">{f.title}</h3>
                <p className="font-body text-text-secondary text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 border-y border-surface-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label} className="py-4">
              <div className="font-display font-bold text-4xl sm:text-5xl text-brand-lime mb-2">
                {s.value}
              </div>
              <div className="font-body text-text-secondary text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-brand-lime rounded-2xl p-10 sm:p-14 text-center overflow-hidden">
            {/* Background hex pattern (subtle, dark) */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='34' viewBox='0 0 40 34' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 10v14L20 34 0 24V10z' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundSize: '40px 34px',
              }}
            />
            <div className="relative z-10">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-inverse uppercase tracking-tight leading-[0.9] mb-4">
                Comece hoje,<br />gratuitamente.
              </h2>
              <p className="font-body text-text-inverse/60 text-sm sm:text-base mb-8">
                Sem cartão de crédito. Sem contrato. Cancele quando quiser.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 font-body font-bold text-base bg-background text-brand-lime px-8 py-4 rounded-full hover:bg-surface transition-all hover:scale-105"
              >
                Criar minha conta grátis
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-surface-border py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <LogoHorizontal size="sm" />
          <nav className="flex items-center gap-6 text-sm font-body text-text-secondary">
            <Link href="/termos" className="hover:text-text-primary transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-text-primary transition-colors">
              Política de Privacidade
            </Link>
            <a href="mailto:suporte@strivepersonal.com.br" className="hover:text-text-primary transition-colors">
              Contato
            </a>
          </nav>
          <p className="font-body text-text-secondary/50 text-xs">
            © {new Date().getFullYear()} Strive Personal. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
