import { motion } from "framer-motion";

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  displayName?: string;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Новичок",
  2: "Исследователь",
  3: "Практик",
  4: "Стратег",
  5: "Наставник",
  6: "Архитектор",
  7: "Мастер",
  8: "Эксперт",
  9: "Гуру",
  10: "Легенда",
};

const LEVEL_UNLOCKS: Record<number, string> = {
  2: "Редактирование привычек",
  3: "Дневник снов",
  4: "AI-инсайты",
  5: "Новый элемент глифа",
  6: "Племена",
  7: "Еженедельные отчёты",
  8: "Бонусные награды",
  9: "Расширенная аналитика",
  10: "Статус Легенды",
};

const XPBar = ({ current, max, level, displayName }: XPBarProps) => {
  const percentage = Math.min((current / max) * 100, 100);
  const title = LEVEL_TITLES[level] || LEVEL_TITLES[10];
  const nextUnlock = LEVEL_UNLOCKS[level + 1];

  // Circular ring params
  const size = 64;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center gap-4">
        {/* WHOOP-style circular level ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-foreground font-bold text-lg font-mono">{level}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground truncate">{displayName || 'Пользователь'}</p>
              <p className="text-xs text-primary font-medium">{title}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-foreground font-bold">
                {current}<span className="text-muted-foreground">/{max}</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">XP</p>
            </div>
          </div>

          {/* Thin progress bar */}
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mt-3">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>

      {nextUnlock && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-3 text-[10px] text-muted-foreground font-mono"
        >
          Уровень {level + 1} → {nextUnlock}
        </motion.p>
      )}
    </motion.div>
  );
};

export default XPBar;
