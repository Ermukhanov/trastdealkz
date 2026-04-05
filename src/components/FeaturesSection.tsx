import { Scale, Lock, Award, Shield } from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "AI Arbitration",
    desc: "Autonomous dispute resolution powered by AI with legal reasoning based on Kazakhstan law.",
  },
  {
    icon: Lock,
    title: "Escrow on Solana",
    desc: "Secure, fast, and transparent escrow using Solana blockchain smart contracts.",
  },
  {
    icon: Award,
    title: "NFT Certificates",
    desc: "Every completed deal generates a unique NFT certificate as proof of completion.",
  },
  {
    icon: Shield,
    title: "Trust System",
    desc: "Dynamic TrustScore based on deal history, AI reliability, and on-chain activity.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Platform Features</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="glass-card rounded-2xl p-6 transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/10">
              <f.icon className="h-6 w-6 text-brand-purple" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
