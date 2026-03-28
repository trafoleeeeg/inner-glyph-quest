import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async () => {
    if (!user || !content.trim() || content.trim().length > 2000) return;
    setSubmitting(true);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: content.trim(),
    });
    if (error) {
      toast.error("Ошибка при публикации");
    } else {
      setContent("");
      setFocused(false);
      toast.success("Сигнал отправлен в сеть");
      onPostCreated();
    }
    setSubmitting(false);
  };

  const initials = (profile?.display_name || "N").slice(0, 2).toUpperCase();

  return (
    <motion.div
      layout
      className={`glass-card rounded-2xl p-4 border transition-colors duration-300 ${
        focused ? "border-primary/30" : "border-border/30"
      }`}
    >
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Что ты сейчас видишь яснее?"
            maxLength={2000}
            rows={focused ? 4 : 2}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-relaxed"
          />
          <AnimatePresence>
            {focused && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between pt-3 border-t border-border/20"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono ${content.length > 1800 ? "text-destructive" : "text-muted-foreground/40"}`}>
                    {content.length}/2000
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!content.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary text-xs font-semibold disabled:opacity-30 hover:bg-primary/30 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Транслировать
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default CreatePost;
