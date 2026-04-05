import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TrustDeal AI — Next-Gen AI Deal Platform on Solana" },
      { name: "description", content: "Secure agreements. AI arbitration. Escrow on Solana. NFT proof of completion." },
      { name: "author", content: "TrustDeal AI" },
      { property: "og:title", content: "TrustDeal AI — Next-Gen AI Deal Platform on Solana" },
      { property: "og:description", content: "Secure agreements. AI arbitration. Escrow on Solana. NFT proof of completion." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/28b493d0-5636-49a0-aa4d-32b6a5fed919/id-preview-8f65d009--61a7ffa3-6892-495a-bf22-f4594622c1be.lovable.app-1775376146369.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/28b493d0-5636-49a0-aa4d-32b6a5fed919/id-preview-8f65d009--61a7ffa3-6892-495a-bf22-f4594622c1be.lovable.app-1775376146369.png" },
      { name: "twitter:title", content: "TrustDeal AI — Next-Gen AI Deal Platform on Solana" },
      { name: "twitter:description", content: "Secure agreements. AI arbitration. Escrow on Solana. NFT proof of completion." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
