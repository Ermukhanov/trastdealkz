import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, LayoutDashboard, FileText, Bot, User, Wallet, LogIn, LogOut, Bell, Menu, X, Search, Scale, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import logoImg from "@/assets/logo.png";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navItems = [
  { to: "/", label: "Главная", icon: Home },
  { to: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { to: "/deals", label: "Сделки", icon: FileText },
  { to: "/disputes", label: "DAO", icon: Bot },
  { to: "/risk-audit", label: "Аудит", icon: Bot },
  { to: "/ai-assistant", label: "AI", icon: Bot },
  { to: "/wallet", label: "Кошелёк", icon: Wallet },
  { to: "/profile", label: "Профиль", icon: User },
] as const;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchId, setSearchId] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        supabase.from("notifications").select("id", { count: "exact" }).eq("user_id", u.id).eq("is_read", false).then(({ count }) => {
          setUnreadCount(count || 0);
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const searchUser = () => {
    if (searchId.trim()) {
      navigate({ to: "/user/$userId", params: { userId: searchId.trim() } });
      setSearchId("");
      setShowSearch(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoImg} alt="TrustDeal AI" className="h-9 w-9 rounded-xl ring-1 ring-brand-purple/30 group-hover:ring-brand-purple/60 transition-all" width={36} height={36} />
            <span className="text-lg font-bold text-foreground">TrustDeal<span className="text-gradient-purple"> AI</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-purple/15 text-brand-purple"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/notifications"
              className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Search button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              <Search className="h-4 w-4" />
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {user.email?.split("@")[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 rounded-lg bg-gradient-purple px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <LogIn className="h-4 w-4" />
                Войти
              </Link>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="border-t border-border/30 bg-background/90 backdrop-blur-xl px-4 py-3 animate-fade-in">
            <div className="mx-auto max-w-md flex gap-2">
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUser()}
                placeholder="Поиск пользователя по ID..."
                className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-purple"
              />
              <button onClick={searchUser} className="rounded-lg bg-gradient-purple px-4 py-2 text-sm font-medium text-primary-foreground">
                Найти
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border/50 p-6 animate-fade-in">
            <div className="space-y-1 mt-12">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === item.to ? "bg-brand-purple/15 text-brand-purple" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                Уведомления
                {unreadCount > 0 && <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[10px] text-destructive-foreground">{unreadCount}</span>}
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t border-border/50">
              {user ? (
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <LogOut className="h-5 w-5" /> Выйти
                </button>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full flex items-center gap-3 rounded-xl bg-gradient-purple px-4 py-3 text-sm font-medium text-primary-foreground">
                  <LogIn className="h-5 w-5" /> Войти
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
