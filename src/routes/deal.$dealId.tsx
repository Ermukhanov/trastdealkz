import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft, Shield, Zap, FileCheck, CheckCircle, Clock,
  AlertTriangle, XCircle, ArrowUpRight, Share2, MessageSquare,
  Upload, Send, Gavel, Copy, Check, Loader2, Star, ExternalLink,
} from "lucide-react";
import { createTransferTx, createMemoTx, buildDealMemo, verifyTransaction, connection } from "@/lib/solana";
import { PublicKey } from "@solana/web3.js";
import { mintDealNftCertificate, type NftCertificateMetadata, getDealCertificateSvg } from "@/services/nftCertificate";

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
  const navigate = useNavigate();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [deal, setDeal] = useState<Tables<"deals"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [txVerified, setTxVerified] = useState<boolean | null>(null);

  // AI verdict
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVerdict, setAiVerdict] = useState("");

  // Proof upload
  const [proofText, setProofText] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);

  // Blockchain actions
  const [blockchainLoading, setBlockchainLoading] = useState("");

  // Review
  const [reviewRating, setReviewRating] = useState(7);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  // NFT minting
  const [nftMinting, setNftMinting] = useState(false);
  const [nftResult, setNftResult] = useState<{ mintAddress: string; explorerUrl: string; imageUrl: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data }, { data: { user } }] = await Promise.all([
        supabase.from("deals").select("*").eq("id", dealId).single(),
        supabase.auth.getUser(),
      ]);
      setDeal(data);
      setCurrentUser(user?.id || null);
      setLoading(false);

      // Verify blockchain tx
      if (data?.tx_signature) {
        verifyTransaction(data.tx_signature).then((r) => setTxVerified(r.confirmed));
      }

      // Check if already reviewed
      if (user && data) {
        const { data: existing } = await supabase.from("reviews").select("id").eq("deal_id", data.id).eq("reviewer_id", user.id).limit(1);
        if (existing && existing.length > 0) setReviewDone(true);
      }
    };
    load();
  }, [dealId]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/deal/${dealId}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Сделка TrustDeal: ${deal?.title}\n${shareUrl}`)}`, "_blank");
  const shareTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Сделка TrustDeal: ${deal?.title}`)}`, "_blank");

  // Record deal on blockchain
  const recordOnChain = async (action: string) => {
    if (!publicKey || !deal) return;
    setBlockchainLoading(action);
    try {
      const memo = buildDealMemo(deal.id, action, `${deal.amount}SOL`);
      const tx = await createMemoTx({ signer: publicKey, memo });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      await supabase.from("deals").update({ tx_signature: sig }).eq("id", deal.id);
      setDeal({ ...deal, tx_signature: sig });
      setTxVerified(true);
    } catch (e: any) {
      console.error("Blockchain error:", e);
      alert("Ошибка блокчейна: " + (e.message || "Неизвестная ошибка"));
    }
    setBlockchainLoading("");
  };

  // Escrow: send SOL to counterparty
  const sendEscrow = async () => {
    if (!publicKey || !deal || !deal.counterparty_wallet) return;
    setBlockchainLoading("escrow");
    try {
      const recipientKey = new PublicKey(deal.counterparty_wallet);
      const memo = buildDealMemo(deal.id, "ESCROW", `${deal.amount}SOL`);
      const tx = await createTransferTx({
        from: publicKey,
        to: recipientKey,
        amountSOL: Number(deal.amount),
        memo,
      });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      await supabase.from("deals").update({ tx_signature: sig, status: "active" }).eq("id", deal.id);
      setDeal({ ...deal, tx_signature: sig, status: "active" });
      setTxVerified(true);
    } catch (e: any) {
      console.error("Escrow error:", e);
      alert("Ошибка перевода: " + (e.message || ""));
    }
    setBlockchainLoading("");
  };

  const requestAiVerdict = async () => {
    if (!deal) return;
    setAiLoading(true);
    setAiVerdict("");

    const prompt = `Проанализируй эту сделку и вынеси вердикт со ссылкой на законы РК. Укажи процент выплаты.`;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            deal_context: {
              deal_id: deal.id,
              title: deal.title,
              amount: deal.amount,
              status: deal.status,
              deal_type: deal.deal_type,
              category: deal.category,
              description: deal.description,
              proof_description: deal.proof_description,
              proof_hash: deal.proof_hash,
              tx_signature: deal.tx_signature,
              counterparty_wallet: deal.counterparty_wallet,
              nft_mint_address: deal.nft_mint_address,
            },
            action: "verdict",
          }),
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
      setAiVerdict("Ошибка получения вердикта AI.");
    }
    setAiLoading(false);
  };

  const submitProof = async () => {
    if (!deal || !proofText.trim()) return;
    setProofSubmitting(true);
    const hash = btoa(proofText.trim()).slice(0, 32);
    await supabase.from("deals").update({
      proof_description: proofText.trim(),
      proof_hash: hash,
    }).eq("id", deal.id);
    setDeal({ ...deal, proof_description: proofText.trim(), proof_hash: hash });
    setProofText("");
    setProofSubmitting(false);

    // Record proof hash on blockchain
    if (publicKey && connected) {
      await recordOnChain("PROOF");
    }
  };

  const acceptDeal = async () => {
    if (!deal) return;
    await supabase.from("deals").update({ status: "active" }).eq("id", deal.id);
    setDeal({ ...deal, status: "active" });
    if (publicKey && connected) await recordOnChain("ACCEPT");
  };

  const completeDeal = async () => {
    if (!deal) return;
    await supabase.from("deals").update({ status: "completed" }).eq("id", deal.id);
    setDeal({ ...deal, status: "completed" });
    if (publicKey && connected) await recordOnChain("COMPLETE");
  };

  const mintNft = async () => {
    if (!deal || !publicKey || !connected) return;
    setNftMinting(true);
    try {
      const wallet = { publicKey, signTransaction: async (tx: any) => tx };
      const meta: NftCertificateMetadata = {
        dealId: parseInt(deal.id.slice(0, 8), 16) || 1,
        dealType: deal.deal_type,
        amountSOL: Number(deal.amount),
        creator: deal.user_id.slice(0, 20),
        counterparty: deal.counterparty_wallet || "N/A",
        completedAt: deal.updated_at,
        aiVerdictHash: deal.proof_hash || "no-verdict",
        lawReference: deal.verdict_law_ref || "ГК РК ст. 349",
        txSignature: deal.tx_signature || "pending",
        trustDealVersion: "1.0.0",
      };

      const memo = buildDealMemo(deal.id, "MINT_NFT", `cert-${deal.id.slice(0, 8)}`);
      const tx = await createMemoTx({ signer: publicKey, memo });
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(meta)));
      const mintHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 44);

      await supabase.from("deals").update({ nft_mint_address: mintHex, tx_signature: sig }).eq("id", deal.id);
      setDeal({ ...deal, nft_mint_address: mintHex, tx_signature: sig });

      const svgData = getDealCertificateSvg(meta);
      const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;

      setNftResult({
        mintAddress: mintHex,
        explorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
        imageUrl: svgUrl,
      });
    } catch (e: any) {
      console.error("NFT mint error:", e);
      alert("Ошибка минтинга NFT: " + (e.message || ""));
    }
    setNftMinting(false);
  };

  const disputeDeal = async () => {
    if (!deal) return;
    await supabase.from("deals").update({ status: "disputed" }).eq("id", deal.id);
    setDeal({ ...deal, status: "disputed" });
    if (publicKey && connected) await recordOnChain("DISPUTE");
  };

  const submitReview = async () => {
    if (!deal || !currentUser || reviewDone) return;
    setReviewSubmitting(true);
    await supabase.from("reviews").insert({
      deal_id: deal.id,
      reviewer_id: currentUser,
      reviewee_id: deal.user_id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });
    setReviewDone(true);
    setReviewSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
          <span className="text-muted-foreground">Загрузка сделки...</span>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🔍</div>
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
        <div className="glass-card rounded-2xl p-6 animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-transparent" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-purple glow-purple">
                    <DealIcon className="h-6 w-6 text-primary-foreground" />
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

            {/* Amount + Verdict */}
            <div className="mt-6 flex items-center gap-4">
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

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>📅 {new Date(deal.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
              {deal.counterparty_wallet && <span className="font-mono">👛 {deal.counterparty_wallet.slice(0, 6)}...{deal.counterparty_wallet.slice(-4)}</span>}
              {deal.nft_mint_address && <span className="text-brand-green">🏅 NFT сертификат</span>}
            </div>

            {/* Blockchain Status */}
            {deal.tx_signature && (
              <div className="mt-4 rounded-xl bg-brand-green/10 border border-brand-green/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {txVerified === true && <CheckCircle className="h-4 w-4 text-brand-green" />}
                  {txVerified === false && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  {txVerified === null && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <span className="text-xs font-mono text-brand-green">{deal.tx_signature.slice(0, 16)}...</span>
                  <span className="text-xs text-muted-foreground">{txVerified ? "✓ Подтверждено в блокчейне" : "Проверка..."}</span>
                </div>
                <a href={`https://explorer.solana.com/tx/${deal.tx_signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {/* Record on chain button */}
            {!deal.tx_signature && connected && isOwner && (
              <button
                onClick={() => recordOnChain("CREATE")}
                disabled={!!blockchainLoading}
                className="mt-4 w-full rounded-xl bg-gradient-green px-4 py-3 text-sm font-semibold text-brand-green-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {blockchainLoading === "CREATE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Записать сделку в блокчейн Solana
              </button>
            )}

            {/* Owner profile link */}
            <Link
              to="/user/$userId"
              params={{ userId: deal.user_id }}
              className="mt-4 inline-flex items-center gap-2 text-xs text-brand-purple hover:underline"
            >
              Профиль создателя →
            </Link>
          </div>
        </div>

        {/* Escrow action */}
        {deal.deal_type === "escrow" && deal.counterparty_wallet && isOwner && deal.status === "pending" && connected && (
          <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "both" }}>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-green" /> Эскроу перевод
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Отправьте {deal.amount} SOL на кошелёк контрагента. Транзакция будет записана в блокчейн.
            </p>
            <button
              onClick={sendEscrow}
              disabled={!!blockchainLoading}
              className="w-full rounded-xl bg-gradient-green px-4 py-3 text-sm font-semibold text-brand-green-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {blockchainLoading === "escrow" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Отправить {deal.amount} SOL через Escrow
            </button>
          </div>
        )}

        {/* Share */}
        <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="h-4 w-4 text-brand-purple" />
            <h3 className="font-semibold text-foreground text-sm">Поделиться</h3>
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

        {/* Counterparty actions */}
        {!isOwner && deal.status === "pending" && (
          <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <h3 className="font-semibold text-foreground mb-3">Вы получили приглашение к сделке</h3>
            <div className="flex gap-3">
              <button onClick={acceptDeal} className="flex-1 rounded-xl bg-gradient-green px-4 py-3 text-sm font-semibold text-brand-green-foreground hover:opacity-90">✅ Принять</button>
              <button onClick={disputeDeal} className="flex-1 rounded-xl bg-destructive/15 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/25">❌ Отклонить</button>
            </div>
          </div>
        )}

        {/* Owner actions */}
        {isOwner && (deal.status === "active" || deal.status === "disputed") && (
          <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <h3 className="font-semibold text-foreground mb-3">Управление сделкой</h3>
            <div className="flex gap-3">
              {deal.status === "active" && (
                <button onClick={completeDeal} className="flex-1 rounded-xl bg-gradient-green px-4 py-3 text-sm font-semibold text-brand-green-foreground hover:opacity-90">✅ Завершить</button>
              )}
              {deal.status === "active" && (
                <button onClick={disputeDeal} className="flex-1 rounded-xl bg-destructive/15 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/25">⚠️ Спор</button>
              )}
            </div>
          </div>
        )}

        {/* Proof */}
        <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-4 w-4 text-brand-green" />
            <h3 className="font-semibold text-foreground text-sm">Доказательства исполнения</h3>
          </div>
          {deal.proof_description ? (
            <div className="rounded-xl bg-brand-green/10 border border-brand-green/20 p-4">
              <p className="text-sm text-foreground">{deal.proof_description}</p>
              {deal.proof_hash && <p className="mt-2 text-xs font-mono text-muted-foreground">Hash: {deal.proof_hash}</p>}
            </div>
          ) : (
            <>
              <textarea value={proofText} onChange={(e) => setProofText(e.target.value)} placeholder="Опишите доказательства выполнения..." rows={3} maxLength={2000} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-green transition-colors resize-none" />
              <button onClick={submitProof} disabled={proofSubmitting || !proofText.trim()} className="mt-3 rounded-xl bg-gradient-green px-5 py-2.5 text-sm font-medium text-brand-green-foreground hover:opacity-90 disabled:opacity-50 transition-all">
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
            <button onClick={requestAiVerdict} disabled={aiLoading} className="rounded-lg bg-gradient-purple px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5">
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gavel className="h-3 w-3" />}
              {aiLoading ? "Анализ..." : "Запросить вердикт"}
            </button>
          </div>

          {(deal.verdict_text && !aiVerdict) && (
            <div className="rounded-xl bg-brand-purple/10 border border-brand-purple/20 p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{deal.verdict_text}</p>
              {deal.verdict_law_ref && <p className="mt-2 text-xs font-mono text-brand-purple">📜 {deal.verdict_law_ref}</p>}
            </div>
          )}

          {aiVerdict && (
            <div className="rounded-xl bg-brand-purple/10 border border-brand-purple/20 p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{aiVerdict}</p>
            </div>
          )}

          {!deal.verdict_text && !aiVerdict && !aiLoading && (
            <p className="text-xs text-muted-foreground">Нажмите кнопку для получения AI анализа со ссылкой на законы РК</p>
          )}
        </div>

        {/* Review */}
        {deal.status === "completed" && currentUser && currentUser !== deal.user_id && !reviewDone && (
          <div className="glass-card rounded-2xl p-5 mt-4 animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-brand-purple" />
              <h3 className="font-semibold text-foreground text-sm">Оставить отзыв</h3>
            </div>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 10 }, (_, i) => (
                <button key={i} onClick={() => setReviewRating(i + 1)} className="p-0.5">
                  <Star className={`h-5 w-5 transition-colors ${i < reviewRating ? "text-brand-green fill-brand-green" : "text-muted-foreground/30"}`} />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-foreground">{reviewRating}/10</span>
            </div>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Комментарий (необязательно)" rows={2} maxLength={500} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors resize-none" />
            <button onClick={submitReview} disabled={reviewSubmitting} className="mt-3 rounded-xl bg-gradient-purple px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all">
              {reviewSubmitting ? "Отправка..." : "⭐ Отправить отзыв"}
            </button>
          </div>
        )}

        {reviewDone && (
          <div className="glass-card rounded-2xl p-4 mt-4 text-center text-sm text-brand-green animate-fade-in">
            ✅ Отзыв отправлен!
          </div>
        )}
      </div>
    </div>
  );
}
