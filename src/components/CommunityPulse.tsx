import { motion } from "framer-motion";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis } from "recharts";
import { Users } from "lucide-react";

// Illustrative data: clusters of users by task complexity and community engagement
const clusters = [
  // Casual users - low complexity, scattered engagement
  ...Array.from({ length: 12 }, () => ({
    complexity: Math.round(5 + Math.random() * 20),
    engagement: Math.round(10 + Math.random() * 30),
    size: Math.round(40 + Math.random() * 60),
    group: "Начинающие",
  })),
  // Active users - mid complexity, growing engagement
  ...Array.from({ length: 10 }, () => ({
    complexity: Math.round(30 + Math.random() * 25),
    engagement: Math.round(40 + Math.random() * 25),
    size: Math.round(60 + Math.random() * 80),
    group: "Активные",
  })),
  // Power users - high complexity, high engagement
  ...Array.from({ length: 8 }, () => ({
    complexity: Math.round(60 + Math.random() * 30),
    engagement: Math.round(65 + Math.random() * 30),
    size: Math.round(80 + Math.random() * 120),
    group: "Лидеры",
  })),
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card rounded-lg p-2 border border-border/50 text-xs">
      <p className="font-semibold text-foreground">{d.group}</p>
      <p className="text-muted-foreground">Сложность задач: {d.complexity}%</p>
      <p className="text-muted-foreground">Вовлечённость: {d.engagement}%</p>
    </div>
  );
};

const CommunityPulse = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/30"
    >
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Users className="w-4 h-4 text-accent" />
        Пульс сообщества
      </h3>
      <p className="text-[10px] text-muted-foreground mb-4">
        Чем сложнее общие цели — тем крепче связь между участниками
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
          <XAxis
            dataKey="complexity"
            name="Сложность"
            tick={{ fontSize: 9, fill: 'hsl(220 10% 45%)' }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Сложность задач →", position: "bottom", fontSize: 9, fill: 'hsl(220 10% 45%)', offset: -5 }}
          />
          <YAxis
            dataKey="engagement"
            name="Вовлечённость"
            tick={{ fontSize: 9, fill: 'hsl(220 10% 45%)' }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Вовлечённость →", angle: -90, position: "insideLeft", fontSize: 9, fill: 'hsl(220 10% 45%)' }}
          />
          <ZAxis dataKey="size" range={[30, 200]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={clusters.filter(c => c.group === "Начинающие")} fill="hsl(220 70% 50%)" fillOpacity={0.6} />
          <Scatter data={clusters.filter(c => c.group === "Активные")} fill="hsl(45 100% 55%)" fillOpacity={0.6} />
          <Scatter data={clusters.filter(c => c.group === "Лидеры")} fill="hsl(140 70% 50%)" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {[
          { label: "Начинающие", color: "bg-blue-500" },
          { label: "Активные", color: "bg-yellow-500" },
          { label: "Лидеры", color: "bg-green-500" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[9px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-muted-foreground/60 text-center mt-2 font-mono">
        Совместные цели создают более крепкие связи, чем лайки
      </p>
    </motion.div>
  );
};

export default CommunityPulse;
