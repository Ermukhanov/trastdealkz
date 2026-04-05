import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const statusColors: Record<string, string> = {
  completed: "bg-brand-green/20 text-brand-green",
  active: "bg-brand-purple/20 text-brand-purple",
  pending: "bg-secondary text-muted-foreground",
  disputed: "bg-destructive/20 text-destructive",
  cancelled: "bg-secondary text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  completed: "Завершена",
  active: "Активна",
  pending: "Ожидание",
  disputed: "Спор",
  cancelled: "Отменена",
};

function DealsPage() {
  const [deals, setDeals] = useState<Tables<"deals">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      const { data } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });
      setDeals(data || []);
      setLoading(false);
    };
    fetchDeals();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Сделки</h1>
            <p className="mt-2 text-muted-foreground">Управляйте вашими сделками</p>
          </div>
          <Link
            to="/create-deal"
            className="flex items-center gap-2 rounded-xl bg-gradient-purple px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Создать
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card animate-pulse rounded-2xl p-6 h-20" />
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
              <p className="text-muted-foreground">Нет сделок. Создайте первую!</p>
              <Link
                to="/create-deal"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-purple px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Создать сделку
              </Link>
            </div>
          ) : (
            deals.map((deal, i) => (
              <div
                key={deal.id}
                className="glass-card flex items-center justify-between rounded-2xl p-6 transition-all hover:border-brand-purple/30 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <div>
                  <div className="font-semibold text-foreground">{deal.title}</div>
                  <div className="text-sm text-muted-foreground">{deal.amount} SOL</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[deal.status] || "bg-secondary text-muted-foreground"}`}>
                  {statusLabels[deal.status] || deal.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
