import { motion } from "framer-motion";
import { Swords, TrendingUp } from "lucide-react";

interface PhantomCompetitorProps {
  userCompletedToday: number;
  userTotalCompleted: number;
  userStreak: number;
  totalMissions: number;
}

const PhantomCompetitor = ({ userCompletedToday, userTotalCompleted, userStreak, totalMissions }: PhantomCompetitorProps) => {
  // Phantom is always ~5% ahead based on user's real stats
  const phantomTotalCompleted = Math.ceil(userTotalCompleted * 1.05) + 3;
  const phantomStreak = Math.max(userStreak + 1, Math.ceil(userStreak * 1.05));
  
  // Phantom's daily progress — slightly ahead
  const phantomCompletedToday = Math.min(
    Math.ceil(userCompletedToday * 1.05) + (userCompletedToday === 0 ? 1 : 0),
    totalMissions
  );

  const userProgress = totalMissions > 0 ? (userCompletedToday / totalMissions) * 100 : 0;
  const phantomProgress = totalMissions > 0 ? (phantomCompletedToday / totalMissions) * 100 : 15;

  // Determine status
  const isAhead = userCompletedToday >= phantomCompletedToday;
  const isTied = userCompletedToday === phantomCompletedToday && userCompletedToday > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 border border-border/30 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-destructive" />
          <h3 className="text-xs font-semibold text-foreground">Ближайший Конкурент</h3>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">
          {isAhead ? "Ты впереди! 🔥" : isTied ? "Ничья ⚔️" : "Догоняй! 💨"}
        </span>
      </div>

      {/* Race visualization */}
      <div className="space-y-2">
        {/* User bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-foreground">Ты</span>
            <span className="text-[10px] font-mono text-primary">{userCompletedToday}/{totalMissions}</span>
          </div>
          <div className="h-2.5 bg-muted/20 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${userProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        {/* Phantom bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              🎯 Конкурент
            </span>
            <span className="text-[10px] font-mono text-destructive/70">{phantomCompletedToday}/{totalMissions}</span>
          </div>
          <div className="h-2.5 bg-muted/20 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${phantomProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full bg-gradient-to-r from-destructive/60 to-destructive/40 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Stats comparison */}
      <div className="flex gap-3 pt-1">
        <div className="flex-1 rounded-lg bg-muted/10 p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Серия</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-foreground">{userStreak}д</span>
            <span className="text-[9px] text-muted-foreground/50">vs</span>
            <span className="text-xs font-bold text-destructive/60">{phantomStreak}д</span>
          </div>
        </div>
        <div className="flex-1 rounded-lg bg-muted/10 p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Всего</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-foreground">{userTotalCompleted}</span>
            <span className="text-[9px] text-muted-foreground/50">vs</span>
            <span className="text-xs font-bold text-destructive/60">{phantomTotalCompleted}</span>
          </div>
        </div>
        {isAhead && (
          <div className="flex-1 rounded-lg bg-accent/10 p-2 text-center">
            <p className="text-[9px] text-accent">Обгон!</p>
            <TrendingUp className="w-4 h-4 text-accent mx-auto mt-0.5" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PhantomCompetitor;
