import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutDashboard, FileText, Bot, Wallet, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/" as const, icon: Home, label: "Главная" },
  { to: "/dashboard" as const, icon: LayoutDashboard, label: "Дашборд" },
  { to: "/deals" as const, icon: FileText, label: "Сделки" },
  { to: "/ai-assistant" as const, icon: Bot, label: "AI" },
  { to: "/wallet" as const, icon: Wallet, label: "Кошелёк" },
];

export default function BottomNav() {
  const location = useLocation();
  const [user, setUser] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(!!u));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(!!s?.user));
    return () => subscription.unsubscribe();
  }, []);

  const filtered = user ? items.filter(i => i.to !== "/") : items;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/40 bg-background/90 backdrop-blur-2xl safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {filtered.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-brand-purple"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {user && (
          <Link
            to="/create-deal"
            className="flex flex-col items-center gap-0.5 py-1.5 px-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-purple shadow-lg shadow-brand-purple/30">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
