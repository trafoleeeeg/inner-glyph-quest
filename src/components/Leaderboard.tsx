import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Flame, TrendingUp } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  streak: number;
  total_missions_completed: number;
}

type SortBy = "level" | "streak" | "missions";

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("level");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("public_profiles")
        .select("user_id, display_name, avatar_url, level, streak, total_missions_completed")
        .order(sortBy === "level" ? "level" : sortBy === "streak" ? "streak" : "total_missions_completed", { ascending: false })
        .limit(50);
      setEntries(data || []);
      setLoading(false);
    };
    fetch();
  }, [sortBy]);

  const tabs: { key: SortBy; label: string; icon: typeof Trophy }[] = [
    { key: "level", label: "Уровень", icon: TrendingUp },
    { key: "streak", label: "Серия", icon: Flame },
    { key: "missions", label: "Привычки", icon: Trophy },
  ];

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  const getValue = (entry: LeaderboardEntry) => {
    if (sortBy === "level") return `Lv.${entry.level}`;
    if (sortBy === "streak") return `${entry.streak}🔥`;
    return `${entry.total_missions_completed}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" /> Рейтинг
        </h3>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1.5">
        {tabs.map(tab => (
          <motion.button key={tab.key} whileTap={{ scale: 0.95 }}
            onClick={() => setSortBy(tab.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
              sortBy === tab.key
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-muted-foreground bg-muted/10 border border-transparent hover:border-border/20"
            }`}>
            <tab.icon className="w-3 h-3" /> {tab.label}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, i) => {
            const isMe = entry.user_id === user?.id;
            const medal = getMedal(i);
            return (
              <motion.button
                key={entry.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/user/${entry.user_id}`)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
                  isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/20"
                } ${i < 3 ? "glass-card border border-border/20" : ""}`}
              >
                <span className="w-6 text-center text-xs font-mono text-muted-foreground">
                  {medal || `${i + 1}`}
                </span>
                <Avatar className="w-7 h-7 border border-border/20">
                  {entry.avatar_url && <AvatarImage src={entry.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-mono">
                    {entry.display_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                    {entry.display_name} {isMe && <span className="text-[9px] text-muted-foreground">(ты)</span>}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-accent">{getValue(entry)}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
