import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, TrendingUp, Activity, Copy, Check, MessageCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import ActivityLog from "@/components/admin/ActivityLog";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  streak: number;
  longest_streak: number;
  total_missions_completed: number;
  total_dreams_logged: number;
  coins: number;
  energy: number;
  stagnation_index: number;
  last_active_date: string | null;
  created_at: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMissions: 0,
    totalDreams: 0,
    totalMoods: 0,
    totalMessages: 0,
    activeToday: 0,
  });

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      const admin = data && data.length > 0;
      setIsAdmin(admin);
      if (admin) {
        const { data: profiles } = await supabase.from("profiles").select("*").order("level", { ascending: false });
        setUsers((profiles || []) as UserProfile[]);

        const today = new Date().toISOString().split("T")[0];
        const activeToday = (profiles || []).filter((p: any) => p.last_active_date === today).length;

        const [mc, de, me, cm] = await Promise.all([
          supabase.from("mission_completions").select("*", { count: 'exact', head: true }),
          supabase.from("dream_entries").select("*", { count: 'exact', head: true }),
          supabase.from("mood_entries").select("*", { count: 'exact', head: true }),
          supabase.from("messages").select("*", { count: 'exact', head: true }),
        ]);
        setStats({
          totalUsers: (profiles || []).length,
          totalMissions: mc.count || 0,
          totalDreams: de.count || 0,
          totalMoods: me.count || 0,
          totalMessages: cm.count || 0,
          activeToday,
        });
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("ID скопирован");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActivityStatus = (lastActive: string | null) => {
    if (!lastActive) return { label: "Нет данных", color: "text-muted-foreground" };
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (lastActive === today) return { label: "Онлайн", color: "text-green-400" };
    if (lastActive === yesterday) return { label: "Вчера", color: "text-yellow-400" };
    const days = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000);
    if (days <= 7) return { label: `${days}д назад`, color: "text-orange-400" };
    return { label: `${days}д назад`, color: "text-red-400" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1">Доступ запрещён</h2>
          <p className="text-sm text-muted-foreground mb-4">У вас нет прав администратора</p>
          <button onClick={() => navigate("/")} className="text-primary text-sm hover:underline">← Вернуться</button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Пользователи", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Активны сегодня", value: stats.activeToday, icon: Activity, color: "text-green-400" },
    { label: "Миссий выполнено", value: stats.totalMissions, icon: TrendingUp, color: "text-accent" },
    { label: "Сообщений", value: stats.totalMessages, icon: MessageCircle, color: "text-energy" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <Shield className="w-5 h-5 text-destructive" />
          <h1 className="text-lg font-bold text-foreground">Админ панель</h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 text-center border border-border/30">
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Users table */}
        <div className="glass-card rounded-2xl p-5 border border-border/30">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Все пользователи ({users.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider border-b border-border/30">
                  <th className="text-left py-2 px-2">Ник</th>
                  <th className="text-left py-2 px-2">User ID</th>
                  <th className="text-center py-2 px-2">Статус</th>
                  <th className="text-center py-2 px-2">Lvl</th>
                  <th className="text-center py-2 px-2">XP</th>
                  <th className="text-center py-2 px-2">Стрик</th>
                  <th className="text-center py-2 px-2">Рекорд</th>
                  <th className="text-center py-2 px-2">Миссии</th>
                  <th className="text-center py-2 px-2">⚡</th>
                  <th className="text-center py-2 px-2">📈</th>
                  <th className="text-center py-2 px-2">💰</th>
                  <th className="text-center py-2 px-2">Рег.</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const activity = getActivityStatus(u.last_active_date);
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center text-[8px] font-mono text-muted-foreground">
                              {u.display_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-foreground text-xs">{u.display_name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <button
                          onClick={() => copyId(u.user_id)}
                          className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                          title={u.user_id}
                        >
                          {u.user_id.slice(0, 8)}...
                          {copiedId === u.user_id ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-[10px] font-mono ${activity.color}`}>{activity.label}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-primary text-xs">{u.level}</td>
                      <td className="py-2 px-2 text-center font-mono text-accent text-xs">{u.xp}</td>
                      <td className="py-2 px-2 text-center font-mono text-streak text-xs">{u.streak}д</td>
                      <td className="py-2 px-2 text-center font-mono text-muted-foreground text-xs">{u.longest_streak}д</td>
                      <td className="py-2 px-2 text-center font-mono text-xs">{u.total_missions_completed}</td>
                      <td className="py-2 px-2 text-center font-mono text-energy text-xs">{u.energy}</td>
                      <td className="py-2 px-2 text-center font-mono text-xs">{Math.round(Number(u.stagnation_index))}%</td>
                      <td className="py-2 px-2 text-center font-mono text-energy text-xs">{u.coins}</td>
                      <td className="py-2 px-2 text-center font-mono text-muted-foreground text-[10px]">
                        {new Date(u.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
