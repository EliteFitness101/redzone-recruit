import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { listNotifications, markNotificationRead, type AppNotification } from "@/lib/recruitment";
import { supabase } from "@/integrations/supabase/client";

export const NotificationCenter = () => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => listNotifications().then(setItems).finally(() => setLoading(false));

  useEffect(() => {
    load();
    const channel = supabase
      .channel("notifications-center")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.filter((i) => !i.read_at).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="glass" size="sm" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-gold text-background text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="px-4 py-3 border-b border-border/50 text-[10px] uppercase tracking-widest text-muted-foreground">
          Notifications
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gold" /></div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <ul>
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={async () => {
                    if (!n.read_at) {
                      await markNotificationRead(n.id);
                      load();
                    }
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-secondary/50 ${
                    n.read_at ? "opacity-60" : ""
                  }`}
                >
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
