import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

const PUBLIC_PROFILES_TABLE = "public_profiles";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { display_name: string };
}

interface CommentsSheetProps {
  postId: string | null;
  onClose: () => void;
}

const CommentsSheet = ({ postId, onClose }: CommentsSheetProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!postId) return;
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch author profiles
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await (supabase as any)
        .from(PUBLIC_PROFILES_TABLE)
        .select("user_id, display_name")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setComments(data.map(c => ({ ...c, author: profileMap.get(c.user_id) as any })));
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !postId || !input.trim()) return;
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: input.trim(),
    });
    if (!error) {
      setInput("");
      fetchComments();
      // Update comment count
      await supabase.from("posts").update({ comments_count: comments.length + 1 }).eq("id", postId);
      // Send notification to post author
      const { data: post } = await supabase.from("posts").select("user_id, content").eq("id", postId).single();
      if (post && post.user_id !== user.id) {
        supabase.rpc('send_notification', {
          p_target_user_id: post.user_id,
          p_type: "comment",
          p_title: "Новый комментарий к посту",
          p_body: input.trim().slice(0, 50),
          p_related_user_id: user.id,
          p_related_post_id: postId,
        });
      }
    } else {
      toast.error("Ошибка");
    }
  };

  return (
    <AnimatePresence>
      {postId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 max-h-[70vh] glass-card rounded-t-3xl border-t border-primary/10 flex flex-col"
          >
            {/* Handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-foreground">Комментарии</h3>
              <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments list */}
            <ScrollArea className="flex-1 px-5 pb-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8 font-mono">Тишина в эфире...</p>
              ) : (
                <div className="space-y-3 py-2">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="bg-muted text-[9px] font-mono text-muted-foreground">
                          {(c.author?.display_name || "N").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-foreground">{c.author?.display_name || "Участник"}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ru })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="px-5 py-3 border-t border-border/20 flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Ответить..."
                maxLength={500}
                className="flex-1 bg-muted/30 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-primary/20 text-primary disabled:opacity-30 hover:bg-primary/30 transition-all"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentsSheet;
