const steps = [
  { num: "01", title: "User creates deal" },
  { num: "02", title: "Funds go to escrow" },
  { num: "03", title: "AI monitors & decides" },
  { num: "04", title: "Deal completed" },
  { num: "05", title: "NFT certificate minted" },
];

export default function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <p className="text-center text-sm font-medium text-brand-green">See how it works in 10 seconds</p>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-4">
            <div className="glass-card flex items-center gap-4 rounded-2xl px-6 py-4">
              <span className="text-2xl font-bold text-gradient-purple">{s.num}</span>
              <span className="text-sm font-medium text-foreground">{s.title}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden h-px w-8 bg-border md:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
