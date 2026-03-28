import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

export interface MissionData {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  xp_reward: number;
  completed?: boolean;
}

interface MissionCardProps {
  mission: MissionData;
  onComplete: (id: string) => void;
  index: number;
  devaluation?: number; // 0-1, how much XP is reduced
}

const categoryColors: Record<string, { border: string; text: string; bg: string }> = {
  habit: { border: 'border-primary/20 hover:border-primary/50', text: 'text-primary', bg: 'bg-primary/10' },
  mood: { border: 'border-energy/20 hover:border-energy/50', text: 'text-energy', bg: 'bg-energy/10' },
  dream: { border: 'border-dream/20 hover:border-dream/50', text: 'text-dream', bg: 'bg-dream/10' },
  desire: { border: 'border-secondary/20 hover:border-secondary/50', text: 'text-secondary', bg: 'bg-secondary/10' },
  health: { border: 'border-accent/20 hover:border-accent/50', text: 'text-accent', bg: 'bg-accent/10' },
  custom: { border: 'border-primary/20 hover:border-primary/50', text: 'text-primary', bg: 'bg-primary/10' },
};

const categoryLabels: Record<string, string> = {
  habit: 'Ритуал', mood: 'Сканер', dream: 'Синхр.',
  desire: 'Вектор', health: 'Каркас', custom: 'Своё',
};

const MissionCard = ({ mission, onComplete, index, devaluation }: MissionCardProps) => {
  const colors = categoryColors[mission.category] || categoryColors.custom;
  const effectiveXP = devaluation && devaluation > 0
    ? Math.max(Math.floor(mission.xp_reward * (1 - devaluation)), Math.floor(mission.xp_reward * 0.3))
    : mission.xp_reward;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card rounded-xl p-4 border transition-all duration-300 cursor-pointer group ${
        mission.completed ? 'opacity-40 border-accent/10' : colors.border
      }`}
      onClick={() => !mission.completed && onComplete(mission.id)}
      whileHover={!mission.completed ? { scale: 1.01, y: -1 } : {}}
      whileTap={!mission.completed ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
            mission.completed ? 'bg-accent/20' : colors.bg
          }`}
          animate={!mission.completed ? {
            boxShadow: ['0 0 0px transparent', '0 0 12px hsl(180 100% 50% / 0.15)', '0 0 0px transparent']
          } : {}}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
        >
          {mission.completed ? <Check className="w-5 h-5 text-accent" /> : mission.icon}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-sm font-semibold ${mission.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {mission.title}
            </h3>
            <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
              {categoryLabels[mission.category] || mission.category}
            </span>
          </div>
          {mission.description && (
            <p className="text-xs text-muted-foreground truncate">{mission.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div className="flex items-center gap-1">
            {!mission.completed && <Sparkles className={`w-3 h-3 ${colors.text} opacity-50`} />}
            <span className={`font-mono text-sm font-bold ${mission.completed ? 'text-muted-foreground' : colors.text}`}>
              +{effectiveXP}
            </span>
          </div>
          {devaluation && devaluation > 0.1 && !mission.completed && (
            <span className="text-[8px] font-mono text-muted-foreground/50">
              энтропия↓
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MissionCard;
