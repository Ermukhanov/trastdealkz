import { useEffect, useState } from "react";

const stats = [
  { label: "Total Deals", target: 12847, suffix: "" },
  { label: "Active Users", target: 8329, suffix: "" },
  { label: "Volume (SOL)", target: 45200, suffix: "" },
  { label: "NFTs Minted", target: 9841, suffix: "" },
];

function AnimatedNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{value.toLocaleString()}</>;
}

export default function StatsSection() {
  return (
    <section className="relative z-10 -mt-10 mx-auto max-w-5xl px-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-foreground">
              <AnimatedNumber target={s.target} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
