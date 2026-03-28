import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import CommentsSheet from "@/components/CommentsSheet";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import ParticleField from "@/components/ParticleField";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PUBLIC_PROFILES_TABLE = "public_profiles";

interface PostWithAuthor {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  image_url?: string | null;
  post_type?: string;
  author?: { display_name: string; level: number; avatar_url?: string | null };
}

interface PublicProfile {
  user_id: string;
  display_name: string;
  level: number;
  avatar_url: string | null;
}

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "following">("all");

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);

    if (tab === "following") {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (follows || []).map(f => f.following_id);
      ids.push(user.id);
      query = query.in("user_id", ids);
    }

    const { data: postsData } = await query;
    if (!postsData) { setLoading(false); return; }

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profilesData } = await (supabase as any)
      .from(PUBLIC_PROFILES_TABLE)
      .select("user_id, display_name, level, avatar_url")
      .in("user_id", userIds);
    const profiles = (profilesData || []) as unknown as PublicProfile[];
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    setPosts(postsData.map(p => ({ ...p, author: profileMap.get(p.user_id) as any })));

    const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
    setLikedPosts(new Set((likes || []).map(l => l.post_id)));
    setLoading(false);
  }, [user, tab]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase.channel("feed-posts").on(
      "postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => fetchPosts()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const handleLikeToggle = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    const post = posts.find(p => p.id === postId);

    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
      // Send notification to post author
      if (post && post.user_id !== user.id) {
        supabase.rpc('send_notification', {
          p_target_user_id: post.user_id,
          p_type: "like",
          p_title: "Твой сигнал срезонировал",
          p_body: post.content?.slice(0, 50),
          p_related_user_id: user.id,
          p_related_post_id: postId,
        });
      }
    }
  };

  const handleDelete = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success("Пост удалён");
  };

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-primary text-glow-primary font-display">Сигнальная Сеть</h1>
            <p className="text-[10px] text-muted-foreground font-mono">трансляции нейронавтов</p>
          </div>
          <NotificationBell />
        </motion.div>

        <div className="flex items-center gap-2 justify-center">
          {(["all", "following"] as const).map(t => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono transition-all ${
                tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "all" ? "Все сигналы" : "Подписки"}
            </motion.button>
          ))}
          <motion.button whileTap={{ scale: 0.9, rotate: 180 }} onClick={fetchPosts}
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>

        <CreatePost onPostCreated={fetchPosts} />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-sm text-muted-foreground font-mono">
              {tab === "following" ? "Подпишись на нейронавтов" : "Эфир пуст. Отправь первый сигнал."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <PostCard key={post.id} post={post} isLiked={likedPosts.has(post.id)}
                onLikeToggle={handleLikeToggle} onDelete={handleDelete} onCommentClick={setActiveComments} />
            ))}
          </div>
        )}
      </div>

      <CommentsSheet postId={activeComments} onClose={() => setActiveComments(null)} />
      <BottomNav />
    </div>
  );
};

export default FeedPage;
