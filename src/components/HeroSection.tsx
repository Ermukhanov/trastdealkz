import { ArrowRight, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 pt-32 pb-20">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-brand-green" />
          <span className="text-sm font-medium text-brand-green">Next-Gen AI Deal Platform on Solana</span>
        </div>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          AI that creates, controls and completes{" "}
          <span className="text-gradient-purple">your deals automatically</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Secure agreements. AI arbitration. Escrow on Solana. NFT proof of completion.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-purple px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 glow-purple">
            Create Deal <ArrowRight className="h-5 w-5" />
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-brand-green bg-brand-green/10 px-8 py-4 text-base font-semibold text-brand-green transition-all hover:bg-brand-green/20 glow-green">
            <Zap className="h-5 w-5" />
            Connect Wallet
          </button>
        </div>

        <div className="mt-12 flex flex-wrap gap-6 text-sm text-muted-foreground">
          {["Solana Powered", "AI Autonomous", "NFT Certified"].map((tag) => (
            <div key={tag} className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-secondary flex items-center justify-center text-[10px]">◇</span>
              {tag}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
