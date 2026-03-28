import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import CommentsSheet from "@/components/CommentsSheet";
import { ArrowLeft, Trophy, Target, Moon, Flame, TrendingUp, Calendar, Coins, Settings, LogOut, Edit3, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const LEVEL_TITLES: Record<number, string> = {
  1: "Новичок", 2: "Исследователь", 3: "Практик", 4: "Стратег",
  5: "Наставник", 6: "Архитектор", 7: "Мастер", 8: "Эксперт", 9: "Гуру", 10: "Легенда",
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [moodStats, setMoodStats] = useState({ avgMood: 0, avgEnergy: 0, count: 0 });
  const [recentRewards, setRecentRewards] = useState<any[]>([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [tab, setTab] = useState<"posts" | "stats">("posts");
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    const [postsRes, likesRes] = await Promise.all([
      supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("post_likes").select("post_id").eq("user_id", user.id),
    ]);
    setPosts((postsRes.data || []).map(p => ({ ...p, author: profile ? { display_name: profile.display_name, level: profile.level } : undefined })));
    setLikedPosts(new Set((likesRes.data || []).map(l => l.post_id)));
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from("mood_entries").select("mood, energy_level").eq("user_id", user.id).gte("created_at", weekAgo),
      supabase.from("mission_completions").select("*", { count: 'exact', head: true }).eq("user_id", user.id).gte("completed_at", weekAgo),
      supabase.from("rewards_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
    ]).then(([moods, completions, rewards, followers, following]) => {
      if (moods.data?.length) {
        setMoodStats({
          avgMood: +(moods.data.reduce((s, m) => s + m.mood, 0) / moods.data.length).toFixed(1),
          avgEnergy: +(moods.data.reduce((s, m) => s + m.energy_level, 0) / moods.data.length).toFixed(1),
          count: moods.data.length,
        });
      }
      setWeeklyCompletions(completions.count || 0);
      setRecentRewards(rewards.data || []);
      setFollowersCount(followers.count || 0);
      setFollowingCount(following.count || 0);
    });
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleNameSave = async () => {
    if (nameInput.trim() && nameInput.trim().length <= 30) {
      await updateProfile({ display_name: nameInput.trim() } as any);
      setEditingName(false);
    }
  };

  const handleBioSave = async () => {
    await updateProfile({ bio: bioInput.trim() } as any);
    setEditingBio(false);
    toast.success("Био обновлено");
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

  const handleDeletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success("Пост удалён");
  };

  if (!profile) return null;
  const moodEmoji = ['', '😫', '😕', '😐', '😊', '🔥'];
  const initials = profile.display_name.slice(0, 2).toUpperCase();

  const statCards = [
    { icon: Target, label: "Протоколов", value: profile.total_missions_completed, color: "text-primary" },
    { icon: Moon, label: "Синхронизаций", value: profile.total_dreams_logged, color: "text-dream" },
    { icon: Flame, label: "Поток", value: `${profile.streak}д`, color: "text-streak" },
    { icon: Trophy, label: "Макс. поток", value: `${profile.longest_streak}д`, color: "text-energy" },
    { icon: Calendar, label: "За неделю", value: weeklyCompletions, color: "text-accent" },
    { icon: Coins, label: "Коины", value: profile.coins, color: "text-energy" },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header with sign out */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Мой профиль</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/admin")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive/70 hover:text-destructive bg-destructive/5 border border-destructive/10 transition-colors">
                <Shield className="w-3.5 h-3.5" /> Админ
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Выход
            </motion.button>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 gradient-border text-center">
          <Avatar className="w-20 h-20 mx-auto mb-3 border-2 border-primary/20">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-mono">{initials}</AvatarFallback>
          </Avatar>
          
          {editingName ? (
            <div className="flex items-center gap-2 justify-center mb-1">
              <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={30}
                className="bg-muted/30 border border-primary/30 rounded-lg px-3 py-1 text-center text-sm text-foreground focus:outline-none" autoFocus />
              <button onClick={handleNameSave} className="text-xs text-primary hover:underline">✓</button>
              <button onClick={() => setEditingName(false)} className="text-xs text-muted-foreground hover:underline">✗</button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
              <button onClick={() => { setNameInput(profile.display_name); setEditingName(true); }} className="text-muted-foreground/50 hover:text-primary transition-colors">
                <Settings className="w-3 h-3" />
              </button>
            </div>
          )}
          <p className="text-xs font-mono text-primary">{LEVEL_TITLES[profile.level] || LEVEL_TITLES[10]} • LVL {profile.level}</p>

          {/* Bio */}
          {editingBio ? (
            <div className="mt-2 max-w-sm mx-auto">
              <textarea value={bioInput} onChange={e => setBioInput(e.target.value)} maxLength={200} rows={2}
                className="w-full bg-muted/30 border border-primary/30 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none resize-none" autoFocus />
              <div className="flex gap-2 justify-center mt-1">
                <button onClick={handleBioSave} className="text-xs text-primary hover:underline">Сохранить</button>
                <button onClick={() => setEditingBio(false)} className="text-xs text-muted-foreground hover:underline">Отмена</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-xs text-foreground/60 max-w-sm">{(profile as any).bio || "Расскажи о себе..."}</p>
              <button onClick={() => { setBioInput((profile as any).bio || ""); setEditingBio(true); }} className="text-muted-foreground/30 hover:text-primary transition-colors">
                <Edit3 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {/* Social stats */}
          <div className="flex items-center justify-center gap-6 mt-4">
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

          {/* XP bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-primary">Негэнтропия</span>
              <span className="text-muted-foreground">{profile.xp}/{profile.xp_to_next}</span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }}
                animate={{ width: `${(profile.xp / profile.xp_to_next) * 100}%` }}
                transition={{ duration: 1 }}
                style={{ boxShadow: '0 0 10px hsl(180 100% 50% / 0.4)' }} />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-2 justify-center">
          {(["posts", "stats"] as const).map(t => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono transition-all ${
                tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "posts" ? "Трансляции" : "Аналитика"}
            </motion.button>
          ))}
        </div>

        {tab === "posts" ? (
          <div className="space-y-3">
            <CreatePost onPostCreated={fetchPosts} />
            {posts.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground font-mono py-8">Напиши свой первый пост</p>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} isLiked={likedPosts.has(post.id)}
                  onLikeToggle={handleLikeToggle} onDelete={handleDeletePost} onCommentClick={setActiveComments} />
              ))
            )}
          </div>
        ) : (
          <>
            {/* Mood summary */}
            {moodStats.count > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-5 border border-energy/10">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-energy" /> Телеметрия за неделю
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl bg-energy/5 border border-energy/10">
                    <span className="text-2xl">{moodEmoji[Math.round(moodStats.avgMood)] || '😐'}</span>
                    <p className="text-lg font-bold font-mono text-energy mt-1">{moodStats.avgMood}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Ср. сигнал</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <span className="text-2xl">⚡</span>
                    <p className="text-lg font-bold font-mono text-primary mt-1">{moodStats.avgEnergy}</p>
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Ср. ресурс</p>
                  </div>
                </div>
              </motion.div>
            )}

            <AnalyticsCharts />

            {/* Stats Grid */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span>📊</span> Метрики сжатия</h3>
              <div className="grid grid-cols-3 gap-2">
                {statCards.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className="glass-card rounded-xl p-3 text-center border border-border/30" whileHover={{ y: -2 }}>
                    <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                    <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
                    <p className="text-[8px] text-muted-foreground font-mono uppercase tracking-wider leading-tight mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Rewards */}
            {recentRewards.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-5 border border-secondary/10">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span>🎁</span> Аномалии данных</h3>
                <div className="space-y-2">
                  {recentRewards.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                      <span className="text-lg">{r.reward_type === 'critical_hit' ? '⚡' : '📦'}</span>
                      <div className="flex-1">
                        <p className="text-xs text-foreground">{r.description}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{new Date(r.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <span className="text-xs font-mono text-accent">+{r.xp_amount}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      <CommentsSheet postId={activeComments} onClose={() => setActiveComments(null)} />
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
