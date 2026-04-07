import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  User, Shield, Star, TrendingUp, Award, CheckCircle,
  AlertTriangle, Clock, XCircle, ArrowUpRight, Search,
} from "lucide-react";

export const Route = createFileRoute("/user/$userId")({
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const [deals, setDeals] = useState<Tables<"deals">[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [dealsRes, reviewsRes] = await Promise.all([
        supabase.from("deals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("reviewee_id", userId).order("created_at", { ascending: false }),
      ]);
      if (!dealsRes.data || dealsRes.data.length === 0) {
        const reviewData = reviewsRes.data || [];
        if (reviewData.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }
      }
      setDeals(dealsRes.data || []);
      setReviews(reviewsRes.data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const completedDeals = deals.filter((d) => d.status === "completed").length;
  const totalVolume = deals.reduce((sum, d) => sum + Number(d.amount), 0);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const trustScore = reviews.length > 0
    ? Math.min(10, Math.round((Number(avgRating) * 0.6 + Math.min(completedDeals, 10) * 0.4) * 10) / 10)
    : Math.min(10, completedDeals * 0.5);

  const level = completedDeals >= 50 ? "Легенда" : completedDeals >= 20 ? "Эксперт" : completedDeals >= 10 ? "Про" : completedDeals >= 3 ? "Активный" : "Новичок";

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {[1, 2, 3].map((i) => <div key={i} className="glass-card animate-pulse rounded-2xl p-8 h-32" />)}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 flex flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Пользователь не найден</h2>
        <p className="text-sm text-muted-foreground">ID: {userId.slice(0, 8)}...</p>
        <Link to="/" className="text-brand-purple hover:underline text-sm">← На главную</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="glass-card rounded-2xl p-8 animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-brand-green/5" />
          <div className="relative flex items-start gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-purple text-2xl font-bold text-primary-foreground glow-purple">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Профиль пользователя</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">{userId.slice(0, 8)}...{userId.slice(-4)}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-brand-green">
                  <Award className="h-3 w-3" /> {level}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-green">
                  <Shield className="h-3 w-3" /> {trustScore}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          {[
            { icon: Shield, label: "TrustScore", value: `${trustScore}/10`, color: "text-brand-green" },
            { icon: Star, label: "Рейтинг", value: avgRating, color: "text-brand-purple" },
            { icon: CheckCircle, label: "Сделок", value: completedDeals.toString(), color: "text-brand-green" },
            { icon: TrendingUp, label: "Объём SOL", value: totalVolume.toFixed(2), color: "text-brand-purple" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-5 text-center hover:scale-[1.02] transition-transform">
              <s.icon className={`mx-auto h-6 w-6 ${s.color} mb-2`} />
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-purple" /> Отзывы ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Пока нет отзывов</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-purple text-xs font-bold text-primary-foreground">
                    {r.rating}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
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

        {/* Public deals */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" /> Публичные сделки
          </h3>
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Нет сделок</p>
          ) : (
            <div className="space-y-2">
              {deals.filter(d => d.status === "completed").slice(0, 10).map((deal) => (
                <Link
                  key={deal.id}
                  to="/deal/$dealId"
                  params={{ dealId: deal.id }}
                  className="flex items-center gap-3 rounded-xl bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
                >
                  <CheckCircle className="h-4 w-4 text-brand-green shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{deal.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground">{deal.amount} SOL</div>
                  {deal.tx_signature && (
                    <ArrowUpRight className="h-4 w-4 text-brand-green shrink-0" />
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
