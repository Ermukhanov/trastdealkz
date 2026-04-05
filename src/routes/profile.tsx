import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Profile</h1>
        <div className="mt-8 glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-purple text-xl font-bold text-primary-foreground">U</div>
            <div>
              <div className="text-lg font-semibold">User</div>
              <div className="text-sm text-muted-foreground">TrustScore: 94%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
