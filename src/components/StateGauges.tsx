import { motion } from "framer-motion";

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  color: string;
  size?: number;
}

const CircularGauge = ({ value, max, label, color, size = 80 }: GaugeProps) => {
  const stroke = 5;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold font-mono text-foreground">
            {Math.round(percent * 100)}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

interface StateGaugesProps {
  energy: number;
  maxEnergy: number;
  moodAvg: number; // 0-5
  stagnation: number; // 0-100
}

const StateGauges = ({ energy, maxEnergy, moodAvg, stagnation }: StateGaugesProps) => {
  // Recovery = inverse of stagnation
  const recovery = Math.max(0, 100 - stagnation);

  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-4">
        Текущее состояние
      </p>
      <div className="flex justify-around">
        <CircularGauge
          value={recovery} max={100}
          label="Recovery"
          color="hsl(var(--recovery))"
        />
        <CircularGauge
          value={energy} max={maxEnergy}
          label="Энергия"
          color="hsl(var(--strain))"
        />
        <CircularGauge
          value={moodAvg} max={5}
          label="Настрой"
          color="hsl(var(--sleep))"
        />
      </div>
    </div>
  );
};

export default StateGauges;
