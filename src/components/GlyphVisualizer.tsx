import { useMemo } from "react";
import { motion } from "framer-motion";

interface GlyphProps {
  level: number;
  xp: number;
  xpToNext: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  balance: number; // 0-100, overall life balance
  missionsCompleted: number;
  dreamsLogged: number;
}

const GlyphVisualizer = ({ level, xp, xpToNext, energy, maxEnergy, streak, balance, missionsCompleted, dreamsLogged }: GlyphProps) => {
  const healthPercent = energy / maxEnergy;
  const xpPercent = xp / xpToNext;
  const isDecaying = healthPercent < 0.3;
  const isHealthy = healthPercent > 0.7 && streak > 2;

  // Glyph complexity grows with level
  const layers = useMemo(() => Math.min(level + 2, 8), [level]);
  const glyphColor = useMemo(() => {
    if (isDecaying) return { h: 0, s: 70, l: 55 }; // red - corrosion
    if (isHealthy) return { h: 180, s: 100, l: 50 }; // cyan - thriving
    return { h: 180 + balance * 0.6, s: 60 + healthPercent * 40, l: 45 + healthPercent * 10 };
  }, [isDecaying, isHealthy, balance, healthPercent]);

  const pulseIntensity = isDecaying ? 0.3 : 0.6 + streak * 0.05;
  const rotationSpeed = isDecaying ? 20 : 12 - Math.min(level, 8);
  const fragmentCount = isDecaying ? Math.floor((1 - healthPercent) * 6) : 0;

  // Generate sacred geometry vertices
  const generatePolygonPoints = (sides: number, radius: number, offset = 0) => {
    return Array.from({ length: sides }, (_, i) => {
      const angle = (2 * Math.PI * i) / sides + offset;
      return { x: 150 + radius * Math.cos(angle), y: 150 + radius * Math.sin(angle) };
    });
  };

  const toPathString = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  const glyphHSL = `hsl(${glyphColor.h}, ${glyphColor.s}%, ${glyphColor.l}%)`;
  const glyphHSLDim = `hsl(${glyphColor.h}, ${glyphColor.s}%, ${glyphColor.l * 0.5}%)`;

  return (
    <div className="glass-card rounded-2xl p-5 border border-primary/10 relative overflow-hidden">
      {/* Zeigarnik incompleteness indicator */}
      {xpPercent < 1 && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(220, 15%, 18%)" strokeWidth="2" />
              <motion.circle
                cx="18" cy="18" r="15" fill="none"
                stroke={glyphHSL}
                strokeWidth="2"
                strokeDasharray={`${xpPercent * 94.2} 94.2`}
                strokeLinecap="round"
                animate={{ strokeDasharray: [`${xpPercent * 94.2} 94.2`] }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono text-muted-foreground">
              {Math.round(xpPercent * 100)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>◈</span> Глиф
        </h3>
        <span className="text-[9px] font-mono text-muted-foreground">
          {isDecaying ? "⚠ коррозия" : isHealthy ? "✦ резонанс" : "◇ стабилен"}
        </span>
      </div>

      {/* Main Glyph SVG */}
      <div className="relative flex justify-center">
        <motion.svg
          viewBox="0 0 300 300"
          className="w-56 h-56"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: rotationSpeed * 3, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <radialGradient id="glyph-core-grad">
              <stop offset="0%" stopColor={glyphHSL} stopOpacity={0.4 * pulseIntensity} />
              <stop offset="50%" stopColor={glyphHSL} stopOpacity={0.1 * pulseIntensity} />
              <stop offset="100%" stopColor={glyphHSL} stopOpacity={0} />
            </radialGradient>
            <filter id="glyph-glow-filter">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glyph-fragment">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" />
              <feDisplacementMap in="SourceGraphic" scale={fragmentCount * 5} />
            </filter>
          </defs>

          {/* Core glow */}
          <motion.circle
            cx={150} cy={150} r={80}
            fill="url(#glyph-core-grad)"
            animate={{
              r: [75, 85, 75],
              opacity: [0.5, 0.8 * pulseIntensity, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Sacred geometry layers */}
          {Array.from({ length: layers }, (_, i) => {
            const sides = 3 + i;
            const radius = 30 + i * 12;
            const offset = (i * Math.PI) / layers;
            const opacity = 0.15 + (i / layers) * 0.35;
            const points = generatePolygonPoints(sides, radius, offset);

            return (
              <motion.path
                key={i}
                d={toPathString(points)}
                fill="none"
                stroke={i % 2 === 0 ? glyphHSL : glyphHSLDim}
                strokeWidth={1 + (layers - i) * 0.2}
                strokeOpacity={opacity * healthPercent}
                filter={isDecaying && i > layers - 3 ? "url(#glyph-fragment)" : "url(#glyph-glow-filter)"}
                animate={{
                  rotate: [0, i % 2 === 0 ? 360 : -360],
                  scale: [1, 1 + 0.02 * pulseIntensity, 1],
                }}
                transition={{
                  rotate: { duration: rotationSpeed + i * 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ transformOrigin: "150px 150px" }}
              />
            );
          })}

          {/* Energy ring */}
          <circle cx={150} cy={150} r={100} fill="none" stroke="hsl(220, 15%, 18%)" strokeWidth={3} />
          <motion.circle
            cx={150} cy={150} r={100}
            fill="none"
            stroke={glyphHSL}
            strokeWidth={3}
            strokeDasharray={`${healthPercent * 628} 628`}
            strokeLinecap="round"
            strokeOpacity={0.6}
            initial={{ strokeDasharray: "0 628" }}
            animate={{ strokeDasharray: `${healthPercent * 628} 628` }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "150px 150px" }}
          />

          {/* Streak markers */}
          {Array.from({ length: Math.min(streak, 7) }, (_, i) => {
            const angle = (2 * Math.PI * i) / 7 - Math.PI / 2;
            const cx = 150 + 110 * Math.cos(angle);
            const cy = 150 + 110 * Math.sin(angle);
            return (
              <motion.circle
                key={`streak-${i}`}
                cx={cx} cy={cy} r={3}
                fill={glyphHSL}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
              />
            );
          })}

          {/* Center core */}
          <motion.circle
            cx={150} cy={150}
            r={8 + level}
            fill={glyphHSL}
            fillOpacity={0.3 + healthPercent * 0.4}
            animate={{
              r: [8 + level, 12 + level, 8 + level],
              fillOpacity: [0.3 + healthPercent * 0.3, 0.5 + healthPercent * 0.4, 0.3 + healthPercent * 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Level number in center */}
          <text x={150} y={155} textAnchor="middle" fill={glyphHSL} fontSize="14" fontFamily="var(--font-mono)" fontWeight="bold">
            {level}
          </text>
        </motion.svg>

        {/* Decay warning overlay */}
        {isDecaying && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <p className="text-xs font-mono text-destructive bg-background/80 px-3 py-1 rounded-lg border border-destructive/30">
              ⚠ Глиф деградирует
            </p>
          </motion.div>
        )}
      </div>

      {/* Status bar */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-muted/20">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Энергия</p>
          <p className="text-sm font-bold font-mono" style={{ color: glyphHSL }}>{energy}/{maxEnergy}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Поток</p>
          <p className="text-sm font-bold font-mono" style={{ color: glyphHSL }}>{streak}д</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Баланс</p>
          <p className="text-sm font-bold font-mono" style={{ color: glyphHSL }}>{balance}%</p>
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground/40 font-mono text-center mt-2">
        {isDecaying
          ? "выполни протокол, чтобы остановить коррозию"
          : isHealthy
          ? "глиф в резонансе — продолжай"
          : "логируй активность, чтобы усилить глиф"}
      </p>
    </div>
  );
};

export default GlyphVisualizer;
