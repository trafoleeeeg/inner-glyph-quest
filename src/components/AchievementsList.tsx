import { motion } from "framer-motion";
import type { Achievement } from "@/lib/gameData";

interface AchievementsListProps {
  achievements: Achievement[];
}

const AchievementsList = ({ achievements }: AchievementsListProps) => {
  return (
    <div className="glass rounded-lg p-4 border border-border/50">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span>🏆</span> Достижения
      </h3>
      <div className="space-y-2">
        {achievements.map((ach, i) => {
          const progress = Math.min((ach.progress / ach.maxProgress) * 100, 100);
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 p-2 rounded-lg ${ach.unlocked ? 'bg-accent/5 border border-accent/20' : 'bg-muted/30'}`}
            >
              <span className={`text-lg ${ach.unlocked ? '' : 'grayscale opacity-50'}`}>{ach.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${ach.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ach.unlocked ? 'bg-accent' : 'bg-muted-foreground/30'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {ach.progress}/{ach.maxProgress}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsList;
