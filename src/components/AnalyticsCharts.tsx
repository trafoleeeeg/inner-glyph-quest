import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

interface MoodDataPoint {
  date: string;
  mood: number;
  energy: number;
}

interface CompletionDataPoint {
  date: string;
  count: number;
}

interface AiMemoryDataPoint {
  date: string;
  count: number;
}

const AnalyticsCharts = () => {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [completionData, setCompletionData] = useState<CompletionDataPoint[]>([]);
  const [aiMemoryData, setAiMemoryData] = useState<AiMemoryDataPoint[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Mood data
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("mood, energy_level, created_at")
        .eq("user_id", user.id)
        .gte("created_at", twoWeeksAgo)
        .order("created_at");

      if (moods) {
        // Group by date
        const grouped: Record<string, { moods: number[]; energies: number[] }> = {};
        moods.forEach(m => {
          const date = new Date(m.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
          if (!grouped[date]) grouped[date] = { moods: [], energies: [] };
          grouped[date].moods.push(m.mood);
          grouped[date].energies.push(m.energy_level);
        });
        setMoodData(Object.entries(grouped).map(([date, vals]) => ({
          date,
          mood: +(vals.moods.reduce((a, b) => a + b, 0) / vals.moods.length).toFixed(1),
          energy: +(vals.energies.reduce((a, b) => a + b, 0) / vals.energies.length).toFixed(1),
        })));
      }

      // Mission completions
      const { data: completions } = await supabase
        .from("mission_completions")
        .select("completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", twoWeeksAgo)
        .order("completed_at");

      if (completions) {
        const grouped: Record<string, number> = {};
        completions.forEach(c => {
          const date = new Date(c.completed_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
          grouped[date] = (grouped[date] || 0) + 1;
        });
        setCompletionData(Object.entries(grouped).map(([date, count]) => ({ date, count })));
      }
    };
    fetchData();
  }, [user]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-card rounded-lg p-2 border border-border/50 text-xs">
        <p className="font-mono text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  if (moodData.length === 0 && completionData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 border border-border/30 text-center">
        <p className="text-muted-foreground text-sm">📊 Графики появятся после нескольких дней активности</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mood Chart */}
      {moodData.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-energy/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span>📈</span> Настроение и энергия
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={moodData}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(45 100% 55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(45 100% 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(180 100% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(180 100% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="mood" name="Настроение" stroke="hsl(45 100% 55%)" fill="url(#moodGradient)" strokeWidth={2} dot={{ r: 3 }} />
              <Area type="monotone" dataKey="energy" name="Энергия" stroke="hsl(180 100% 50%)" fill="url(#energyGradient)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Completions Chart */}
      {completionData.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-accent/10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span>📊</span> Миссии по дням
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Миссии" fill="hsl(140 70% 50%)" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
