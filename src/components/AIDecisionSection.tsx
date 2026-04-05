import { Brain, ShieldCheck, Scale } from "lucide-react";

export default function AIDecisionSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <p className="text-center text-sm font-medium text-brand-purple">AI Decision System</p>
      <h2 className="mt-3 text-center text-3xl font-bold md:text-4xl">AI Decision System</h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
        Our AI doesn't just assist — it makes autonomous decisions with full transparency
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {[
            { icon: Brain, label: "AI analyzes deal" },
            { icon: ShieldCheck, label: "AI evaluates risk" },
            { icon: Scale, label: "AI resolves disputes" },
          ].map((item) => (
            <div key={item.label} className="glass-card flex items-center gap-4 rounded-xl px-6 py-4">
              <item.icon className="h-5 w-5 text-brand-purple" />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 glow-purple">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-purple" />
              <span className="font-semibold">AI Decision</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>TrustDeal AI v2.0</span>
            <span className="rounded-full bg-brand-green/20 px-3 py-1 text-xs font-medium text-brand-green">Live</span>
          </div>
          <div className="mt-6 rounded-xl bg-secondary/50 p-4">
            <div className="text-sm text-muted-foreground">Deal Status</div>
            <div className="mt-1 font-semibold text-brand-green">Approved</div>
          </div>
          <div className="mt-4 rounded-xl bg-secondary/50 p-4">
            <div className="text-sm text-muted-foreground">Confidence</div>
            <div className="mt-2 h-2 rounded-full bg-secondary">
              <div className="h-full w-[92%] rounded-full bg-gradient-green" />
            </div>
            <div className="mt-1 text-right text-sm font-semibold text-brand-green">92%</div>
          </div>
          <div className="mt-4 rounded-xl bg-secondary/50 p-4">
            <div className="text-sm text-muted-foreground">Reason</div>
            <div className="mt-1 text-sm text-foreground">Legal basis: Civil Code of RK, Art. 272</div>
          </div>
        </div>
      </div>
    </section>
  );
}
