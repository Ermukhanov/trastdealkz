import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  User, Shield, Star, TrendingUp, Award,
  ArrowUpRight, Clock, CheckCircle, XCircle, AlertTriangle,
  Sun, Moon, Globe,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { publicKey } = useWallet();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [deals, setDeals] = useState<Tables<"deals">[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const [dealsRes, reviewsRes] = await Promise.all([
          supabase.from("deals").select("*").eq("user_id", u.id).order("created_at", { ascending: false }),
          supabase.from("reviews").select("*").eq("reviewee_id", u.id).order("created_at", { ascending: false }),
        ]);
        setDeals(dealsRes.data || []);
        setReviews(reviewsRes.data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const completedDeals = deals.filter((d) => d.status === "completed").length;
  const _activeDeals = deals.filter((d) => d.status === "active" || d.status === "pending").length;
  const totalVolume = deals.reduce((sum, d) => sum + Number(d.amount), 0);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const trustScore = reviews.length > 0
    ? Math.min(10, Math.round((Number(avgRating) * 0.6 + Math.min(completedDeals, 10) * 0.4) * 10) / 10)
    : Math.min(10, completedDeals * 0.5);

  const level = completedDeals >= 50 ? "Легенда" : completedDeals >= 20 ? "Эксперт" : completedDeals >= 10 ? "Про" : completedDeals >= 3 ? "Активный" : "Новичок";
  const levelColor = completedDeals >= 20 ? "text-brand-green" : completedDeals >= 10 ? "text-brand-purple" : "text-muted-foreground";

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {[1, 2, 3].map((i) => <div key={i} className="glass-card animate-pulse rounded-2xl p-8 h-32" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4">
        <div className="mx-auto max-w-md glass-card rounded-2xl p-12 text-center mt-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">Войдите в аккаунт</h2>
          <p className="mt-2 text-sm text-muted-foreground">Для просмотра профиля необходимо авторизоваться</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="glass-card rounded-2xl p-8 animate-fade-in">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-purple text-2xl font-bold text-primary-foreground glow-purple">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{user.email?.split("@")[0]}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className={`flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium ${levelColor}`}>
                  <Award className="h-3 w-3" />
                  {level}
                </span>
                {publicKey && (
                  <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-mono text-brand-green">
                    {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TrustScore + Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="glass-card rounded-2xl p-5 text-center">
            <Shield className="mx-auto h-6 w-6 text-brand-green mb-2" />
            <div className="text-2xl font-bold text-brand-green">{trustScore}/10</div>
            <div className="text-xs text-muted-foreground">TrustScore</div>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <Star className="mx-auto h-6 w-6 text-brand-purple mb-2" />
            <div className="text-2xl font-bold text-foreground">{avgRating}</div>
            <div className="text-xs text-muted-foreground">Рейтинг ({reviews.length} отз.)</div>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <CheckCircle className="mx-auto h-6 w-6 text-brand-green mb-2" />
            <div className="text-2xl font-bold text-foreground">{completedDeals}</div>
            <div className="text-xs text-muted-foreground">Завершённых</div>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-brand-purple mb-2" />
            <div className="text-2xl font-bold text-foreground">{totalVolume.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Объём SOL</div>
          </div>
        </div>

        {/* TrustScore bar */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-green" />
            TrustScore — Рейтинг доверия
          </h3>
          <div className="space-y-3">
            {[
              { label: "Завершённые сделки", value: Math.min(completedDeals * 10, 100), color: "bg-brand-green" },
              { label: "Средняя оценка", value: reviews.length ? Number(avgRating) * 10 : 0, color: "bg-brand-purple" },
              { label: "Оперативность", value: completedDeals > 0 ? 85 : 0, color: "bg-brand-green" },
              { label: "Без споров", value: deals.filter(d => d.status === "disputed").length === 0 ? 100 : 50, color: "bg-brand-purple" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-purple" />
            Отзывы
          </h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Пока нет отзывов</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-purple text-xs font-bold text-primary-foreground">
                    {r.rating}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 10 }, (_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-brand-green fill-brand-green" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            История сделок
          </h3>
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Нет сделок</p>
          ) : (
            <div className="space-y-2">
              {deals.slice(0, 10).map((deal) => {
                const statusIcon = deal.status === "completed" ? <CheckCircle className="h-4 w-4 text-brand-green" /> :
                  deal.status === "disputed" ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
                  deal.status === "cancelled" ? <XCircle className="h-4 w-4 text-muted-foreground" /> :
                  <Clock className="h-4 w-4 text-brand-purple" />;
                return (
                  <div key={deal.id} className="flex items-center gap-3 rounded-xl bg-secondary/30 p-3 transition-colors hover:bg-secondary/50">
                    {statusIcon}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{deal.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(deal.created_at).toLocaleDateString("ru-RU")}
                        {deal.verdict_law_ref && ` · ${deal.verdict_law_ref}`}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-foreground">{deal.amount} SOL</div>
                    {deal.tx_signature && (
                      <a
                        href={`https://explorer.solana.com/tx/${deal.tx_signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-green hover:underline"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
