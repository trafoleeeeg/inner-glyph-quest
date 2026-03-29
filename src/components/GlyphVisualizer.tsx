import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StagnationData {
  stagnation_index: number;
  glyph_integrity: number;
  phase: 'flow' | 'stable' | 'starvation' | 'overload';
  completions_today: number;
  completions_week: number;
  active_missions: number;
  idle_days: number;
  failure_rate: number;
  compression_speed: number;
}

interface GlyphVisualizerProps {
  level: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  onStagnationUpdate?: (data: StagnationData) => void;
}

const phaseConfig = {
  flow: { label: 'Поток', color: 'hsl(var(--primary))', accent: 'primary' },
  stable: { label: 'Стабильность', color: 'hsl(var(--secondary))', accent: 'secondary' },
  starvation: { label: 'Голодание', color: 'hsl(var(--energy))', accent: 'energy' },
  overload: { label: 'Перегрузка', color: 'hsl(var(--destructive))', accent: 'destructive' },
};

const GlyphVisualizer = ({ level, energy, maxEnergy, streak, onStagnationUpdate }: GlyphVisualizerProps) => {
  const { user } = useAuth();
  const [stagnation, setStagnation] = useState<StagnationData | null>(null);

  useEffect(() => {
    if (!user) return;
    const calc = async () => {
      const { data } = await supabase.rpc('calculate_stagnation_index', { p_user_id: user.id });
      if (data && !(data as any).error) {
        const d = data as unknown as StagnationData;
        setStagnation(d);
        onStagnationUpdate?.(d);
      }
    };
    calc();
  }, [user]);

  const integrity = stagnation?.glyph_integrity ?? 100;
  const phase = stagnation?.phase ?? 'stable';
  const config = phaseConfig[phase];
  const healthPercent = energy / maxEnergy;

  // WHOOP-style circular ring
  const size = 140;
  const stroke = 6;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const integrityOffset = circumference - (integrity / 100) * circumference;
  const energyRadius = radius - 14;
  const energyCircumference = 2 * Math.PI * energyRadius;
  const energyOffset = energyCircumference - healthPercent * energyCircumference;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-5">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* Integrity ring (outer) */}
            <circle cx={size/2} cy={size/2} r={radius}
              fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
            <motion.circle cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={config.color} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: integrityOffset }}
              transition={{ duration: 1.2, ease: "easeOut" }} />

            {/* Energy ring (inner) */}
            <circle cx={size/2} cy={size/2} r={energyRadius}
              fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
            <motion.circle cx={size/2} cy={size/2} r={energyRadius}
              fill="none" stroke="hsl(var(--energy))" strokeWidth={4}
              strokeLinecap="round" strokeDasharray={energyCircumference}
              initial={{ strokeDashoffset: energyCircumference }}
              animate={{ strokeDashoffset: energyOffset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-mono text-foreground">{Math.round(integrity)}</span>
            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">%</span>
          </div>
        </div>

        {/* Data */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Состояние</p>
            <p className={`text-sm font-semibold text-${config.accent}`}>{config.label}</p>
          </div>

          {stagnation && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">Стагнация</p>
                <p className="text-sm font-bold font-mono text-foreground">{Math.round(stagnation.stagnation_index)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">Провалы</p>
                <p className="text-sm font-bold font-mono text-foreground">{Math.round(stagnation.failure_rate)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">За неделю</p>
                <p className="text-sm font-bold font-mono text-foreground">{stagnation.completions_week}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">Простой</p>
                <p className="text-sm font-bold font-mono text-foreground">{stagnation.idle_days}д</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Streak indicators */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground font-mono">Серия:</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(streak, 7) }, (_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary" />
            ))}
            {streak > 7 && <span className="text-[10px] text-primary font-mono">+{streak - 7}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlyphVisualizer;
