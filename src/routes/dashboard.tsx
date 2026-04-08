import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import Onboarding from "@/components/Onboarding";
import {
  LayoutDashboard, FileText, TrendingUp, Shield, Clock,
  CheckCircle, AlertTriangle, Plus, ArrowUpRight, Bot,
  Wallet, Star,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const statusLabels: Record<string, string> = {
  completed: "Завершена", active: "Активна", pending: "Ожидание",
  disputed: "Спор", cancelled: "Отменена",
};
const statusColors: Record<string, string> = {
  completed: "text-brand-green", active: "text-brand-purple",
  pending: "text-muted-foreground", disputed: "text-destructive", cancelled: "text-muted-foreground",
};

function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [deals, setDeals] = useState<Tables<"deals">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const done = localStorage.getItem("td-onboarding-done");
        if (!done) setShowOnboarding(true);
        const { data } = await supabase.from("deals").select("*").eq("user_id", u.id).order("created_at", { ascending: false });
        setDeals(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const active = deals.filter((d) => d.status === "active" || d.status === "pending").length;
  const completed = deals.filter((d) => d.status === "completed").length;
  const disputed = deals.filter((d) => d.status === "disputed").length;
  const totalVol = deals.reduce((s, d) => s + Number(d.amount), 0);

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4">
        <div className="mx-auto max-w-md glass-card rounded-2xl p-12 text-center mt-12 animate-fade-in">
          <LayoutDashboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">Войдите для доступа к дашборду</h2>
          <Link to="/login" className="mt-4 inline-flex rounded-xl bg-gradient-purple px-6 py-3 text-sm font-medium text-primary-foreground">Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              👋 {user?.email?.split("@")[0] || "Дашборд"}
            </h1>
            <p className="mt-1 text-muted-foreground">Обзор ваших сделок и аналитика</p>
          </div>
          <Link to="/create-deal" className="flex items-center gap-2 rounded-xl bg-gradient-purple px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 hover:scale-105 transition-all glow-purple">
            <Plus className="h-4 w-4" /> Новая сделка
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          {[
            { icon: FileText, label: "Активные", value: active, color: "text-brand-purple", gradient: "bg-brand-purple/10" },
            { icon: CheckCircle, label: "Завершённые", value: completed, color: "text-brand-green", gradient: "bg-brand-green/10" },
            { icon: AlertTriangle, label: "Споры", value: disputed, color: "text-destructive", gradient: "bg-destructive/10" },
            { icon: TrendingUp, label: "Объём SOL", value: totalVol.toFixed(2), color: "text-brand-green", gradient: "bg-brand-green/10" },
          ].map((s, i) => (
            <div key={s.label} className="glass-card rounded-2xl p-6 animate-fade-in group hover:scale-[1.02] transition-transform" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.gradient} mb-3`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          {[
            { to: "/create-deal" as const, icon: Plus, title: "Создать сделку", desc: "Эскроу, прямая или NFT", gradient: "bg-gradient-green", borderHover: "hover:border-brand-green/30" },
            { to: "/ai-assistant" as const, icon: Bot, title: "AI Ассистент", desc: "Анализ рисков, законы РК", gradient: "bg-gradient-purple", borderHover: "hover:border-brand-purple/30" },
            { to: "/wallet" as const, icon: Wallet, title: "Кошелёк Solana", desc: "Баланс и транзакции", gradient: "bg-brand-purple/10", borderHover: "hover:border-brand-purple/30" },
          ].map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={`glass-card rounded-2xl p-6 flex items-center gap-4 ${item.borderHover} transition-all hover:scale-[1.02] animate-fade-in`}
              style={{ animationDelay: `${320 + i * 80}ms`, animationFillMode: "both" }}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.gradient}`}>
                <item.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Deals */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "560ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" /> Последние сделки
            </h3>
            <Link to="/deals" className="text-sm text-brand-purple hover:underline flex items-center gap-1">
              Все сделки <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse rounded-xl bg-secondary h-16" />)}</div>
          ) : deals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Нет сделок. Создайте первую!</p>
              <Link to="/create-deal" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-purple px-5 py-2.5 text-sm font-medium text-primary-foreground">
                <Plus className="h-4 w-4" /> Создать
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {deals.slice(0, 5).map((deal) => (
                <Link
                  key={deal.id}
                  to="/deal/$dealId"
                  params={{ dealId: deal.id }}
                  className="flex items-center gap-4 rounded-xl bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{deal.title}</div>
                    <div className="text-xs text-muted-foreground">{deal.category} · {new Date(deal.created_at).toLocaleDateString("ru-RU")}</div>
                  </div>
                  <div className="text-sm font-medium text-foreground">{deal.amount} SOL</div>
                  <span className={`text-xs font-medium ${statusColors[deal.status]}`}>{statusLabels[deal.status]}</span>
                  {deal.tx_signature && (
                    <a
                      href={`https://explorer.solana.com/tx/${deal.tx_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ArrowUpRight className="h-4 w-4 text-brand-green" />
                    </a>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
