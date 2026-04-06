import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, LayoutDashboard, FileText, Bot, User, Wallet, LogIn, LogOut, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import logoImg from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/deals", label: "Deals", icon: FileText },
  { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-green">
            <span className="text-sm font-bold text-brand-green-foreground">●</span>
          </div>
          <span className="text-lg font-bold text-foreground">TrustDeal AI</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:block">
                {user.email?.split("@")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg bg-gradient-purple px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
