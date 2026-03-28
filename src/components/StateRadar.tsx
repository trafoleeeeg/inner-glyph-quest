import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Brain, Activity, Heart } from "lucide-react";

const StateRadar = () => {
  const [energy, setEnergy] = useState(70);
  const [focus, setFocus] = useState(60);
  const [mood, setMood] = useState(80);

  const radarData = useMemo(() => [
    { axis: "Энергия", value: energy },
    { axis: "Фокус", value: focus },
    { axis: "Настроение", value: mood },
    { axis: "Баланс", value: Math.round((energy + focus + mood) / 3) },
    { axis: "Резерв", value: Math.min(100, Math.round((energy * 0.4 + focus * 0.35 + mood * 0.25))) },
  ], [energy, focus, mood]);

  const reserve = Math.round((energy * 0.4 + focus * 0.35 + mood * 0.25));

  const analysis = useMemo(() => {
    if (reserve >= 75) return { text: "Высокий ресурс. Можно браться за сложные многоэтапные цели.", color: "text-green-400", emoji: "🚀" };
    if (reserve >= 50) return { text: "Нормальный уровень. Стандартные задачи и привычки — то, что нужно.", color: "text-primary", emoji: "✨" };
    if (reserve >= 30) return { text: "Ресурс снижен. Лучше сосредоточиться на простом и восстановлении.", color: "text-orange-400", emoji: "🔋" };
    return { text: "Низкий ресурс. Сейчас важнее отдых, чем продуктивность.", color: "text-red-400", emoji: "💤" };
  }, [reserve]);

  const sliders = [
    { label: "Физическая энергия", value: energy, set: setEnergy, icon: Activity, color: "text-green-400", hint: "Определяет количество физических задач" },
    { label: "Ментальный фокус", value: focus, set: setFocus, icon: Brain, color: "text-blue-400", hint: "Влияет на сложность интеллектуальных задач" },
    { label: "Настроение", value: mood, set: setMood, icon: Heart, color: "text-pink-400", hint: "Влияет на социальные и творческие задачи" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/30"
    >
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        Моё состояние сейчас
      </h3>
      <p className="text-[10px] text-muted-foreground mb-4">
        Настрой ползунки — увидишь свой запас сил для изменений
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Sliders */}
        <div className="space-y-4">
          {sliders.map(({ label, value, set, icon: Icon, color, hint }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-xs text-foreground/80">{label}</span>
                </div>
                <span className={`text-xs font-mono font-bold ${color}`}>{value}</span>
              </div>
              <Slider
                value={[value]}
                onValueChange={([v]) => set(v)}
                max={100}
                step={5}
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">{hint}</p>
            </div>
          ))}

          {/* Analysis */}
          <motion.div
            key={analysis.text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl p-3 bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{analysis.emoji}</span>
              <span className={`text-xs font-bold ${analysis.color}`}>
                Запас сил: {reserve}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{analysis.text}</p>
          </motion.div>
        </div>

        {/* Radar */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220 15% 20%)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }}
              />
              <Radar
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default StateRadar;
