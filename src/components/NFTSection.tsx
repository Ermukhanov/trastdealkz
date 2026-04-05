import { CheckCircle } from "lucide-react";

export default function NFTSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <h2 className="text-center text-3xl font-bold md:text-4xl">NFT Certificate of Completion</h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
        Every deal gets an immutable, verifiable proof on Solana
      </p>

      <div className="mx-auto mt-12 max-w-md">
        <div className="glass-card overflow-hidden rounded-2xl glow-purple">
          <div className="bg-gradient-purple p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary-foreground">TrustDeal NFT</span>
              <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground">On Solana</span>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Deal Information</h3>
            <p className="mt-1 text-lg font-semibold">Website Redesign Project</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">24.5 SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1 font-medium text-brand-green">
                  <CheckCircle className="h-4 w-4" /> Completed
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participants</span>
                <span className="font-medium">Aidar K. ↔ Maria S.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Date</span>
                <span className="font-medium">2026-03-28 14:32 UTC</span>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-secondary/50 p-3 text-center text-sm">
              <span className="text-muted-foreground">AI Signature: </span>
              <span className="font-medium text-brand-purple">Verified by TrustDeal AI</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
