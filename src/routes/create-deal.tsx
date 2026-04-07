import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, Shield, Zap, FileCheck, Package, Laptop, Briefcase, Home, Truck, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createMemoTx, buildDealMemo, connection } from "@/lib/solana";

export const Route = createFileRoute("/create-deal")({
  component: CreateDealPage,
});

const categories = [
  { id: "supply", label: "Поставка", icon: Package, law: "ГК РК ст.349, 350, 406" },
  { id: "freelance", label: "Фриланс", icon: Laptop, law: "ГК РК ст.683" },
  { id: "labor", label: "Трудовой", icon: Briefcase, law: "ТК РК ст.131, 170" },
  { id: "rental", label: "Аренда", icon: Home, law: "ГК РК ст.545" },
  { id: "logistics", label: "Логистика", icon: Truck, law: "ГК РК ст.688, 700" },
  { id: "ecommerce", label: "E-commerce", icon: ShoppingCart, law: "ГК РК ст.406" },
];

function CreateDealPage() {
  const navigate = useNavigate();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    counterparty_wallet: "",
    deal_type: "escrow" as "escrow" | "direct" | "nft",
    category: "freelance",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.amount) {
      setError("Заполните обязательные поля");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Укажите корректную сумму");
      return;
    }

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Войдите в аккаунт для создания сделки");
      setIsSubmitting(false);
      return;
    }

    // Create deal in DB
    const { data: newDeal, error: insertError } = await supabase.from("deals").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      amount,
      counterparty_wallet: form.counterparty_wallet.trim() || null,
      deal_type: form.deal_type,
      category: form.category,
      user_id: user.id,
    }).select("id").single();

    if (insertError || !newDeal) {
      setError(insertError?.message || "Ошибка создания сделки");
      setIsSubmitting(false);
      return;
    }

    // Record on blockchain if wallet connected
    if (publicKey && connected) {
      try {
        const memo = buildDealMemo(newDeal.id, "CREATE", `${amount}SOL|${form.category}`);
        const tx = await createMemoTx({ signer: publicKey, memo });
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, "confirmed");
        await supabase.from("deals").update({ tx_signature: sig }).eq("id", newDeal.id);
      } catch (e) {
        console.warn("Blockchain recording failed, deal created without on-chain record:", e);
      }
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Сделка создана",
      message: `Сделка "${form.title.trim()}" на ${amount} SOL создана успешно`,
      type: "deal_created",
      deal_id: newDeal.id,
    });

    setIsSubmitting(false);
    navigate({ to: "/deal/$dealId", params: { dealId: newDeal.id } });
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedCat = categories.find((c) => c.id === form.category);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link to="/deals" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Назад к сделкам
        </Link>

        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-purple glow-purple">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Создать сделку</h1>
              <p className="text-sm text-muted-foreground">AI подберёт законы РК • Блокчейн запись</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 flex items-center gap-2 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          {["Тип", "Детали", "Подтверждение"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-1.5 rounded-full flex-1 transition-colors ${i <= step ? "bg-brand-purple" : "bg-secondary"}`} />
            </div>
          ))}
        </div>

        {/* Deal type */}
        <div className="mt-6 grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          {[
            { type: "escrow" as const, label: "Эскроу", icon: Shield, desc: "Безопасная сделка с блокчейном" },
            { type: "direct" as const, label: "Прямая", icon: Zap, desc: "Быстрый перевод SOL" },
            { type: "nft" as const, label: "NFT", icon: FileCheck, desc: "С NFT сертификатом" },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => { update("deal_type", item.type); setStep(Math.max(step, 0)); }}
              className={`group relative rounded-2xl p-5 text-left transition-all duration-300 ${
                form.deal_type === item.type ? "glass-card glow-purple border-brand-purple/50" : "glass-card hover:border-brand-purple/30"
              }`}
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-all ${form.deal_type === item.type ? "bg-gradient-purple glow-purple" : "bg-secondary"}`}>
                <item.icon className={`h-6 w-6 ${form.deal_type === item.type ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div className="font-semibold text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="mt-6 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
          <label className="mb-3 block text-sm font-medium text-foreground">Категория сделки</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => update("category", cat.id)}
                className={`rounded-xl p-3 text-center transition-all ${
                  form.category === cat.id ? "glass-card border-brand-green/50 glow-green" : "glass-card hover:border-brand-green/20"
                }`}
              >
                <cat.icon className={`mx-auto h-5 w-5 mb-1 ${form.category === cat.id ? "text-brand-green" : "text-muted-foreground"}`} />
                <div className="text-[11px] font-medium text-foreground">{cat.label}</div>
              </button>
            ))}
          </div>
          {selectedCat && (
            <div className="mt-2 rounded-lg bg-brand-purple/10 border border-brand-purple/20 px-3 py-2 text-xs font-mono text-brand-purple">
              📜 AI применит: {selectedCat.law}
            </div>
          )}
        </div>

        {/* Wallet status */}
        {connected && publicKey ? (
          <div className="mt-4 rounded-xl bg-brand-green/10 border border-brand-green/20 px-4 py-3 flex items-center gap-2 text-xs animate-fade-in" style={{ animationDelay: "170ms", animationFillMode: "both" }}>
            <div className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-brand-green font-medium">Кошелёк подключён</span>
            <span className="font-mono text-muted-foreground">{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
            <span className="text-muted-foreground">• Сделка будет записана в блокчейн</span>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-secondary border border-border px-4 py-3 flex items-center gap-2 text-xs animate-fade-in" style={{ animationDelay: "170ms", animationFillMode: "both" }}>
            <span className="text-muted-foreground">💡 Подключите кошелёк Solana для записи сделки в блокчейн</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Название сделки <span className="text-destructive">*</span></label>
              <input value={form.title} onChange={(e) => { update("title", e.target.value); setStep(Math.max(step, 1)); }} placeholder="Например: Разработка веб-сайта" maxLength={100} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Условия сделки</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Опишите условия: что должен сделать исполнитель, сроки, критерии приёмки..." rows={5} maxLength={2000} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors resize-none" />
              <p className="mt-1 text-xs text-muted-foreground">AI проанализирует условия и подберёт статьи закона</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Сумма (SOL) <span className="text-destructive">*</span></label>
                <input type="number" step="0.0001" min="0" value={form.amount} onChange={(e) => { update("amount", e.target.value); setStep(Math.max(step, 2)); }} placeholder="0.00" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Кошелёк контрагента</label>
                <input value={form.counterparty_wallet} onChange={(e) => update("counterparty_wallet", e.target.value)} placeholder="Solana адрес" maxLength={255} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors" />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive animate-fade-in">{error}</div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-gradient-purple px-6 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 glow-purple animate-fade-in flex items-center justify-center gap-2" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Создание сделки...
              </>
            ) : (
              <>🔒 Создать сделку {connected ? "и записать в блокчейн" : ""}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
