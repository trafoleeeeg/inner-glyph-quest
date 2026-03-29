import { useState, useEffect } from "react";
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
  flow: { label: 'Поток', color: 'hsl(var(--strain))' },
  stable: { label: 'Стабильность', color: 'hsl(var(--foreground))' },
  starvation: { label: 'Голодание', color: 'hsl(var(--recovery))' },
  overload: { label: 'Перегрузка', color: 'hsl(var(--destructive))' },
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

  // Apple Watch style — nested rings
  const size = 120;
  const stroke = 8;
  const r1 = (size - stroke) / 2;
  const c1 = 2 * Math.PI * r1;
  const o1 = c1 - (integrity / 100) * c1;
  const r2 = r1 - 12;
  const c2 = 2 * Math.PI * r2;
  const o2 = c2 - healthPercent * c2;

  return (
    <div className="py-4 border-b border-border">
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={r1}
              fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
            <motion.circle cx={size/2} cy={size/2} r={r1}
              fill="none" stroke={config.color} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={c1}
              initial={{ strokeDashoffset: c1 }}
              animate={{ strokeDashoffset: o1 }}
              transition={{ duration: 1.2, ease: "easeOut" }} />
            <circle cx={size/2} cy={size/2} r={r2}
              fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
            <motion.circle cx={size/2} cy={size/2} r={r2}
              fill="none" stroke="hsl(var(--sleep))" strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={c2}
              initial={{ strokeDashoffset: c2 }}
              animate={{ strokeDashoffset: o2 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-mono text-foreground">{Math.round(integrity)}</span>
            <span className="text-[8px] text-muted-foreground font-mono">%</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Фаза</p>
            <p className="text-sm font-semibold text-foreground">{config.label}</p>
          </div>

          {stagnation && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <Stat label="Стагнация" value={Math.round(stagnation.stagnation_index)} />
              <Stat label="Провалы" value={`${Math.round(stagnation.failure_rate)}%`} />
              <Stat label="За неделю" value={stagnation.completions_week} />
              <Stat label="Простой" value={`${stagnation.idle_days}д`} />
            </div>
          )}
        </div>
      </div>

      {streak > 0 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground font-mono">Серия</span>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(streak, 7) }, (_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground" />
            ))}
            {streak > 7 && <span className="text-[10px] text-foreground font-mono ml-1">+{streak - 7}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <p className="text-[9px] text-muted-foreground font-mono">{label}</p>
    <p className="text-sm font-bold font-mono text-foreground">{value}</p>
  </div>
);

export default GlyphVisualizer;
