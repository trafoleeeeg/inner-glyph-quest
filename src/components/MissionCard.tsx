import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Mission } from "@/lib/gameData";
import { categoryLabels } from "@/lib/gameData";

interface MissionCardProps {
  mission: Mission;
  onComplete: (id: string) => void;
  index: number;
}

const categoryColorMap: Record<Mission['category'], string> = {
  habit: 'border-primary/30 hover:border-primary/60',
  mood: 'border-energy/30 hover:border-energy/60',
  dream: 'border-dream/30 hover:border-dream/60',
  desire: 'border-secondary/30 hover:border-secondary/60',
  health: 'border-accent/30 hover:border-accent/60',
};

const categoryXpColor: Record<Mission['category'], string> = {
  habit: 'text-primary',
  mood: 'text-energy',
  dream: 'text-dream',
  desire: 'text-secondary',
  health: 'text-accent',
};

const MissionCard = ({ mission, onComplete, index }: MissionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`glass rounded-lg p-4 border transition-all duration-300 cursor-pointer group ${
        mission.completed
          ? 'opacity-50 border-accent/20'
          : categoryColorMap[mission.category]
      }`}
      onClick={() => !mission.completed && onComplete(mission.id)}
      whileHover={!mission.completed ? { scale: 1.01 } : {}}
      whileTap={!mission.completed ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
          mission.completed ? 'bg-accent/20' : 'bg-muted'
        }`}>
          {mission.completed ? <Check className="w-5 h-5 text-accent" /> : mission.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-sm font-semibold ${mission.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {mission.title}
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {categoryLabels[mission.category]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{mission.description}</p>
        </div>
        <div className={`font-mono text-sm font-bold ${mission.completed ? 'text-muted-foreground' : categoryXpColor[mission.category]}`}>
          +{mission.xpReward} XP
        </div>
      </div>
    </motion.div>
  );
};

export default MissionCard;
