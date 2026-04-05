const testimonials = [
  {
    text: "TrustDeal AI saved me from a bad deal. The AI detected inconsistencies and protected my escrow.",
    name: "Aidar K.",
    role: "Freelancer",
  },
  {
    text: "The NFT certificates are a game-changer. My clients trust me more with verifiable proof.",
    name: "Maria S.",
    role: "Business Owner",
  },
  {
    text: "Integration with Solana is seamless. Fast transactions and transparent escrow.",
    name: "Damir T.",
    role: "Developer",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Trusted by Thousands</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.name} className="glass-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-purple text-sm font-bold text-primary-foreground">
                {t.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
