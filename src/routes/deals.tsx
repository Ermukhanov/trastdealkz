import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

function DealsPage() {
  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">Deals</h1>
        <p className="mt-2 text-muted-foreground">Browse and manage your deals</p>
        <div className="mt-8 space-y-4">
          {[
            { title: "Website Redesign", amount: "24.5 SOL", status: "Completed" },
            { title: "Mobile App Dev", amount: "120 SOL", status: "In Progress" },
            { title: "Logo Design", amount: "5 SOL", status: "Pending" },
          ].map((deal) => (
            <div key={deal.title} className="glass-card flex items-center justify-between rounded-2xl p-6">
              <div>
                <div className="font-semibold">{deal.title}</div>
                <div className="text-sm text-muted-foreground">{deal.amount}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                deal.status === "Completed" ? "bg-brand-green/20 text-brand-green" :
                deal.status === "In Progress" ? "bg-brand-purple/20 text-brand-purple" :
                "bg-secondary text-muted-foreground"
              }`}>
                {deal.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
