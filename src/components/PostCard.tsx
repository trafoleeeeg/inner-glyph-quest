import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author?: { display_name: string; level: number; avatar_url?: string | null };
  };
  isLiked: boolean;
  onLikeToggle: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onCommentClick?: (postId: string) => void;
}

const PostCard = ({ post, isLiked, onLikeToggle, onDelete, onCommentClick }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const isOwn = user?.id === post.user_id;
  const initials = (post.author?.display_name || "N").slice(0, 2).toUpperCase();

  const handleLike = () => {
    setLikeAnimating(true);
    onLikeToggle(post.id);
    setTimeout(() => setLikeAnimating(false), 600);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${post.user_id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card rounded-2xl p-4 border border-border/30"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate(`/user/${post.user_id}`)}>
          <Avatar className="w-10 h-10 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">{initials}</AvatarFallback>
          </Avatar>
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/user/${post.user_id}`)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">
              {post.author?.display_name || "Нейронавт"}
            </button>
            <span className="text-[9px] font-mono text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
              LVL {post.author?.level || 1}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ru })}
          </p>
        </div>
        {isOwn && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-full mt-1 glass-card rounded-xl p-1 border border-destructive/20 z-20 min-w-[120px]"
                >
                  <button onClick={() => { onDelete?.(post.id); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Удалить
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/20">
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
        >
          <motion.div animate={likeAnimating ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </motion.div>
          <span className="font-mono">{post.likes_count}</span>
        </motion.button>

        <button onClick={() => onCommentClick?.(post.id)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="font-mono">{post.comments_count}</span>
        </button>

        <button onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;
