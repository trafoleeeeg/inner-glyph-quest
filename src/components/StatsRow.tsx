import { motion } from "framer-motion";
import { Flame, Zap, Moon, Target, Coins } from "lucide-react";

interface StatsRowProps {
  energy: number;
  maxEnergy: number;
  streak: number;
  longestStreak: number;
  totalMissions: number;
  dreamsLogged: number;
  coins: number;
}

const StatsRow = ({ energy, maxEnergy, streak, longestStreak, totalMissions, dreamsLogged, coins }: StatsRowProps) => {
  const energyPercent = Math.round((energy / maxEnergy) * 100);
  const toRecord = longestStreak > streak ? longestStreak - streak : 0;
  
  const stats = [
    { label: "Энергия", value: `${energyPercent}%`, icon: Zap, color: "text-energy", borderColor: "border-energy/20", sub: "" },
    { label: "Серия", value: `${streak}д`, icon: Flame, color: "text-streak", borderColor: "border-streak/20", sub: toRecord > 0 ? `до рекорда: ${toRecord}` : streak > 0 ? "🏆 рекорд!" : "" },
    { label: "Сделано", value: totalMissions, icon: Target, color: "text-primary", borderColor: "border-primary/20", sub: "" },
    { label: "Снов", value: dreamsLogged, icon: Moon, color: "text-dream", borderColor: "border-dream/20", sub: "" },
    { label: "Монеты", value: coins, icon: Coins, color: "text-energy", borderColor: "border-energy/20", sub: "" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-5 gap-2">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={item}
          className={`glass-card rounded-xl p-3 ${stat.borderColor} border text-center hover:glass-card-hover transition-all duration-300 cursor-default`}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
          <p className={`text-lg font-bold font-mono ${stat.color} leading-none`}>{stat.value}</p>
          <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider mt-1">{stat.label}</p>
          {stat.sub && <p className="text-[7px] text-muted-foreground/60 font-mono mt-0.5 truncate">{stat.sub}</p>}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StatsRow;
