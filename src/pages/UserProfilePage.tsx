import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, UserMinus, Target, Flame, Moon, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PostCard from "@/components/PostCard";
import CommentsSheet from "@/components/CommentsSheet";
import BottomNav from "@/components/BottomNav";
import ParticleField from "@/components/ParticleField";
import { toast } from "sonner";

const LEVEL_TITLES: Record<number, string> = {
  1: "Спящий агент", 2: "Пробуждённый", 3: "Дешифратор", 4: "Компрессор",
  5: "Мета-Дипломат", 6: "Архитектор", 7: "Провидец", 8: "Нейромант", 9: "Трансцендент", 10: "Демиург",
};

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isMe = user?.id === userId;

  const fetchData = useCallback(async () => {
    if (!userId || !user) return;
    setLoading(true);

    const [profileRes, postsRes, followersRes, followingRes, isFollowingRes, likesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
      supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", userId),
      supabase.from("post_likes").select("post_id").eq("user_id", user.id),
    ]);

    setProfile(profileRes.data);
    setPosts((postsRes.data || []).map(p => ({ ...p, author: profileRes.data })));
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    setIsFollowing(!!(isFollowingRes.data && isFollowingRes.data.length > 0));
    setLikedPosts(new Set((likesRes.data || []).map(l => l.post_id)));
    setLoading(false);
  }, [userId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFollow = async () => {
    if (!user || !userId || isMe) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      setIsFollowing(false);
      setFollowersCount(c => c - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setFollowersCount(c => c + 1);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const handleDelete = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success("Пост удалён");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-mono text-sm">Агент не найден</p>
      </div>
    );
  }

  const initials = profile.display_name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 gradient-border text-center">
          <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-mono">{initials}</AvatarFallback>
          </Avatar>

          <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
          <p className="text-xs font-mono text-primary">{LEVEL_TITLES[profile.level] || LEVEL_TITLES[10]} • LVL {profile.level}</p>
          {profile.bio && <p className="text-xs text-foreground/70 mt-2 max-w-sm mx-auto">{profile.bio}</p>}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4 text-center">
            <div>
              <p className="text-lg font-bold font-mono text-foreground">{posts.length}</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Постов</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-foreground">{followersCount}</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Читателей</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-foreground">{followingCount}</p>
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Читает</p>
            </div>
          </div>

          {/* Follow button */}
          {!isMe && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              className={`mt-4 px-6 py-2 rounded-xl text-xs font-semibold transition-all ${
                isFollowing
                  ? "bg-muted/50 text-muted-foreground border border-border/30 hover:border-destructive/30 hover:text-destructive"
                  : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              }`}
            >
              {isFollowing ? (
                <span className="flex items-center gap-1.5"><UserMinus className="w-3.5 h-3.5" /> Отписаться</span>
              ) : (
                <span className="flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Следить</span>
              )}
            </motion.button>
          )}

          {/* Game stats */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { icon: Target, label: "Протоколов", value: profile.total_missions_completed, color: "text-primary" },
              { icon: Flame, label: "Поток", value: `${profile.streak}д`, color: "text-streak" },
              { icon: Moon, label: "Снов", value: profile.total_dreams_logged, color: "text-dream" },
              { icon: Calendar, label: "Уровень", value: profile.level, color: "text-energy" },
            ].map((s, i) => (
              <div key={i} className="p-2 rounded-xl bg-muted/20 text-center">
                <s.icon className={`w-3.5 h-3.5 ${s.color} mx-auto mb-1`} />
                <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[7px] text-muted-foreground font-mono uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Posts */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span>📡</span> Трансляции
          </h3>
          {posts.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground font-mono py-8">Нет трансляций</p>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPosts.has(post.id)}
                  onLikeToggle={handleLikeToggle}
                  onDelete={isMe ? handleDelete : undefined}
                  onCommentClick={setActiveComments}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CommentsSheet postId={activeComments} onClose={() => setActiveComments(null)} />
      <BottomNav />
    </div>
  );
};

export default UserProfilePage;
