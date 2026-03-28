import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Battery, BatteryLow, BatteryFull, Zap } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  icon: string;
  xp_reward: number;
  category: string;
}

const MODES = [
  { max: 20, label: "Режим отдыха", desc: "Сейчас важно восстановиться. Только лёгкие действия.", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: BatteryLow },
  { max: 40, label: "Мягкий старт", desc: "Энергии немного — начни с простого.", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Battery },
  { max: 60, label: "Баланс", desc: "Хороший уровень. Стандартные задачи по плечу.", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: Battery },
  { max: 80, label: "Высокий ресурс", desc: "Отлично! Можно брать сложные задачи.", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: BatteryFull },
  { max: 101, label: "Максимум", desc: "Ты на пике! Бери самые амбициозные цели.", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", icon: Zap },
];

const AdaptiveTaskSelector = ({ missions }: { missions: Mission[] }) => {
  const [energy, setEnergy] = useState(50);

  const mode = useMemo(() => MODES.find(m => energy <= m.max) || MODES[2], [energy]);

  // Map mission xp_reward to energy levels: low xp = easy, high xp = hard
  const availableTasks = useMemo(() => {
    const maxXP = energy <= 20 ? 20 : energy <= 40 ? 30 : energy <= 60 ? 40 : energy <= 80 ? 50 : 999;
    return missions.filter(m => m.xp_reward <= maxXP);
  }, [energy, missions]);

  if (missions.length === 0) return null;

  const ModeIcon = mode.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/30"
    >
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        Умный подбор задач
      </h3>
      <p className="text-[10px] text-muted-foreground mb-4">
        Подвинь ползунок — система подберёт задачи под твоё состояние
      </p>

      {/* Energy Slider */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono">Твоя энергия сейчас</span>
          <span className={`font-bold font-mono ${mode.color}`}>{energy}%</span>
        </div>
        <Slider
          value={[energy]}
          onValueChange={([v]) => setEnergy(v)}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Mode indicator */}
      <motion.div
        key={mode.label}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl p-3 ${mode.bg} border ${mode.border} mb-4`}
      >
        <div className="flex items-center gap-2 mb-1">
          <ModeIcon className={`w-4 h-4 ${mode.color}`} />
          <span className={`text-sm font-bold ${mode.color}`}>{mode.label}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{mode.desc}</p>
      </motion.div>

      {/* Available tasks from user's habits */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">
          Доступно: {availableTasks.length} из {missions.length}
        </p>
        <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {availableTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/20 border border-border/20"
              >
                <span className="text-sm">{task.icon}</span>
                <span className="text-[10px] text-foreground/80 leading-tight">{task.title}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AdaptiveTaskSelector;
