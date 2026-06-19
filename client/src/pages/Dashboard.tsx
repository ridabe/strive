import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, Dumbbell, Gift, AlertTriangle,
  TrendingUp, Clock, ChevronRight, Calendar,
  Activity, CreditCard,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatCurrency(v: string | number | null | undefined) {
  if (v == null) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function daysUntil(dateStr: string | Date | null | undefined) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return diff;
}

function birthdayDay(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  accent?: "lime" | "warning" | "error" | "info";
  loading?: boolean;
}

function KpiCard({ icon: Icon, label, value, sub, accent = "lime", loading }: KpiCardProps) {
  const accentMap = {
    lime:    { bg: "bg-[#E8FF47]/10", border: "border-[#E8FF47]/20", icon: "text-[#E8FF47]", value: "text-[#E8FF47]" },
    warning: { bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/20", icon: "text-[#F59E0B]", value: "text-[#F59E0B]" },
    error:   { bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20", icon: "text-[#EF4444]", value: "text-[#EF4444]" },
    info:    { bg: "bg-[#60A5FA]/10", border: "border-[#60A5FA]/20", icon: "text-[#60A5FA]", value: "text-[#60A5FA]" },
  };
  const c = accentMap[accent];

  return (
    <div className={`card-surface p-5 flex flex-col gap-4 hover:border-[#3A3A55] transition-colors duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <TrendingUp className="w-4 h-4 text-[#B0B0C3]/30" />
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          <div className="h-8 w-16 bg-[#2A2A45] rounded animate-pulse" />
          <div className="h-3 w-24 bg-[#2A2A45] rounded animate-pulse" />
        </div>
      ) : (
        <div>
          <p className={`text-3xl font-extrabold tracking-tight ${c.value} leading-none mb-1`}>{value}</p>
          <p className="text-[#B0B0C3] text-xs">{label}</p>
          {sub && <p className="text-[#B0B0C3]/60 text-[11px] mt-0.5">{sub}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, action }: { icon: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#E8FF47]" />
        <h2 className="font-display text-sm text-white tracking-wide">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { data: kpis, isLoading: kpisLoading } = trpc.dashboard.kpis.useQuery();
  const { data: expiring, isLoading: expiringLoading } = trpc.dashboard.expiringPlans.useQuery();
  const { data: birthdays, isLoading: birthdaysLoading } = trpc.dashboard.birthdays.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.recentActivity.useQuery();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">

      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#B0B0C3] text-sm mb-1">{greeting()},</p>
          <h1 className="font-display text-2xl text-white leading-tight">
            {user?.name?.split(" ")[0]?.toUpperCase() ?? "PERSONAL"}
          </h1>
          <p className="text-[#B0B0C3]/60 text-xs mt-1">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E8FF47]/5 border border-[#E8FF47]/15">
          <div className="w-2 h-2 rounded-full bg-[#E8FF47] animate-pulse" />
          <span className="text-[#E8FF47] text-xs font-medium">Sistema ativo</span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Alunos ativos"
          value={kpis?.activeStudents ?? 0}
          sub="no momento"
          accent="lime"
          loading={kpisLoading}
        />
        <KpiCard
          icon={Dumbbell}
          label="Treinos na semana"
          value={kpis?.weekWorkouts ?? 0}
          sub="últimos 7 dias"
          accent="info"
          loading={kpisLoading}
        />
        <KpiCard
          icon={Gift}
          label="Aniversariantes"
          value={kpis?.birthdaysThisMonth ?? 0}
          sub="este mês"
          accent="warning"
          loading={kpisLoading}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Planos vencendo"
          value={kpis?.expiringPlans ?? 0}
          sub="próximos 7 dias"
          accent={kpis?.expiringPlans ? "error" : "lime"}
          loading={kpisLoading}
        />
      </div>

      {/* ── Grid inferior ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Alertas de vencimento */}
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeader
            icon={CreditCard}
            title="PLANOS VENCENDO EM 7 DIAS"
            action={
              <button className="flex items-center gap-1 text-[#E8FF47] text-xs hover:underline">
                Ver todos <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          {expiringLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-[#2A2A45] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !expiring?.length ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#22C55E]" />
              </div>
              <p className="text-[#B0B0C3] text-sm">Nenhum plano vencendo nos próximos 7 dias</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {expiring.map(plan => {
                const days = daysUntil(plan.dueDate);
                const isToday = days === 0;
                const isOverdue = days !== null && days < 0;
                return (
                  <div
                    key={plan.id}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-colors
                      ${isOverdue
                        ? "bg-[#EF4444]/5 border-[#EF4444]/20"
                        : isToday
                        ? "bg-[#F59E0B]/5 border-[#F59E0B]/20"
                        : "bg-[#1A1A2E] border-[#2A2A45] hover:border-[#3A3A55]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2A2A45] flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{getInitials(plan.studentName ?? "")}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{plan.studentName}</p>
                        <p className="text-[#B0B0C3] text-xs">{plan.planName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-semibold">{formatCurrency(plan.amount)}</p>
                      <p className={`text-xs ${isOverdue ? "text-[#EF4444]" : isToday ? "text-[#F59E0B]" : "text-[#B0B0C3]"}`}>
                        {isOverdue ? `${Math.abs(days!)}d atrasado` : isToday ? "Vence hoje" : `${days}d restantes`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Aniversariantes */}
        <div className="card-surface p-5">
          <SectionHeader icon={Gift} title="ANIVERSARIANTES DO MÊS" />
          {birthdaysLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-[#2A2A45] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !birthdays?.length ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <p className="text-[#B0B0C3] text-sm text-center">Nenhum aniversariante este mês</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {birthdays.map(s => {
                const today = new Date();
                const bDay = s.birthDate ? new Date(s.birthDate) : null;
                const isToday = bDay
                  ? bDay.getDate() === today.getDate() && bDay.getMonth() === today.getMonth()
                  : false;
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${isToday ? "bg-[#F59E0B]/10 border border-[#F59E0B]/20" : "hover:bg-[#1A1A2E]"} transition-colors`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isToday ? "bg-[#F59E0B] text-black" : "bg-[#2A2A45] text-white"}`}>
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[#B0B0C3] text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {birthdayDay(s.birthDate)}
                        {isToday && <span className="text-[#F59E0B] font-medium ml-1">🎂 Hoje!</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Atividade recente ── */}
      <div className="card-surface p-5">
        <SectionHeader
          icon={Clock}
          title="ATIVIDADE RECENTE"
          action={
            <button className="flex items-center gap-1 text-[#E8FF47] text-xs hover:underline">
              Ver frequência <ChevronRight className="w-3 h-3" />
            </button>
          }
        />
        {activityLoading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-12 bg-[#2A2A45] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !activity?.length ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8FF47]/10 border border-[#E8FF47]/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[#E8FF47]" />
            </div>
            <p className="text-[#B0B0C3] text-sm">Nenhum treino registrado ainda</p>
            <p className="text-[#B0B0C3]/60 text-xs">Os treinos executados pelos alunos aparecerão aqui</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activity.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A2E] border border-[#2A2A45] hover:border-[#3A3A55] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#E8FF47]/10 border border-[#E8FF47]/20 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-[#E8FF47]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{a.studentName}</p>
                  <p className="text-[#B0B0C3] text-xs truncate">{a.workoutName ?? "Treino livre"}</p>
                </div>
                <p className="text-[#B0B0C3]/60 text-[11px] shrink-0">{formatTime(a.attendedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
