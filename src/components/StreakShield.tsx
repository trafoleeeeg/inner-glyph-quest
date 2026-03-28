import { motion, AnimatePresence } from "framer-motion";
import { Shield, Flame, Coins } from "lucide-react";

interface StreakShieldProps {
  open: boolean;
  streak: number;
  longestStreak: number;
  coins: number;
  onProtect: () => void;
  onDismiss: () => void;
}

const SHIELD_COST = 50;

const StreakShield = ({ open, streak, longestStreak, coins, onProtect, onDismiss }: StreakShieldProps) => {
  const canAfford = coins >= SHIELD_COST;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg"
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="w-full max-w-sm mx-4 glass-card rounded-2xl p-6 border border-destructive/20 text-center space-y-4"
          >
            {/* Warning icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <Flame className="w-8 h-8 text-destructive" />
            </motion.div>

            <h3 className="text-lg font-bold text-foreground">
              Серия под угрозой!
            </h3>
            <p className="text-sm text-muted-foreground">
              Ты не выполнил ни одной привычки вчера. Твоя серия из{" "}
              <span className="text-foreground font-semibold">{streak} дней</span> может
              обнулиться.
            </p>

            {/* Record info */}
            {longestStreak > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>🏆 Рекорд: {longestStreak} дней</span>
                {streak > 0 && streak >= longestStreak - 2 && (
                  <span className="text-primary">Почти рекорд!</span>
                )}
              </div>
            )}

            {/* Shield option */}
            <div className="space-y-2 pt-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onProtect}
                disabled={!canAfford}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  canAfford
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "bg-muted/20 text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Shield className="w-4 h-4" />
                Защитить серию
                <span className="flex items-center gap-1 text-xs opacity-70">
                  <Coins className="w-3 h-3" /> {SHIELD_COST}
                </span>
              </motion.button>

              {!canAfford && (
                <p className="text-[10px] text-muted-foreground">
                  Нужно {SHIELD_COST} монет (у тебя {coins})
                </p>
              )}

              <button
                onClick={onDismiss}
                className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Пропустить — серия обнулится
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { SHIELD_COST };
export default StreakShield;
