import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
});

type Deal = {
  id: string;
  title: string;
  amount: number;
  status: string;
  deal_type: string;
  tx_signature: string | null;
  counterparty_wallet: string | null;
  created_at: string;
};

function TransactionsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("deals")
      .select("id, title, amount, status, deal_type, tx_signature, counterparty_wallet, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDeals((data as Deal[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground animate-fade-in">Транзакции</h1>
        <p className="mt-2 text-muted-foreground animate-fade-in">История всех сделок и транзакций Solana</p>

        <div className="mt-8 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
          ) : deals.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
              <p className="text-muted-foreground mb-4">Нет транзакций</p>
              <Link
                to="/create-deal"
                className="inline-flex rounded-xl bg-gradient-purple px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Создать первую сделку
              </Link>
            </div>
          ) : (
            deals.map((deal, i) => (
              <div
                key={deal.id}
                className="glass-card rounded-xl p-4 flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    deal.deal_type === "escrow" ? "bg-brand-green/10" : "bg-brand-purple/10"
                  }`}
                >
                  {deal.deal_type === "escrow" ? (
                    <ArrowUpRight className="h-5 w-5 text-brand-green" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-brand-purple" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">{deal.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString("ru-RU")}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        deal.status === "completed"
                          ? "bg-brand-green/10 text-brand-green"
                          : deal.status === "active"
                            ? "bg-brand-purple/10 text-brand-purple"
                            : deal.status === "disputed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {deal.status}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-foreground">{deal.amount} SOL</div>
                  {deal.tx_signature && (
                    <a
                      href={`https://explorer.solana.com/tx/${deal.tx_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-purple hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Explorer
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
