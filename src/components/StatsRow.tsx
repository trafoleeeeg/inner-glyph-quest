import { motion } from "framer-motion";
import { Flame, Zap, Moon, Target } from "lucide-react";

interface StatsRowProps {
  energy: number;
  maxEnergy: number;
  streak: number;
  totalMissions: number;
  dreamsLogged: number;
}

const StatsRow = ({ energy, maxEnergy, streak, totalMissions, dreamsLogged }: StatsRowProps) => {
  const stats = [
    { label: "Энергия", value: `${energy}%`, icon: Zap, color: "text-energy", glow: "glow-energy", bg: "bg-energy/10", border: "border-energy/20" },
    { label: "Стрик", value: `${streak}д`, icon: Flame, color: "text-streak", glow: "", bg: "bg-streak/10", border: "border-streak/20" },
    { label: "Миссии", value: totalMissions, icon: Target, color: "text-primary", glow: "glow-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Сны", value: dreamsLogged, icon: Moon, color: "text-dream", glow: "glow-secondary", bg: "bg-dream/10", border: "border-dream/20" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i, duration: 0.5 }}
          className={`glass rounded-lg p-3 ${stat.border} border`}
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsRow;
