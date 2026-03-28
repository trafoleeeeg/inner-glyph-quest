import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

// Illustrative data showing two paths
const data = Array.from({ length: 20 }, (_, i) => {
  const day = i + 1;
  // Destructive: quick spikes that crash
  const destructive = Math.max(0, 40 + Math.sin(day * 0.8) * 30 * Math.exp(-day * 0.03) + (Math.random() - 0.5) * 10 - day * 1.2);
  // Constructive: steady upward trend
  const constructive = Math.min(100, 20 + day * 3.2 + Math.sin(day * 0.5) * 8);
  return { day: `Д${day}`, destructive: Math.round(destructive), constructive: Math.round(constructive) };
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg p-2 border border-border/50 text-xs">
      <p className="font-mono text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
};

const GrowthPathChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/30"
    >
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-green-400" />
        Путь роста vs привычки
      </h3>
      <p className="text-[10px] text-muted-foreground mb-4">
        Почему соцсети истощают, а развитие заряжает? Сравни два пути
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradDestructive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0 80% 55%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(0 80% 55%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradConstructive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(140 70% 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(140 70% 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(220 10% 45%)' }} axisLine={false} tickLine={false} interval={3} />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(220 10% 45%)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="destructive" name="Бездумный скроллинг" stroke="hsl(0 80% 55%)" fill="url(#gradDestructive)" strokeWidth={2} />
          <Area type="monotone" dataKey="constructive" name="Осознанное развитие" stroke="hsl(140 70% 50%)" fill="url(#gradConstructive)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
          <TrendingDown className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-red-400">Путь привычек</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Быстрый дофамин от скроллинга. Пики короткие, потом — пустота</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
          <TrendingUp className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-green-400">Путь роста</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Усложняешь задачи постепенно — интерес и энергия растут стабильно</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GrowthPathChart;
