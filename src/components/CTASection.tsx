import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <div className="glass-card rounded-3xl p-12 text-center glow-purple">
        <h2 className="text-3xl font-bold md:text-4xl">Ready to revolutionize your deals?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Join thousands of users who trust AI to manage their agreements securely on Solana.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button className="flex items-center gap-2 rounded-xl bg-gradient-purple px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90">
            Get Started <ArrowRight className="h-5 w-5" />
          </button>
          <button className="rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
