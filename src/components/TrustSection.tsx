const metrics = [
  { value: "94%", label: "Avg TrustScore" },
  { value: "12,847", label: "Deals Completed" },
  { value: "8,329", label: "Verified Users" },
  { value: "99.7%", label: "AI Verified" },
];

export default function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Built on Trust</h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
        Transparent metrics that prove reliability
      </p>
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="glass-card rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-gradient-green">{m.value}</div>
            <div className="mt-2 text-sm text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
