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

  const stats = [
    { label: "Энергия", value: `${energyPercent}%` },
    { label: "Серия", value: `${streak}д` },
    { label: "Сделано", value: totalMissions },
    { label: "Снов", value: dreamsLogged },
    { label: "Монеты", value: coins },
  ];

  return (
    <div className="flex justify-between py-4 border-b border-border">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-lg font-bold font-mono text-foreground leading-none">{stat.value}</p>
          <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
