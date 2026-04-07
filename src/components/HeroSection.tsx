import { ArrowRight, Zap, Shield, Bot, FileCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16 bg-gradient-hero">
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(oklch(0.65 0.28 290 / 30%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.28 290 / 30%) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-purple/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-green/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 pt-32 pb-20">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-2 animate-fade-in backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
          <span className="text-sm font-medium text-brand-green">Solana Blockchain + AI Арбитраж + Законы РК</span>
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
          AI создаёт, контролирует и{" "}
          <span className="text-gradient-purple">завершает сделки</span>
          {" "}автоматически
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-fade-in leading-relaxed" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          Безопасные сделки на блокчейне Solana. AI арбитраж по законам РК. Эскроу. NFT сертификат завершения.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "450ms", animationFillMode: "both" }}>
          <Link
            to="/create-deal"
            className="flex items-center gap-2 rounded-xl bg-gradient-purple px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-105 glow-purple"
          >
            Создать сделку <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/wallet"
            className="flex items-center gap-2 rounded-xl border border-brand-green/40 bg-brand-green/10 px-8 py-4 text-base font-semibold text-brand-green transition-all hover:bg-brand-green/20 hover:scale-105 backdrop-blur-sm"
          >
            <Zap className="h-5 w-5" />
            Подключить кошелёк
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
          {[
            { icon: Shield, label: "Solana Escrow", desc: "Безопасная заморозка SOL", color: "text-brand-green" },
            { icon: Bot, label: "AI Арбитр", desc: "Законы РК автоматически", color: "text-brand-purple" },
            { icon: FileCheck, label: "NFT Сертификат", desc: "Подтверждение on-chain", color: "text-brand-green" },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
