import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Plus, Search, Users, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import NewConversationSheet from "@/components/messaging/NewConversationSheet";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ConversationPreview {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  last_message: string | null;
  last_message_type: string | null;
  last_message_at: string | null;
  unread: boolean;
  other_user?: { display_name: string; avatar_url: string | null; user_id: string };
}

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Get all conversations the user participates in
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participations?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participations.map(p => p.conversation_id);

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    if (!convs) { setLoading(false); return; }

    // For DMs, get the other participant's profile
    const previews: ConversationPreview[] = [];

    for (const conv of convs) {
      let otherUser: ConversationPreview["other_user"];

      if (conv.type === "dm") {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conv.id)
          .neq("user_id", user.id)
          .limit(1);

        if (parts?.length) {
          const { data: profile } = await (supabase as any)
            .from("public_profiles")
            .select("display_name, avatar_url, user_id")
            .eq("user_id", parts[0].user_id)
            .single();
          otherUser = profile || undefined;
        }
      }

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, message_type, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      previews.push({
        id: conv.id,
        type: conv.type,
        name: conv.type === "dm" ? otherUser?.display_name || null : conv.name,
        avatar_url: conv.type === "dm" ? otherUser?.avatar_url || null : conv.avatar_url,
        last_message: lastMsg?.[0]?.content || null,
        last_message_type: lastMsg?.[0]?.message_type || null,
        last_message_at: lastMsg?.[0]?.created_at || conv.created_at,
        unread: false,
        other_user: otherUser,
      });
    }

    setConversations(previews);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Real-time: listen for new messages to update list
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const getMessagePreview = (msg: string | null, type: string | null) => {
    if (!msg && !type) return "Нет сообщений";
    switch (type) {
      case "image": return "📷 Фото";
      case "video": return "🎥 Видео";
      case "audio": return "🎤 Аудио";
      case "video_circle": return "⭕ Кружок";
      case "forwarded_post": return "📎 Пост";
      case "file": return "📄 Файл";
      default: return msg || "Нет сообщений";
    }
  };

  const filtered = conversations.filter(c =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Сообщения</h1>
          <button
            onClick={() => setShowNew(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground hover:bg-muted/30 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-4">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Нет сообщений</p>
            <p className="text-xs text-muted-foreground mb-4">Начни общение с кем-нибудь</p>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold"
            >
              Написать
            </button>
          </div>
        ) : (
          <div>
            {filtered.map((conv, i) => {
              const initials = (conv.name || "?").slice(0, 2).toUpperCase();
              return (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/10 transition-colors text-left"
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    {conv.avatar_url && <AvatarImage src={conv.avatar_url} />}
                    <AvatarFallback className="bg-muted/30 text-muted-foreground text-xs font-mono">
                      {conv.type === "dm" ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-foreground truncate">{conv.name || "Чат"}</span>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: ru })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {getMessagePreview(conv.last_message, conv.last_message_type)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <NewConversationSheet
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(convId) => { setShowNew(false); navigate(`/messages/${convId}`); }}
      />
      <BottomNav />
    </div>
  );
};

export default MessagesPage;
