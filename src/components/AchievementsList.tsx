import { motion } from "framer-motion";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

interface AchievementsListProps {
  achievements: Achievement[];
}

const AchievementsList = ({ achievements }: AchievementsListProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/30">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span>🏆</span> Достижения
        <span className="text-xs font-mono text-muted-foreground ml-auto">
          {achievements.filter(a => a.unlocked).length}/{achievements.length}
        </span>
      </h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {achievements.map((ach) => {
          const progress = Math.min((ach.progress / ach.maxProgress) * 100, 100);
          return (
            <motion.div
              key={ach.id}
              variants={item}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                ach.unlocked
                  ? 'glass-card-hover border border-accent/15'
                  : 'bg-muted/20 border border-transparent'
              }`}
              whileHover={{ x: 2 }}
            >
              <motion.span
                className={`text-xl ${ach.unlocked ? '' : 'grayscale opacity-40'}`}
                animate={ach.unlocked ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
              >
                {ach.icon}
              </motion.span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${ach.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {ach.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{ach.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${ach.unlocked ? 'bg-gradient-to-r from-accent to-primary' : 'bg-muted-foreground/20'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      style={ach.unlocked ? { boxShadow: '0 0 8px hsl(140 70% 50% / 0.4)' } : {}}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">
                    {ach.progress}/{ach.maxProgress}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default AchievementsList;
