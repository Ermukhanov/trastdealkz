import { useState } from "react";
import { Shield, Bot, Wallet, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Shield,
    title: "Безопасные сделки",
    description: "Создавайте escrow-сделки с блокчейн-защитой. Средства замораживаются до выполнения условий.",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    icon: Bot,
    title: "AI Арбитраж",
    description: "Искусственный интеллект анализирует споры на основе законов РК и выносит справедливые решения.",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
  },
  {
    icon: Wallet,
    title: "Solana Блокчейн",
    description: "Все транзакции записываются в блокчейн Solana. NFT-сертификат подтверждает каждую сделку.",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="mx-4 w-full max-w-lg">
        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-brand-purple" : i < step ? "w-2 bg-brand-green" : "w-2 bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-10 text-center animate-slide-up" key={step}>
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${current.bg}`}>
            <current.icon className={`h-10 w-10 ${current.color}`} />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">{current.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{current.description}</p>

          <div className="mt-10 flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Назад
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  localStorage.setItem("td-onboarding-done", "1");
                  onComplete();
                } else {
                  setStep(step + 1);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-purple px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all glow-purple"
            >
              {isLast ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Начать
                </>
              ) : (
                <>
                  Далее
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={() => {
            localStorage.setItem("td-onboarding-done", "1");
            onComplete();
          }}
          className="mt-4 mx-auto block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
