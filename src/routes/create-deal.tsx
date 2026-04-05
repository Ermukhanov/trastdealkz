import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Shield, Zap, FileCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/create-deal")({
  component: CreateDealPage,
});

function CreateDealPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    counterparty_wallet: "",
    deal_type: "escrow" as "escrow" | "direct" | "nft",
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

    const { error: insertError } = await supabase.from("deals").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      amount,
      counterparty_wallet: form.counterparty_wallet.trim() || null,
      deal_type: form.deal_type,
      user_id: user.id,
    });

    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate({ to: "/deals" });
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/deals"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к сделкам
        </Link>

        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Создать сделку</h1>
          <p className="mt-2 text-muted-foreground">
            Заполните форму для создания новой защищённой сделки
          </p>
        </div>

        {/* Deal type selector */}
        <div className="mt-8 grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
          {[
            { type: "escrow" as const, label: "Эскроу", icon: Shield, desc: "Безопасная сделка" },
            { type: "direct" as const, label: "Прямая", icon: Zap, desc: "Быстрый перевод" },
            { type: "nft" as const, label: "NFT", icon: FileCheck, desc: "С сертификатом" },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => update("deal_type", item.type)}
              className={`group relative rounded-2xl p-4 text-left transition-all duration-300 ${
                form.deal_type === item.type
                  ? "glass-card glow-purple border-brand-purple/50"
                  : "glass-card hover:border-brand-purple/30"
              }`}
            >
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                form.deal_type === item.type ? "bg-gradient-purple" : "bg-secondary"
              }`}>
                <item.icon className={`h-5 w-5 ${
                  form.deal_type === item.type ? "text-primary-foreground" : "text-muted-foreground"
                }`} />
              </div>
              <div className="font-medium text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Название сделки <span className="text-destructive">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Например: Разработка веб-сайта"
                maxLength={100}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Описание
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Опишите условия сделки..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Сумма (SOL) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Кошелёк контрагента
                </label>
                <input
                  value={form.counterparty_wallet}
                  onChange={(e) => update("counterparty_wallet", e.target.value)}
                  placeholder="Solana адрес"
                  maxLength={255}
                  className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-purple px-6 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 glow-purple animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            {isSubmitting ? "Создание..." : "Создать сделку"}
          </button>
        </form>
      </div>
    </div>
  );
}
