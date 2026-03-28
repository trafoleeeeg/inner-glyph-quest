import { motion } from "framer-motion";
import { Users } from "lucide-react";

// Simple bar chart showing community engagement tiers
const TIERS = [
  { label: "Новички", count: 124, color: "bg-blue-500", percent: 45 },
  { label: "Активные", count: 87, color: "bg-yellow-500", percent: 72 },
  { label: "Лидеры", count: 34, color: "bg-green-500", percent: 93 },
];

const CommunityPulse = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/30"
    >
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Users className="w-4 h-4 text-accent" />
        Активность сообщества
      </h3>
      <p className="text-[10px] text-muted-foreground mb-4">
        Сколько людей активно выполняют цели вместе с тобой
      </p>

      <div className="space-y-3">
        {TIERS.map((tier, i) => (
          <motion.div key={tier.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-foreground/80">{tier.label}</span>
              <span className="text-muted-foreground font-mono">{tier.count} чел · {tier.percent}% активных</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${tier.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${tier.percent}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[9px] text-muted-foreground/60 text-center mt-4 font-mono">
        Чем активнее участники — тем сильнее становится каждое племя
      </p>
    </motion.div>
  );
};

export default CommunityPulse;