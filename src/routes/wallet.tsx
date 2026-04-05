import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

function WalletPage() {
  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="mt-2 text-muted-foreground">Connect your Solana wallet</p>
        <div className="mt-8 glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">💳</div>
          <p className="mt-4 font-semibold">No wallet connected</p>
          <p className="mt-2 text-sm text-muted-foreground">Connect your Phantom or Solflare wallet to get started</p>
          <button className="mt-6 rounded-xl bg-gradient-green px-8 py-3 font-semibold text-brand-green-foreground transition-opacity hover:opacity-90">
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
