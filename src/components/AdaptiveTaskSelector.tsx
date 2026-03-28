import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Battery, BatteryLow, BatteryFull, Zap } from "lucide-react";

const TASK_POOL = [
  { title: "Выпить воды", energy: 1, icon: "💧" },
  { title: "Глубокое дыхание", energy: 1, icon: "🌬️" },
  { title: "Записать мысль", energy: 1, icon: "📝" },
  { title: "Чтение 10 страниц", energy: 2, icon: "📖" },
  { title: "Прогулка 15 мин", energy: 2, icon: "🚶" },
  { title: "Медитация 10 мин", energy: 2, icon: "🧘" },
  { title: "Растяжка", energy: 2, icon: "🤸" },
  { title: "Тренировка 30 мин", energy: 3, icon: "💪" },
  { title: "Изучить новый навык", energy: 3, icon: "🎯" },
  { title: "Холодный душ", energy: 3, icon: "🧊" },
  { title: "Глубокая работа 1ч", energy: 4, icon: "🔥" },
  { title: "Полный детокс от экранов", energy: 4, icon: "📵" },
  { title: "Спринт по целям", energy: 5, icon: "🚀" },
  { title: "Марафон продуктивности", energy: 5, icon: "⚡" },
];

const MODES = [
  { max: 20, label: "Режим отдыха", desc: "Сейчас важно восстановиться. Только лёгкие действия.", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: BatteryLow },
  { max: 40, label: "Мягкий старт", desc: "Энергии немного — начни с простого.", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Battery },
  { max: 60, label: "Баланс", desc: "Хороший уровень. Стандартные задачи по плечу.", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", icon: Battery },
  { max: 80, label: "Высокий ресурс", desc: "Отлично! Можно брать сложные задачи.", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: BatteryFull },
  { max: 101, label: "Максимум", desc: "Ты на пике! Бери самые амбициозные цели.", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", icon: Zap },
];

const AdaptiveTaskSelector = () => {
  const [energy, setEnergy] = useState(50);

  const mode = useMemo(() => MODES.find(m => energy <= m.max) || MODES[2], [energy]);

  const availableTasks = useMemo(() => {
    const maxLevel = energy <= 20 ? 1 : energy <= 40 ? 2 : energy <= 60 ? 3 : energy <= 80 ? 4 : 5;
    return TASK_POOL.filter(t => t.energy <= maxLevel);
  }, [energy]);

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

      {/* Orb visualization */}
      <div className="flex justify-center mb-4">
        <motion.div
          animate={{
            width: 60 + energy * 0.8,
            height: 60 + energy * 0.8,
            opacity: 0.3 + energy * 0.007,
          }}
          transition={{ type: "spring", stiffness: 100 }}
          className="rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / ${0.05 + energy * 0.003}), transparent 70%)`,
          }}
        >
          <span className="text-2xl">🌌</span>
        </motion.div>
      </div>

      {/* Available tasks */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">
          Доступно задач: {availableTasks.length}
        </p>
        <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {availableTasks.map((task) => (
              <motion.div
                key={task.title}
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
