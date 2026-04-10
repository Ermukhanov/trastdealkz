import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Shield, Users, Vote, AlertTriangle, CheckCircle, Clock,
  Gavel, Plus, ChevronRight, Award, TrendingUp, Scale,
  ThumbsUp, ThumbsDown, Minus, Eye, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/disputes")({
  component: DisputesPage,
  head: () => ({
    meta: [
      { title: "DAO Арбитраж — TrustDeal" },
      { name: "description", content: "Децентрализованный арбитраж с присяжными" },
    ],
  }),
});

interface Dispute {
  id: string;
  deal_id: string;
  initiator_id: string;
  deposit_amount: number;
  status: string;
  jury_count: number;
  side_a_claim: string;
  side_b_claim: string | null;
  verdict: string | null;
  verdict_side: string | null;
  verdict_percent: number | null;
  created_at: string;
  resolved_at: string | null;
}

interface JuryVote {
  id: string;
  dispute_id: string;
  juror_id: string;
  vote: string;
  reasoning: string | null;
  is_majority: boolean | null;
  reward_amount: number;
  penalty_amount: number;
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Ожидание присяжных", color: "text-yellow-400", icon: Clock },
  voting: { label: "Голосование", color: "text-brand-purple", icon: Vote },
  resolved: { label: "Решён", color: "text-brand-green", icon: CheckCircle },
  cancelled: { label: "Отменён", color: "text-muted-foreground", icon: AlertTriangle },
};

function DisputesPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [votes, setVotes] = useState<JuryVote[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newClaim, setNewClaim] = useState("");
  const [selectedDealId, setSelectedDealId] = useState("");
  const [userDeals, setUserDeals] = useState<{ id: string; title: string }[]>([]);
  const [myVote, setMyVote] = useState<string>("");
  const [myReasoning, setMyReasoning] = useState("");
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        supabase.from("deals").select("id, title").eq("user_id", u.id).then(({ data }) => {
          setUserDeals(data || []);
        });
      }
    });
    loadDisputes();
  }, []);

  async function loadDisputes() {
    setLoading(true);
    const { data } = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
    setDisputes((data as Dispute[]) || []);
    setLoading(false);
  }

  async function selectDispute(d: Dispute) {
    setSelected(d);
    const { data } = await supabase.from("jury_votes").select("*").eq("dispute_id", d.id);
    setVotes((data as JuryVote[]) || []);
  }

  async function createDispute() {
    if (!user || !selectedDealId || !newClaim.trim()) return;
    await supabase.from("disputes").insert({
      deal_id: selectedDealId,
      initiator_id: user.id,
      side_a_claim: newClaim.trim(),
      jury_count: 5,
      deposit_amount: 0.01,
    });
    setShowCreate(false);
    setNewClaim("");
    setSelectedDealId("");
    loadDisputes();
  }

  async function castVote(disputeId: string) {
    if (!user || !myVote) return;
    await supabase.from("jury_votes").insert({
      dispute_id: disputeId,
      juror_id: user.id,
      vote: myVote as any,
      reasoning: myReasoning || null,
    });
    setMyVote("");
    setMyReasoning("");
    if (selected) selectDispute(selected);
  }

  async function simulateDAO(dispute: Dispute) {
    setSimulating(true);
    // Simulate jury selection and voting
    const juryNames = ["Арбитр_KZ_01", "Арбитр_KZ_02", "Арбитр_KZ_03", "Арбитр_KZ_04", "Арбитр_KZ_05"];
    const possibleVotes: ("side_a" | "side_b" | "split")[] = ["side_a", "side_b", "split"];
    const simVotes: JuryVote[] = juryNames.map((name, i) => {
      const v = possibleVotes[Math.floor(Math.random() * 3)];
      return {
        id: `sim-${i}`,
        dispute_id: dispute.id,
        juror_id: `sim-juror-${i}`,
        vote: v,
        reasoning: v === "side_a" ? "Сторона А предоставила достаточные доказательства" :
          v === "side_b" ? "Сторона Б выполнила свои обязательства" :
          "Обе стороны частично правы, рекомендую разделить",
        is_majority: null,
        reward_amount: 0,
        penalty_amount: 0,
      };
    });

    // Determine majority
    const counts = { side_a: 0, side_b: 0, split: 0 };
    simVotes.forEach(v => counts[v.vote as keyof typeof counts]++);
    const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    simVotes.forEach(v => {
      v.is_majority = v.vote === majority;
      v.reward_amount = v.is_majority ? 0.002 : 0;
      v.penalty_amount = v.is_majority ? 0 : 0.001;
    });

    await new Promise(r => setTimeout(r, 2000));
    setVotes(simVotes);

    // Update dispute status
    await supabase.from("disputes").update({
      status: "resolved",
      verdict_side: majority as any,
      verdict_percent: majority === "split" ? 50 : majority === "side_a" ? 100 : 0,
      verdict: `Присяжные проголосовали: Сторона А — ${counts.side_a}, Сторона Б — ${counts.side_b}, Разделить — ${counts.split}. Решение: ${majority === "side_a" ? "В пользу стороны А" : majority === "side_b" ? "В пользу стороны Б" : "Разделить средства поровну"}.`,
      resolved_at: new Date().toISOString(),
    }).eq("id", dispute.id);

    setSelected({ ...dispute, status: "resolved", verdict_side: majority, verdict: "Resolved" });
    setSimulating(false);
    loadDisputes();
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Scale className="h-8 w-8 text-brand-purple" />
              DAO Арбитраж
            </h1>
            <p className="text-muted-foreground mt-1">Децентрализованное разрешение споров присяжными</p>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-gradient-purple px-5 py-3 text-sm font-semibold text-primary-foreground glow-purple">
              <Plus className="h-4 w-4" /> Создать спор
            </button>
          )}
        </div>

        {/* How it works */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: AlertTriangle, title: "1. Оспорить", desc: "Внесите залог 0.01 SOL", color: "text-yellow-400" },
            { icon: Users, title: "2. Присяжные", desc: "5-11 случайных экспертов", color: "text-brand-purple" },
            { icon: Vote, title: "3. Голосование", desc: "Изучают доказательства", color: "text-blue-400" },
            { icon: Award, title: "4. Стимулы", desc: "Большинство получает награду", color: "text-brand-green" },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 text-center">
              <s.icon className={`h-8 w-8 mx-auto mb-2 ${s.color}`} />
              <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <div className="glass-card rounded-3xl p-8 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-brand-purple" /> Создать спор
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Сделка</label>
                  <select
                    value={selectedDealId}
                    onChange={e => setSelectedDealId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                  >
                    <option value="">Выберите сделку</option>
                    {userDeals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Ваша позиция</label>
                  <textarea
                    value={newClaim}
                    onChange={e => setNewClaim(e.target.value)}
                    rows={3}
                    placeholder="Опишите вашу претензию..."
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground resize-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Залог: 0.01 SOL (возвращается при выигрыше)</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-border py-3 text-foreground hover:bg-secondary">Отмена</button>
                  <button onClick={createDispute} disabled={!selectedDealId || !newClaim.trim()} className="flex-1 rounded-xl bg-gradient-purple py-3 text-primary-foreground font-semibold disabled:opacity-50">Создать</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disputes list */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold text-foreground mb-3">Споры</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : disputes.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Нет активных споров</p>
              </div>
            ) : (
              disputes.map(d => {
                const st = statusMap[d.status] || statusMap.pending;
                return (
                  <button key={d.id} onClick={() => selectDispute(d)}
                    className={`w-full glass-card rounded-2xl p-4 text-left transition-all hover:ring-2 hover:ring-brand-purple/50 ${selected?.id === d.id ? "ring-2 ring-brand-purple" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                        <st.icon className="h-3.5 w-3.5" /> {st.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("ru")}</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{d.side_a_claim}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {d.jury_count} присяжных
                      <span className="ml-auto">{d.deposit_amount} SOL</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Scale className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Выберите спор для просмотра деталей</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Dispute info */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">Детали спора</h3>
                    {selected.status === "pending" && user && (
                      <button onClick={() => simulateDAO(selected)} disabled={simulating}
                        className="flex items-center gap-2 rounded-xl bg-gradient-purple px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                        {simulating ? <Clock className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {simulating ? "Симуляция..." : "Запустить DAO"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Позиция Стороны А (инициатор)</span>
                      <p className="text-sm text-foreground mt-1 p-3 rounded-xl bg-secondary/50">{selected.side_a_claim}</p>
                    </div>
                    {selected.side_b_claim && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Позиция Стороны Б</span>
                        <p className="text-sm text-foreground mt-1 p-3 rounded-xl bg-secondary/50">{selected.side_b_claim}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verdict */}
                {selected.status === "resolved" && selected.verdict && (
                  <div className="glass-card rounded-2xl p-6 border-2 border-brand-green/30">
                    <h3 className="text-lg font-bold text-brand-green flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5" /> Вердикт DAO
                    </h3>
                    <p className="text-sm text-foreground">{selected.verdict}</p>
                  </div>
                )}

                {/* Jury votes */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-purple" /> Голоса присяжных ({votes.length})
                  </h3>
                  {votes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Ожидание голосования присяжных...</p>
                  ) : (
                    <div className="space-y-3">
                      {votes.map((v, i) => (
                        <div key={v.id} className={`rounded-xl p-4 border ${v.is_majority ? "border-brand-green/40 bg-brand-green/5" : v.is_majority === false ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground flex items-center gap-2">
                              {v.vote === "side_a" ? <ThumbsUp className="h-4 w-4 text-blue-400" /> :
                               v.vote === "side_b" ? <ThumbsDown className="h-4 w-4 text-orange-400" /> :
                               <Minus className="h-4 w-4 text-yellow-400" />}
                              Присяжный #{i + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              {v.is_majority !== null && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${v.is_majority ? "bg-brand-green/20 text-brand-green" : "bg-destructive/20 text-destructive"}`}>
                                  {v.is_majority ? `+${v.reward_amount} SOL` : `-${v.penalty_amount} рейтинг`}
                                </span>
                              )}
                            </div>
                          </div>
                          {v.reasoning && <p className="text-xs text-muted-foreground">{v.reasoning}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cast vote */}
                {selected.status === "voting" && user && !votes.find(v => v.juror_id === user.id) && (
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">Ваш голос</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { val: "side_a", label: "Сторона А", icon: ThumbsUp, color: "border-blue-400 bg-blue-400/10" },
                        { val: "side_b", label: "Сторона Б", icon: ThumbsDown, color: "border-orange-400 bg-orange-400/10" },
                        { val: "split", label: "Разделить", icon: Minus, color: "border-yellow-400 bg-yellow-400/10" },
                      ].map(opt => (
                        <button key={opt.val} onClick={() => setMyVote(opt.val)}
                          className={`rounded-xl border-2 p-4 text-center transition-all ${myVote === opt.val ? opt.color : "border-border hover:border-muted-foreground"}`}>
                          <opt.icon className="h-5 w-5 mx-auto mb-1 text-foreground" />
                          <span className="text-xs font-medium text-foreground">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    <textarea value={myReasoning} onChange={e => setMyReasoning(e.target.value)} rows={2} placeholder="Обоснование..." className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground resize-none mb-3" />
                    <button onClick={() => castVote(selected.id)} disabled={!myVote} className="w-full rounded-xl bg-gradient-purple py-3 text-primary-foreground font-semibold disabled:opacity-50">Проголосовать</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
