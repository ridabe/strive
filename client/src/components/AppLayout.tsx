import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/" },
  { icon: Users,           label: "Alunos",      href: "/alunos" },
  { icon: Dumbbell,        label: "Treinos",      href: "/treinos" },
  { icon: ClipboardList,   label: "Avaliações",   href: "/avaliacoes" },
  { icon: Activity,        label: "Frequência",   href: "/frequencia" },
  { icon: CreditCard,      label: "Financeiro",   href: "/financeiro" },
  { icon: BarChart3,       label: "Relatórios",   href: "/relatorios" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E0E1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#E8FF47] border-t-transparent animate-spin" />
          <span className="text-[#B0B0C3] text-sm font-sans">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E0E1A]">
        <div className="card-surface p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
          {/* Logo mark */}
          <div className="w-16 h-16 rounded-2xl bg-[#E8FF47]/10 border border-[#E8FF47]/20 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-[#E8FF47]" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl text-white mb-2">STRIVE PERSONAL</h1>
            <p className="text-[#B0B0C3] text-sm leading-relaxed">
              Acesso restrito ao personal trainer. Faça login com sua conta de administrador.
            </p>
          </div>
          <a
            href={getLoginUrl()}
            className="w-full py-3 rounded-full bg-[#E8FF47] text-black font-bold text-sm text-center hover:bg-[#C8E600] transition-colors duration-150 active:scale-[0.97]"
          >
            Entrar no Sistema
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0E0E1A]">
      {/* ── Sidebar ── */}
      <aside
        className={`
          flex flex-col shrink-0 transition-all duration-300
          bg-[#0E0E1A] border-r border-[#2A2A45]
          ${collapsed ? "w-[68px]" : "w-[220px]"}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#2A2A45] ${collapsed ? "justify-center px-0" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-[#E8FF47]/10 border border-[#E8FF47]/25 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-[#E8FF47]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display text-[11px] text-white leading-tight tracking-wide">STRIVE</p>
              <p className="font-display text-[9px] text-[#E8FF47] leading-tight tracking-widest">PERSONAL</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                  ${active
                    ? "bg-[#E8FF47]/10 text-[#E8FF47] border border-[#E8FF47]/20"
                    : "text-[#B0B0C3] hover:bg-[#1A1A2E] hover:text-white border border-transparent"
                  }
                  ${collapsed ? "justify-center px-0" : ""}
                `}
                title={collapsed ? label : undefined}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[#E8FF47]" : "text-[#B0B0C3] group-hover:text-white"}`} />
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8FF47] shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        <div className={`border-t border-[#2A2A45] p-3 flex flex-col gap-2 ${collapsed ? "items-center" : ""}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 px-1 py-1">
              <div className="w-7 h-7 rounded-full bg-[#E8FF47]/15 border border-[#E8FF47]/25 flex items-center justify-center shrink-0">
                <span className="text-[#E8FF47] text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
                </span>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-white text-xs font-medium truncate">{user?.name ?? "Personal"}</p>
                <p className="text-[#B0B0C3] text-[10px] truncate">Administrador</p>
              </div>
            </div>
          )}
          <button
            onClick={() => logout.mutate()}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl text-[#B0B0C3] hover:text-[#EF4444] hover:bg-[#EF4444]/10
              transition-colors duration-150 text-sm w-full
              ${collapsed ? "justify-center px-0" : ""}
            `}
            title="Sair"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute left-[calc(var(--sidebar-w)-12px)] top-[72px] w-6 h-6 rounded-full bg-[#1A1A2E] border border-[#2A2A45] flex items-center justify-center text-[#B0B0C3] hover:text-[#E8FF47] hover:border-[#E8FF47]/40 transition-colors z-50"
          style={{ "--sidebar-w": collapsed ? "68px" : "220px" } as React.CSSProperties}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-[#2A2A45] flex items-center px-6 gap-4 shrink-0 bg-[#0E0E1A]">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#E8FF47]/15 border border-[#E8FF47]/25 flex items-center justify-center">
              <span className="text-[#E8FF47] text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "P"}
              </span>
            </div>
            <span className="text-[#B0B0C3] text-sm hidden sm:block">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
