import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  ArrowLeft, Shield, Zap, FileCheck, CheckCircle, Clock,
  AlertTriangle, XCircle, ArrowUpRight, Share2, MessageSquare,
  Upload, Send, Gavel, ExternalLink, Copy, Check,
} from "lucide-react";

export const Route = createFileRoute("/deal/$dealId")({
  component: DealDetailPage,
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

const dealTypeConfig: Record<string, { label: string; icon: any }> = {
  escrow: { label: "Эскроу", icon: Shield },
  direct: { label: "Прямая", icon: Zap },
  nft: { label: "NFT", icon: FileCheck },
};

function DealDetailPage() {
  const { dealId } = Route.useParams();
  const [deal, setDeal] = useState<Tables<"deals"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI verdict
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVerdict, setAiVerdict] = useState("");

  // Proof upload
  const [proofText, setProofText] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data }, { data: { user } }] = await Promise.all([
        supabase.from("deals").select("*").eq("id", dealId).single(),
        supabase.auth.getUser(),
      ]);
      setDeal(data);
      setCurrentUser(user?.id || null);
      setLoading(false);
    };
    load();
  }, [dealId]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/deal/${dealId}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Сделка TrustDeal: ${deal?.title}\n${shareUrl}`)}`, "_blank");
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Сделка TrustDeal: ${deal?.title}`)}`, "_blank");
  };

  const requestAiVerdict = async () => {
    if (!deal) return;
    setAiLoading(true);
    setAiVerdict("");

    const prompt = `Проанализируй эту сделку и вынеси вердикт:

**Название:** ${deal.title}
**Тип:** ${dealTypeConfig[deal.deal_type]?.label}
**Категория:** ${categoryLabels[deal.category || ""] || deal.category}
**Сумма:** ${deal.amount} SOL
**Описание:** ${deal.description || "Не указано"}
**Статус:** ${statusConfig[deal.status]?.label}
${deal.proof_description ? `**Доказательства:** ${deal.proof_description}` : ""}
${deal.counterparty_wallet ? `**Кошелёк контрагента:** ${deal.counterparty_wallet}` : ""}

Вынеси вердикт со ссылкой на законы РК, укажи процент выплаты.`;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        }
      );

      if (!res.ok) throw new Error("AI error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const j = JSON.parse(line.slice(6));
            const delta = j.choices?.[0]?.delta?.content || "";
            full += delta;
            setAiVerdict(full);
          } catch {}
        }
      }
    } catch {
      setAiVerdict("Ошибка получения вердикта AI. Попробуйте позже.");
    }
    setAiLoading(false);
  };

  const submitProof = async () => {
    if (!deal || !proofText.trim()) return;
    setProofSubmitting(true);
    await supabase.from("deals").update({
      proof_description: proofText.trim(),
      proof_hash: btoa(proofText.trim()).slice(0, 32),
    }).eq("id", deal.id);
    setDeal({ ...deal, proof_description: proofText.trim() });
    setProofText("");
    setProofSubmitting(false);
  };

  const acceptDeal = async () => {
    if (!deal) return;
    await supabase.from("deals").update({ status: "active" }).eq("id", deal.id);
    setDeal({ ...deal, status: "active" });
  };

  const completeDeal = async () => {
    if (!deal) return;
    await supabase.from("deals").update({ status: "completed" }).eq("id", deal.id);
    setDeal({ ...deal, status: "completed" });
  };

  const disputeDeal = async () => {
    if (!deal) return;
    await supabase.from("deals").update({ status: "disputed" }).eq("id", deal.id);
    setDeal({ ...deal, status: "disputed" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 animate-pulse text-muted-foreground">Загрузка сделки...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">🔍</div>
        <h2 className="text-xl font-bold text-foreground">Сделка не найдена</h2>
        <Link to="/deals" className="text-brand-purple hover:underline text-sm">← К списку сделок</Link>
      </div>
    );
  }

  const sc = statusConfig[deal.status] || statusConfig.pending;
  const StatusIcon = sc.icon;
  const dt = dealTypeConfig[deal.deal_type] || dealTypeConfig.escrow;
  const DealIcon = dt.icon;
  const isOwner = currentUser === deal.user_id;

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="mx-auto max-w-3xl">
        <Link to="/deals" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Назад к сделкам
        </Link>

        {/* Header */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-purple">
                  <DealIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{deal.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{dt.label}</span>
                    <span>·</span>
                    <span>{categoryLabels[deal.category || ""] || deal.category}</span>
                  </div>
                </div>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 rounded-full ${sc.bg} px-4 py-1.5 text-sm font-medium ${sc.color}`}>
              <StatusIcon className="h-4 w-4" />
              {sc.label}
            </span>
          </div>

          {/* Amount */}
          <div className="mt-6 flex items-center gap-6">
            <div className="glass-card rounded-xl px-6 py-4 flex-1 text-center">
              <div className="text-3xl font-bold text-foreground">{deal.amount} SOL</div>
              <div className="text-xs text-muted-foreground mt-1">Сумма сделки</div>
            </div>
            {deal.verdict_percent !== null && (
              <div className="glass-card rounded-xl px-6 py-4 flex-1 text-center">
                <div className="text-3xl font-bold text-brand-green">{deal.verdict_percent}%</div>
                <div className="text-xs text-muted-foreground mt-1">Выплата по вердикту</div>
              </div>
            )}
          </div>

          {deal.description && (
            <div className="mt-4 text-sm text-muted-foreground leading-relaxed">{deal.description}</div>
          )}

          {/* Meta */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>📅 {new Date(deal.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
            {deal.counterparty_wallet && <span className="font-mono">👛 {deal.counterparty_wallet.slice(0, 6)}...{deal.counterparty_wallet.slice(-4)}</span>}
            {deal.nft_mint_address && <span className="text-brand-green">🏅 NFT сертификат</span>}
          </div>

          {deal.tx_signature && (
            <a href={`https://explorer.solana.com/tx/${deal.tx_signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-green/10 px-3 py-2 text-xs font-medium text-brand-green hover:bg-brand-green/20 transition-colors">
              <ArrowUpRight className="h-3 w-3" /> Транзакция в Solana Explorer
            </a>
          )}
        </div>

        {/* Share */}
        <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="h-4 w-4 text-brand-purple" />
            <h3 className="font-semibold text-foreground text-sm">Поделиться сделкой</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground font-mono truncate">{shareUrl}</div>
            <button onClick={copyLink} className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors flex items-center gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={shareWhatsApp} className="flex-1 rounded-xl bg-[#25D366]/15 px-4 py-2.5 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/25 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </button>
            <button onClick={shareTelegram} className="flex-1 rounded-xl bg-[#2AABEE]/15 px-4 py-2.5 text-sm font-medium text-[#2AABEE] hover:bg-[#2AABEE]/25 transition-colors flex items-center justify-center gap-2">
              <Send className="h-4 w-4" /> Telegram
            </button>
          </div>
        </div>

        {/* Action buttons for non-owner or counterparty */}
        {!isOwner && deal.status === "pending" && (
          <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <h3 className="font-semibold text-foreground mb-3">Вы получили приглашение к сделке</h3>
            <p className="text-sm text-muted-foreground mb-4">Ознакомьтесь с условиями и примите или отклоните сделку.</p>
            <div className="flex gap-3">
              <button onClick={acceptDeal} className="flex-1 rounded-xl bg-gradient-green px-4 py-3 text-sm font-semibold text-brand-green-foreground hover:opacity-90 transition-all">
                ✅ Принять сделку
              </button>
              <button onClick={disputeDeal} className="flex-1 rounded-xl bg-destructive/15 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/25 transition-colors">
                ❌ Отклонить
              </button>
            </div>
          </div>
        )}

        {/* Owner actions */}
        {isOwner && (deal.status === "active" || deal.status === "disputed") && (
          <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <h3 className="font-semibold text-foreground mb-3">Управление сделкой</h3>
            <div className="flex gap-3">
              {deal.status === "active" && (
                <button onClick={completeDeal} className="flex-1 rounded-xl bg-gradient-green px-4 py-3 text-sm font-semibold text-brand-green-foreground hover:opacity-90 transition-all">
                  ✅ Завершить сделку
                </button>
              )}
              {deal.status === "active" && (
                <button onClick={disputeDeal} className="flex-1 rounded-xl bg-destructive/15 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/25 transition-colors">
                  ⚠️ Открыть спор
                </button>
              )}
            </div>
          </div>
        )}

        {/* Proof upload */}
        <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-4 w-4 text-brand-green" />
            <h3 className="font-semibold text-foreground text-sm">Доказательства исполнения</h3>
          </div>

          {deal.proof_description ? (
            <div className="rounded-xl bg-brand-green/10 border border-brand-green/20 p-4">
              <p className="text-sm text-foreground">{deal.proof_description}</p>
              {deal.proof_hash && (
                <p className="mt-2 text-xs font-mono text-muted-foreground">Hash: {deal.proof_hash}</p>
              )}
            </div>
          ) : (
            <>
              <textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Опишите доказательства выполнения: скриншоты, ссылки, акты приёмки..."
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-green transition-colors resize-none"
              />
              <button
                onClick={submitProof}
                disabled={proofSubmitting || !proofText.trim()}
                className="mt-3 rounded-xl bg-gradient-green px-5 py-2.5 text-sm font-medium text-brand-green-foreground hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {proofSubmitting ? "Загрузка..." : "📎 Загрузить доказательства"}
              </button>
            </>
          )}
        </div>

        {/* AI Verdict */}
        <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-brand-purple" />
              <h3 className="font-semibold text-foreground text-sm">AI Вердикт</h3>
            </div>
            <button
              onClick={requestAiVerdict}
              disabled={aiLoading}
              className="rounded-lg bg-gradient-purple px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Gavel className="h-3 w-3" />
              {aiLoading ? "Анализ..." : "Запросить вердикт"}
            </button>
          </div>

          {deal.verdict_text && !aiVerdict && (
            <div className="rounded-xl bg-brand-purple/10 border border-brand-purple/20 p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{deal.verdict_text}</p>
              {deal.verdict_law_ref && (
                <p className="mt-2 text-xs font-mono text-brand-purple">📜 {deal.verdict_law_ref}</p>
              )}
            </div>
          )}

          {aiVerdict && (
            <div className="rounded-xl bg-brand-purple/10 border border-brand-purple/20 p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{aiVerdict}</p>
            </div>
          )}

          {!deal.verdict_text && !aiVerdict && !aiLoading && (
            <p className="text-sm text-muted-foreground">Нажмите «Запросить вердикт» чтобы AI проанализировал сделку и вынес решение на основании законов РК.</p>
          )}
        </div>

        {/* NFT Certificate */}
        {deal.nft_mint_address && (
          <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="h-4 w-4 text-brand-green" />
              <h3 className="font-semibold text-foreground text-sm">NFT Сертификат</h3>
            </div>
            <div className="rounded-xl bg-brand-green/10 border border-brand-green/20 p-4">
              <p className="text-sm font-mono text-foreground break-all">{deal.nft_mint_address}</p>
              <a href={`https://explorer.solana.com/address/${deal.nft_mint_address}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-green hover:underline">
                <ExternalLink className="h-3 w-3" /> Открыть в Solana Explorer
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
