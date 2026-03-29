import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

interface RewardResult {
  baseXP: number;
  bonusXP: number;
  totalXP: number;
  isCriticalHit: boolean;
  mysteryBox: { type: string; amount: number; description: string; icon: string } | null;
  streakMultiplier: number;
  coinsEarned: number;
  leveledUp: boolean;
  newLevel?: number;
}

interface RewardPopupProps {
  reward: RewardResult | null;
  onClose: () => void;
}

const RewardPopup = ({ reward, onClose }: RewardPopupProps) => {
  if (!reward) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="glass-card rounded-3xl p-8 max-w-sm w-full mx-4 text-center "
          onClick={(e) => e.stopPropagation()}>
          
          {reward.isCriticalHit && (
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }} className="text-5xl mb-3">⚡</motion.div>
          )}

          {reward.leveledUp && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.1, duration: 0.6 }} className="mb-4">
              <p className="text-xs font-mono text-primary uppercase tracking-widest">Новый уровень!</p>
              <p className="text-5xl font-bold text-primary ">{reward.newLevel}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">Ты стал сильнее</p>
            </motion.div>
          )}

          {!reward.leveledUp && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-3xl font-bold text-accent  mb-1">+{reward.totalXP}</p>
              <p className="text-[10px] font-mono text-muted-foreground">опыт</p>
            </motion.div>
          )}

          {reward.isCriticalHit && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-sm font-semibold text-energy  mb-2 mt-2">
              🎯 Удачный момент! x2 опыта
            </motion.p>
          )}

          {reward.streakMultiplier > 1 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-xs font-mono text-streak">
              🔥 Непрерывный поток x{reward.streakMultiplier.toFixed(1)}
            </motion.p>
          )}

          {reward.mysteryBox && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="mt-4 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
              <span className="text-2xl">{reward.mysteryBox.icon}</span>
              <p className="text-sm font-semibold text-secondary mt-1">Бонус дня!</p>
              <p className="text-xs font-mono text-muted-foreground">+{reward.mysteryBox.amount} опыта</p>
            </motion.div>
          )}

          {reward.coinsEarned > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-xs font-mono text-energy mt-3">
              💰 +{reward.coinsEarned} нейрокоинов
            </motion.p>
          )}

          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            onClick={onClose}
            className="mt-6 px-6 py-2 rounded-xl bg-primary/20 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/30 transition-all">
            Принять
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RewardPopup;
