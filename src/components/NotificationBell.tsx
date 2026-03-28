import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const PUBLIC_PROFILES_TABLE = "public_profiles";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  related_user_id: string | null;
  related_user?: { display_name: string; avatar_url: string | null } | null;
}

const ICONS: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) {
        // Fetch related user profiles
        const relatedIds = [...new Set(data.filter(n => n.related_user_id).map(n => n.related_user_id!))];
        let profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
        if (relatedIds.length > 0) {
          const { data: profiles } = await (supabase as any)
            .from(PUBLIC_PROFILES_TABLE)
            .select("user_id, display_name, avatar_url")
            .in("user_id", relatedIds);
          profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        }
        setNotifications(data.map(n => ({ ...n, related_user: n.related_user_id ? profileMap.get(n.related_user_id) || null : null })));
      }
    };
    fetch();

    // Realtime
    const channel = supabase.channel("my-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] text-white font-mono flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-96 glass-card rounded-2xl border border-border/30 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <h3 className="text-sm font-semibold text-foreground">Уведомления</h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ScrollArea className="max-h-72">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground font-mono py-8">Тишина...</p>
                ) : (
                  <div className="p-2 space-y-1">
                    {notifications.map(n => {
                      const Icon = ICONS[n.type] || Bell;
                      return (
                        <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors ${!n.is_read ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            n.type === "like" ? "bg-destructive/10 text-destructive" :
                            n.type === "follow" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-snug">{n.title}</p>
                            {n.body && <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>}
                            <p className="text-[9px] text-muted-foreground/60 font-mono mt-1">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
