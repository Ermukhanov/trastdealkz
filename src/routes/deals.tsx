import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Plus, CheckCircle, Clock, AlertTriangle, XCircle, ArrowUpRight, FileCheck,
} from "lucide-react";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  completed: { label: "Завершена", color: "text-brand-green", bg: "bg-brand-green/20", icon: CheckCircle },
  active: { label: "Активна", color: "text-brand-purple", bg: "bg-brand-purple/20", icon: Clock },
  pending: { label: "Ожидание", color: "text-muted-foreground", bg: "bg-secondary", icon: Clock },
  disputed: { label: "Спор", color: "text-destructive", bg: "bg-destructive/20", icon: AlertTriangle },
  cancelled: { label: "Отменена", color: "text-muted-foreground", bg: "bg-secondary", icon: XCircle },
};

const categoryLabels: Record<string, string> = {
  supply: "Поставка", freelance: "Фриланс", labor: "Трудовой",
  rental: "Аренда", logistics: "Логистика", ecommerce: "E-commerce",
};

function DealsPage() {
  const [deals, setDeals] = useState<Tables<"deals">[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
      setDeals(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = filter === "all" ? deals : deals.filter((d) => d.status === filter);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Сделки</h1>
            <p className="mt-1 text-muted-foreground">Управляйте вашими сделками</p>
          </div>
          <Link to="/create-deal" className="flex items-center gap-2 rounded-xl bg-gradient-purple px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:scale-105">
            <Plus className="h-4 w-4" /> Создать
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          {["all", "pending", "active", "completed", "disputed", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-gradient-purple text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Все" : statusConfig[f]?.label || f}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="glass-card animate-pulse rounded-2xl p-6 h-24" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
              <p className="text-muted-foreground">Нет сделок</p>
              <Link to="/create-deal" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-purple px-6 py-3 text-sm font-medium text-primary-foreground">
                <Plus className="h-4 w-4" /> Создать сделку
              </Link>
            </div>
          ) : (
            filtered.map((deal, i) => {
              const sc = statusConfig[deal.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              return (
                <div
                  key={deal.id}
                  className="glass-card rounded-2xl p-6 transition-all hover:border-brand-purple/30 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{deal.title}</h3>
                        {deal.nft_mint_address && <FileCheck className="h-4 w-4 text-brand-green shrink-0" title="NFT Сертификат" />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{deal.amount} SOL</span>
                        <span>·</span>
                        <span>{categoryLabels[deal.category || ""] || deal.category}</span>
                        <span>·</span>
                        <span>{new Date(deal.created_at).toLocaleDateString("ru-RU")}</span>
                        {deal.verdict_law_ref && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-brand-purple">{deal.verdict_law_ref}</span>
                          </>
                        )}
                      </div>
                      {deal.verdict_text && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{deal.verdict_text}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`flex items-center gap-1.5 rounded-full ${sc.bg} px-3 py-1 text-xs font-medium ${sc.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {sc.label}
                      </span>
                      {deal.tx_signature && (
                        <a
                          href={`https://explorer.solana.com/tx/${deal.tx_signature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-secondary p-2 text-brand-green hover:bg-brand-green/10 transition-colors"
                          title="Посмотреть в Explorer"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
