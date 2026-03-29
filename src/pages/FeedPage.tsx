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
import { RefreshCw, Search } from "lucide-react";
import RSSFeed from "@/components/RSSFeed";
import Leaderboard from "@/components/Leaderboard";
import SyntheticFeed from "@/components/SyntheticFeed";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "following" | "arena" | "rss" | "leaderboard">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

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

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from("public_profiles")
        .select("user_id, display_name, level, avatar_url")
        .ilike("display_name", `%${searchQuery.trim()}%`).limit(8);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
            <h1 className="text-xl font-bold text-primary text-glow-primary font-display">Лента</h1>
            <p className="text-[10px] text-muted-foreground font-mono">посты сообщества</p>
          </div>
          <NotificationBell />
        </motion.div>

        {/* Search bar */}
        <div className="relative">
          <div className="glass-card rounded-xl p-1 border border-border/30 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground ml-3" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Найти людей..."
              className="flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-xl border border-border/30 z-20 overflow-hidden">
              {searchResults.map((u: any) => (
                <button key={u.user_id} onClick={() => { navigate(`/user/${u.user_id}`); setSearchQuery(""); }}
                  className="w-full flex items-center gap-2 p-2.5 hover:bg-muted/20 transition-colors text-left">
                  <Avatar className="w-7 h-7 border border-primary/15">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-mono">{u.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground flex-1">{u.display_name}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">Lv.{u.level}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 justify-center flex-wrap">
          {(["all", "following", "rss", "leaderboard"] as const).map(t => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono transition-all ${
                tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "all" ? "Все посты" : t === "following" ? "Подписки" : t === "rss" ? "📚 Читать" : "🏆 Рейтинг"}
            </motion.button>
          ))}
          {(tab === "all" || tab === "following") && (
            <motion.button whileTap={{ scale: 0.9, rotate: 180 }} onClick={fetchPosts}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {tab === "rss" ? (
          <RSSFeed />
        ) : tab === "leaderboard" ? (
          <Leaderboard />
        ) : (
          <>
            <CreatePost onPostCreated={fetchPosts} />

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <p className="text-4xl mb-3">📡</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {tab === "following" ? "Подпишись на интересных людей" : "Пока нет постов. Напиши первый!"}
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
          </>
        )}
      </div>

      <CommentsSheet postId={activeComments} onClose={() => setActiveComments(null)} />
      <BottomNav />
    </div>
  );
};

export default FeedPage;
