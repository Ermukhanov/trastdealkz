import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase автоматически обрабатывает сессию при редиректе
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/login" });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate({ to: "/login" });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mb-4"></div>
        <p className="text-muted-foreground">Обработка входа...</p>
      </div>
    </div>
  );
}
