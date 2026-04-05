import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Your deal overview and analytics</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { label: "Active Deals", value: "3" },
            { label: "Completed", value: "12" },
            { label: "TrustScore", value: "94%" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-6">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-3xl font-bold text-gradient-purple">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
