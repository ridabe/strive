import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Dumbbell, Zap, BarChart3, Users } from "lucide-react";

const FEATURES = [
  { icon: Users,    label: "Gestão completa de alunos" },
  { icon: Dumbbell, label: "Prescrição de treinos" },
  { icon: BarChart3,label: "Acompanhamento de evolução" },
  { icon: Zap,      label: "Controle financeiro" },
];

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#0E0E1A] flex">
      {/* ── Painel esquerdo — identidade visual ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden px-16 py-14">
        {/* Fundo com gradiente e textura */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0E0E1A] via-[#111120] to-[#0a0a16]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #E8FF47 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Círculo de brilho */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#E8FF47]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#E8FF47]/4 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8FF47]/10 border border-[#E8FF47]/25 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-[#E8FF47]" />
          </div>
          <div>
            <p className="font-display text-[13px] text-white tracking-widest leading-tight">STRIVE</p>
            <p className="font-display text-[10px] text-[#E8FF47] tracking-[0.3em] leading-tight">PERSONAL</p>
          </div>
        </div>

        {/* Headline central */}
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <h1 className="font-display text-4xl xl:text-5xl text-white leading-[1.1] mb-4">
              ELEVE O NÍVEL<br />
              <span className="text-[#E8FF47]">DOS SEUS</span><br />
              RESULTADOS
            </h1>
            <p className="text-[#B0B0C3] text-base leading-relaxed max-w-sm">
              Plataforma completa para personal trainers gerenciarem alunos, treinos e evolução em um só lugar.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8FF47]/10 border border-[#E8FF47]/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#E8FF47]" />
                </div>
                <span className="text-[#B0B0C3] text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <div className="relative z-10">
          <p className="text-[#B0B0C3]/50 text-xs">© 2025 Strive Personal. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* ── Painel direito — formulário de acesso ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-14 relative">
        <div className="absolute inset-0 bg-[#0E0E1A] lg:bg-[#0a0a16]" />

        <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-8">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#E8FF47]/10 border border-[#E8FF47]/25 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[#E8FF47]" />
            </div>
            <div>
              <p className="font-display text-[13px] text-white tracking-widest leading-tight">STRIVE</p>
              <p className="font-display text-[10px] text-[#E8FF47] tracking-[0.3em] leading-tight">PERSONAL</p>
            </div>
          </div>

          {/* Card de login */}
          <div className="card-surface p-8 flex flex-col gap-6">
            <div>
              <h2 className="font-display text-xl text-white mb-1">ACESSO AO SISTEMA</h2>
              <p className="text-[#B0B0C3] text-sm leading-relaxed">
                Área exclusiva para o personal trainer. Faça login com sua conta para continuar.
              </p>
            </div>

            {/* Divisor */}
            <div className="h-px bg-[#2A2A45]" />

            {/* CTA principal */}
            <div className="flex flex-col gap-3">
              <a
                href={getLoginUrl()}
                className="
                  w-full py-3.5 rounded-full bg-[#E8FF47] text-black font-bold text-sm text-center
                  hover:bg-[#C8E600] transition-all duration-150 active:scale-[0.97]
                  lime-glow-sm flex items-center justify-center gap-2
                "
              >
                <Zap className="w-4 h-4" />
                Entrar com Manus
              </a>
              <p className="text-[#B0B0C3]/60 text-xs text-center leading-relaxed">
                Ao entrar, você concorda com os termos de uso da plataforma.
              </p>
            </div>

            {/* Info de acesso restrito */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#E8FF47]/5 border border-[#E8FF47]/15">
              <div className="w-5 h-5 rounded-full bg-[#E8FF47]/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[#E8FF47] text-[10px] font-bold">!</span>
              </div>
              <p className="text-[#B0B0C3] text-xs leading-relaxed">
                Este sistema é de acesso restrito. Apenas o personal trainer administrador pode acessar o painel.
              </p>
            </div>
          </div>

          {/* Rodapé mobile */}
          <p className="text-[#B0B0C3]/40 text-xs text-center lg:hidden">
            © 2025 Strive Personal
          </p>
        </div>
      </div>
    </div>
  );
}
