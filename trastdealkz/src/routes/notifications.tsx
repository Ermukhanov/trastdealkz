import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  deal_id: string | null;
  created_at: string;
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Уведомления</h1>
            <p className="mt-1 text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : "Все прочитано"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-lg bg-secondary px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Прочитать все
            </button>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
          ) : notifications.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Нет уведомлений</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id}
                className={`glass-card rounded-xl p-4 flex items-start gap-4 animate-fade-in transition-all ${
                  !n.is_read ? "border-brand-purple/30 bg-brand-purple/5" : ""
                }`}
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    !n.is_read ? "bg-brand-purple" : "bg-muted-foreground/20"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{n.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <span className="text-xs text-muted-foreground/60 mt-1 block">
                    {new Date(n.created_at).toLocaleString("ru-RU")}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="rounded-lg p-2 hover:bg-secondary transition-colors"
                      title="Прочитано"
                    >
                      <Check className="h-4 w-4 text-brand-green" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="rounded-lg p-2 hover:bg-secondary transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
