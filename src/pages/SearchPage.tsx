import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import ParticleField from "@/components/ParticleField";

const PUBLIC_PROFILES_TABLE = "public_profiles";

interface UserResult {
  user_id: string;
  display_name: string;
  level: number;
  avatar_url: string | null;
  total_missions_completed: number;
  streak: number;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Спящий агент", 2: "Пробуждённый", 3: "Дешифратор", 4: "Компрессор",
  5: "Мета-Дипломат", 6: "Архитектор", 7: "Провидец", 8: "Нейромант", 9: "Трансцендент", 10: "Демиург",
};

const SearchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [topUsers, setTopUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    Promise.all([
      (supabase as any)
        .from(PUBLIC_PROFILES_TABLE)
        .select("user_id, display_name, level, avatar_url, total_missions_completed, streak")
        .order("level", { ascending: false })
        .order("total_missions_completed", { ascending: false })
        .limit(20),
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
    ]).then(([usersRes, followsRes]) => {
      setTopUsers((usersRes.data || []) as UserResult[]);
      setFollowingIds(new Set((followsRes.data || []).map(f => f.following_id)));
    });
  }, [user]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from(PUBLIC_PROFILES_TABLE)
        .select("user_id, display_name, level, avatar_url, total_missions_completed, streak")
        .ilike("display_name", `%${query.trim()}%`).limit(20);
      setResults((data || []) as UserResult[]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleFollow = async (targetId: string) => {
    if (!user || targetId === user.id) return;
    if (followingIds.has(targetId)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowingIds(prev => { const next = new Set(prev); next.delete(targetId); return next; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowingIds(prev => new Set(prev).add(targetId));
      // Notification
      supabase.rpc('send_notification', {
        p_target_user_id: targetId, p_type: "follow",
        p_title: "Новый наблюдатель в твоей сети",
        p_related_user_id: user.id,
      });
    }
  };

  const displayList = query.trim() ? results : topUsers;

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
          <h1 className="text-xl font-bold text-primary text-glow-primary font-display">Нейронавты</h1>
          <p className="text-[10px] text-muted-foreground font-mono">найди тех, кто рассеивает туман</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-1 border border-border/30 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground ml-3" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по имени..."
            className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
        </motion.div>

        <div className="flex items-center gap-2">
          {query.trim() ? (
            <><Search className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-mono text-muted-foreground">Результаты</span></>
          ) : (
            <><TrendingUp className="w-3.5 h-3.5 text-energy" /><span className="text-xs font-mono text-muted-foreground">Лидерборд</span></>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground font-mono py-12">Агенты не найдены</p>
        ) : (
          <div className="space-y-2">
            {displayList.map((u, i) => {
              const isMe = u.user_id === user?.id;
              const isFollowing = followingIds.has(u.user_id);
              const initials = u.display_name.slice(0, 2).toUpperCase();
              return (
                <motion.div key={u.user_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-xl p-3 flex items-center gap-3 border border-border/20 hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/user/${u.user_id}`)}>
                  {!query.trim() && (
                    <span className={`text-xs font-mono w-5 text-center ${i < 3 ? "text-energy font-bold" : "text-muted-foreground/40"}`}>{i + 1}</span>
                  )}
                  <Avatar className="w-9 h-9 border border-primary/15">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-mono">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{u.display_name}</span>
                      <span className="text-[9px] font-mono text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">LVL {u.level}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {LEVEL_TITLES[u.level] || LEVEL_TITLES[10]} • 🔥{u.streak}д • {u.total_missions_completed} протоколов
                    </p>
                  </div>
                  {!isMe && (
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); handleFollow(u.user_id); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                        isFollowing ? "bg-muted/50 text-muted-foreground border border-border/30" : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                      }`}>
                      {isFollowing ? "Отписаться" : "Следить"}
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default SearchPage;
