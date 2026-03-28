import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";

interface GlyphProps {
  level: number;
  xp: number;
  xpToNext: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  balance: number;
  missionsCompleted: number;
  dreamsLogged: number;
}

const GlyphVisualizer = ({ level, xp, xpToNext, energy, maxEnergy, streak, balance, missionsCompleted, dreamsLogged }: GlyphProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const healthPercent = energy / maxEnergy;
  const xpPercent = xp / xpToNext;
  const isLow = healthPercent < 0.3;
  const isStrong = healthPercent > 0.7 && streak > 2;

  const layers = useMemo(() => Math.min(level + 2, 8), [level]);
  const glyphColor = useMemo(() => {
    if (isLow) return { h: 0, s: 50, l: 50 };
    if (isStrong) return { h: 200, s: 60, l: 50 };
    return { h: 200 + balance * 0.4, s: 40 + healthPercent * 30, l: 42 + healthPercent * 10 };
  }, [isLow, isStrong, balance, healthPercent]);

  const pulseIntensity = isLow ? 0.3 : 0.5 + streak * 0.04;
  const rotationSpeed = isLow ? 20 : 14 - Math.min(level, 8);

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
    <div className="glass-card rounded-2xl p-5 border border-border/30 relative overflow-hidden">
      {/* XP ring */}
      {xpPercent < 1 && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(222, 12%, 17%)" strokeWidth="2" />
              <motion.circle cx="18" cy="18" r="15" fill="none" stroke={glyphHSL} strokeWidth="2"
                strokeDasharray={`${xpPercent * 94.2} 94.2`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono text-muted-foreground">
              {Math.round(xpPercent * 100)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>◈</span> Мой Глиф
        </h3>
        <button onClick={() => setShowInfo(!showInfo)} className="text-muted-foreground/50 hover:text-primary transition-colors">
          <Info className="w-3.5 h-3.5" />
        </button>
        <span className="text-[9px] font-mono text-muted-foreground ml-auto">
          {isLow ? "⚠ нужна подзарядка" : isStrong ? "✦ отличная форма" : "◇ в норме"}
        </span>
      </div>

      {/* Info tooltip */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/10 relative">
            <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-muted-foreground/30 hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
            <p className="text-xs text-foreground/80 leading-relaxed mb-2">
              <strong>Глиф</strong> — это живая геометрическая фигура, которая отражает твоё текущее состояние.
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              <li>◈ Чем больше привычек выполняешь — тем сложнее и красивее фигура</li>
              <li>🔵 Кольцо вокруг — уровень энергии. Чем полнее, тем лучше</li>
              <li>✦ Точки по кругу — твоя серия дней подряд</li>
              <li>⚠ Если забросить привычки — глиф тускнеет и упрощается</li>
            </ul>
            <p className="text-[10px] text-primary/60 mt-2 font-mono">
              Цель: поддерживать глиф ярким и сложным через ежедневную активность
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Glyph SVG */}
      <div className="relative flex justify-center">
        <motion.svg viewBox="0 0 300 300" className="w-52 h-52"
          animate={{ rotate: [0, 360] }} transition={{ duration: rotationSpeed * 3, repeat: Infinity, ease: "linear" }}>
          <defs>
            <radialGradient id="glyph-core-grad">
              <stop offset="0%" stopColor={glyphHSL} stopOpacity={0.3 * pulseIntensity} />
              <stop offset="50%" stopColor={glyphHSL} stopOpacity={0.08 * pulseIntensity} />
              <stop offset="100%" stopColor={glyphHSL} stopOpacity={0} />
            </radialGradient>
            <filter id="glyph-glow-filter">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Core glow */}
          <motion.circle cx={150} cy={150} r={80} fill="url(#glyph-core-grad)"
            animate={{ r: [75, 82, 75], opacity: [0.4, 0.6 * pulseIntensity, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />

          {/* Geometry layers */}
          {Array.from({ length: layers }, (_, i) => {
            const sides = 3 + i;
            const radius = 30 + i * 12;
            const offset = (i * Math.PI) / layers;
            const opacity = 0.12 + (i / layers) * 0.28;
            const points = generatePolygonPoints(sides, radius, offset);
            return (
              <motion.path key={i} d={toPathString(points)} fill="none"
                stroke={i % 2 === 0 ? glyphHSL : glyphHSLDim}
                strokeWidth={1 + (layers - i) * 0.15}
                strokeOpacity={opacity * healthPercent}
                filter="url(#glyph-glow-filter)"
                animate={{ rotate: [0, i % 2 === 0 ? 360 : -360], scale: [1, 1 + 0.015 * pulseIntensity, 1] }}
                transition={{
                  rotate: { duration: rotationSpeed + i * 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2.5 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ transformOrigin: "150px 150px" }} />
            );
          })}

          {/* Energy ring */}
          <circle cx={150} cy={150} r={100} fill="none" stroke="hsl(222, 12%, 17%)" strokeWidth={2.5} />
          <motion.circle cx={150} cy={150} r={100} fill="none" stroke={glyphHSL}
            strokeWidth={2.5} strokeDasharray={`${healthPercent * 628} 628`}
            strokeLinecap="round" strokeOpacity={0.5}
            initial={{ strokeDasharray: "0 628" }}
            animate={{ strokeDasharray: `${healthPercent * 628} 628` }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "150px 150px" }} />

          {/* Streak dots */}
          {Array.from({ length: Math.min(streak, 7) }, (_, i) => {
            const angle = (2 * Math.PI * i) / 7 - Math.PI / 2;
            return (
              <motion.circle key={`s-${i}`}
                cx={150 + 110 * Math.cos(angle)} cy={150 + 110 * Math.sin(angle)} r={2.5}
                fill={glyphHSL} animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }} />
            );
          })}

          {/* Center */}
          <motion.circle cx={150} cy={150} r={7 + level} fill={glyphHSL}
            fillOpacity={0.2 + healthPercent * 0.3}
            animate={{ r: [7 + level, 10 + level, 7 + level] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
          <text x={150} y={155} textAnchor="middle" fill={glyphHSL} fontSize="13" fontFamily="var(--font-mono)" fontWeight="bold">
            {level}
          </text>
        </motion.svg>

        {isLow && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
            <p className="text-xs font-mono text-destructive bg-background/80 px-3 py-1 rounded-lg border border-destructive/20">
              ⚠ Глиф тускнеет — выполни привычку
            </p>
          </motion.div>
        )}
      </div>

      {/* Status */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-muted/20">
          <p className="text-[9px] font-mono text-muted-foreground">Энергия</p>
          <p className="text-sm font-bold font-mono" style={{ color: glyphHSL }}>{energy}/{maxEnergy}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20">
          <p className="text-[9px] font-mono text-muted-foreground">Серия</p>
          <p className="text-sm font-bold font-mono" style={{ color: glyphHSL }}>{streak}д</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20">
          <p className="text-[9px] font-mono text-muted-foreground">Баланс</p>
          <p className="text-sm font-bold font-mono" style={{ color: glyphHSL }}>{balance}%</p>
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground/40 font-mono text-center mt-2">
        {isLow ? "выполняй привычки, чтобы восстановить глиф"
          : isStrong ? "глиф в отличной форме — так держать!"
          : "записывай активности, чтобы усилить глиф"}
      </p>
    </div>
  );
};

export default GlyphVisualizer;
