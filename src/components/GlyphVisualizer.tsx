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
  flow: { label: 'Когнитивный поток', color: 'hsl(160, 60%, 45%)', emoji: '◈', hint: 'FBT-резонанс — оптимальный баланс сложности и сжатия' },
  stable: { label: 'Стабильное состояние', color: 'hsl(200, 50%, 50%)', emoji: '◇', hint: 'Паттерны устойчивы — скоро потребуется новый вектор хаоса' },
  starvation: { label: 'Голодание', color: 'hsl(35, 70%, 50%)', emoji: '⚠', hint: 'Интерпретатор голодает — нужны высокоэнтропийные задачи' },
  overload: { label: 'Комбинаторный перегруз', color: 'hsl(0, 55%, 50%)', emoji: '◆', hint: 'Мембрана разорвана — переход на микро-шаги для восстановления' },
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
  const integrityNorm = integrity / 100;

  const layers = useMemo(() => Math.min(level + 2, 8), [level]);

  const glyphColor = useMemo(() => {
    const hue = phase === 'flow' ? 160 : phase === 'stable' ? 200 : phase === 'starvation' ? 35 : 0;
    const sat = 30 + integrityNorm * 35;
    const light = 30 + integrityNorm * 20;
    return { h: hue, s: sat, l: light };
  }, [phase, integrityNorm]);

  const glyphHSL = `hsl(${glyphColor.h}, ${glyphColor.s}%, ${glyphColor.l}%)`;
  const glyphDim = `hsl(${glyphColor.h}, ${glyphColor.s}%, ${glyphColor.l * 0.5}%)`;

  // Noise/distortion when integrity is low
  const noiseLevel = Math.max(0, 1 - integrityNorm);
  const pulseSpeed = phase === 'overload' ? 1.5 : phase === 'starvation' ? 2.5 : 3.5;
  const rotationSpeed = phase === 'overload' ? 25 : 14 - Math.min(level, 8);

  const generatePolygonPoints = (sides: number, radius: number, offset = 0) =>
    Array.from({ length: sides }, (_, i) => {
      const angle = (2 * Math.PI * i) / sides + offset;
      // Add noise-based jitter when integrity is low
      const jitter = noiseLevel * (Math.sin(i * 7.3) * 8);
      return { x: 150 + (radius + jitter) * Math.cos(angle), y: 150 + (radius + jitter) * Math.sin(angle) };
    });

  const toPathString = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="glass-card rounded-2xl p-4 border border-border/30 relative overflow-hidden">
      {/* Phase indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{config.emoji}</span>
          <div>
            <h3 className="text-xs font-semibold text-foreground">Глиф</h3>
            <p className="text-[9px] font-mono" style={{ color: config.color }}>{config.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono font-bold" style={{ color: config.color }}>
            {Math.round(integrity)}%
          </p>
          <p className="text-[8px] text-muted-foreground font-mono">целостность</p>
        </div>
      </div>

      {/* SVG Glyph */}
      <div className="relative flex justify-center">
        <motion.svg viewBox="0 0 300 300" className="w-40 h-40"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: rotationSpeed * 3, repeat: Infinity, ease: "linear" }}>
          <defs>
            <radialGradient id="glyph-core">
              <stop offset="0%" stopColor={glyphHSL} stopOpacity={0.3 * integrityNorm} />
              <stop offset="100%" stopColor={glyphHSL} stopOpacity={0} />
            </radialGradient>
            <filter id="glyph-noise">
              <feTurbulence type="fractalNoise" baseFrequency={0.02 + noiseLevel * 0.08} numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={noiseLevel * 15} />
            </filter>
            <filter id="glyph-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Core pulse */}
          <motion.circle cx={150} cy={150} r={70} fill="url(#glyph-core)"
            animate={{ r: [65, 75, 65], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }} />

          {/* Polygon layers with noise filter when degraded */}
          <g filter={noiseLevel > 0.3 ? "url(#glyph-noise)" : undefined}>
            {Array.from({ length: layers }, (_, i) => {
              const sides = 3 + i;
              const radius = 25 + i * 11;
              const offset = (i * Math.PI) / layers;
              const opacity = (0.15 + (i / layers) * 0.3) * integrityNorm;
              const points = generatePolygonPoints(sides, radius, offset);
              return (
                <motion.path key={i} d={toPathString(points)} fill="none"
                  stroke={i % 2 === 0 ? glyphHSL : glyphDim}
                  strokeWidth={1 + (layers - i) * 0.12}
                  strokeOpacity={opacity}
                  filter="url(#glyph-glow)"
                  animate={{ 
                    rotate: [0, i % 2 === 0 ? 360 : -360],
                    scale: [1, 1 + 0.01 * integrityNorm, 1]
                  }}
                  transition={{
                    rotate: { duration: rotationSpeed + i * 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: pulseSpeed + i * 0.3, repeat: Infinity, ease: "easeInOut" },
                  }}
                  style={{ transformOrigin: "150px 150px" }} />
              );
            })}
          </g>

          {/* Energy ring */}
          <circle cx={150} cy={150} r={90} fill="none" stroke="hsl(220, 12%, 17%)" strokeWidth={2} />
          <motion.circle cx={150} cy={150} r={90} fill="none" stroke={glyphHSL}
            strokeWidth={2} strokeDasharray={`${healthPercent * 565} 565`}
            strokeLinecap="round" strokeOpacity={0.5}
            animate={{ strokeDasharray: `${healthPercent * 565} 565` }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "150px 150px" }} />

          {/* Streak nodes */}
          {Array.from({ length: Math.min(streak, 7) }, (_, i) => {
            const angle = (2 * Math.PI * i) / 7 - Math.PI / 2;
            return (
              <motion.circle key={`s-${i}`}
                cx={150 + 100 * Math.cos(angle)} cy={150 + 100 * Math.sin(angle)} r={2.5}
                fill={glyphHSL}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }} />
            );
          })}

          {/* Center core */}
          <motion.circle cx={150} cy={150} r={6 + level * 0.5} fill={glyphHSL}
            fillOpacity={0.2 + integrityNorm * 0.3}
            animate={{ r: [6 + level * 0.5, 9 + level * 0.5, 6 + level * 0.5] }}
            transition={{ duration: pulseSpeed, repeat: Infinity, ease: "easeInOut" }} />
          <text x={150} y={154} textAnchor="middle" fill={glyphHSL} fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">
            {level}
          </text>
        </motion.svg>

        {/* Warning overlay when degraded */}
        {integrity < 30 && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <p className="text-[10px] font-mono text-destructive bg-background/80 px-2 py-1 rounded-lg border border-destructive/20">
              структура распадается
            </p>
          </motion.div>
        )}
      </div>

      {/* Phase hint */}
      <p className="text-[9px] text-muted-foreground/60 text-center mt-2 font-mono leading-relaxed">
        {config.hint}
      </p>

      {/* Stagnation metrics */}
      {stagnation && (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          <div className="p-1.5 rounded-lg bg-muted/20 text-center">
            <p className="text-[8px] font-mono text-muted-foreground">Стагнация</p>
            <p className="text-xs font-bold font-mono" style={{ color: config.color }}>
              {Math.round(stagnation.stagnation_index)}
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-muted/20 text-center">
            <p className="text-[8px] font-mono text-muted-foreground">Провалы</p>
            <p className="text-xs font-bold font-mono text-foreground">
              {Math.round(stagnation.failure_rate)}%
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-muted/20 text-center">
            <p className="text-[8px] font-mono text-muted-foreground">Простой</p>
            <p className="text-xs font-bold font-mono text-foreground">
              {stagnation.idle_days}д
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlyphVisualizer;
