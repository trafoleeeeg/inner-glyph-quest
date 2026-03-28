import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, TrendingUp, Activity } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  level: number;
  xp: number;
  streak: number;
  total_missions_completed: number;
  total_dreams_logged: number;
  coins: number;
  created_at: string;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMissions: 0,
    totalDreams: 0,
    totalMoods: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      const admin = data && data.length > 0;
      setIsAdmin(admin);
      if (admin) {
        // Fetch all profiles
        const { data: profiles } = await supabase.from("profiles").select("*").order("level", { ascending: false });
        setUsers(profiles || []);

        // Fetch stats
        const [mc, de, me, cm] = await Promise.all([
          supabase.from("mission_completions").select("*", { count: 'exact', head: true }),
          supabase.from("dream_entries").select("*", { count: 'exact', head: true }),
          supabase.from("mood_entries").select("*", { count: 'exact', head: true }),
          supabase.from("chat_messages").select("*", { count: 'exact', head: true }),
        ]);
        setStats({
          totalUsers: (profiles || []).length,
          totalMissions: mc.count || 0,
          totalDreams: de.count || 0,
          totalMoods: me.count || 0,
          totalMessages: cm.count || 0,
        });
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
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
    { label: "Миссий выполнено", value: stats.totalMissions, icon: Activity, color: "text-accent" },
    { label: "Снов записано", value: stats.totalDreams, icon: TrendingUp, color: "text-dream" },
    { label: "Чекинов", value: stats.totalMoods, icon: Activity, color: "text-energy" },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      <ParticleField />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-5">
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
            Все пользователи
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider border-b border-border/30">
                  <th className="text-left py-2 px-2">Пользователь</th>
                  <th className="text-center py-2 px-2">Уровень</th>
                  <th className="text-center py-2 px-2">XP</th>
                  <th className="text-center py-2 px-2">Стрик</th>
                  <th className="text-center py-2 px-2">Миссии</th>
                  <th className="text-center py-2 px-2">Коины</th>
                  <th className="text-center py-2 px-2">Дата</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-2 font-semibold text-foreground">{u.display_name}</td>
                    <td className="py-2 px-2 text-center font-mono text-primary">{u.level}</td>
                    <td className="py-2 px-2 text-center font-mono text-accent">{u.xp}</td>
                    <td className="py-2 px-2 text-center font-mono text-streak">{u.streak}д</td>
                    <td className="py-2 px-2 text-center font-mono">{u.total_missions_completed}</td>
                    <td className="py-2 px-2 text-center font-mono text-energy">{u.coins}</td>
                    <td className="py-2 px-2 text-center font-mono text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString('ru-RU')}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
