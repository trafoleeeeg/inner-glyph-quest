import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ZoneData {
  id: string;
  label: string;
  emoji: string;
  color: string;
  glowColor: string;
  count: number;
  maxForClear: number;
}

const HEX_ZONES: Omit<ZoneData, "count">[] = [
  { id: "mood", label: "Настроение", emoji: "📡", color: "hsl(180, 100%, 50%)", glowColor: "hsl(180, 100%, 50%)", maxForClear: 14 },
  { id: "missions", label: "Привычки", emoji: "⚡", color: "hsl(140, 70%, 50%)", glowColor: "hsl(140, 70%, 50%)", maxForClear: 20 },
  { id: "dreams", label: "Сны", emoji: "🌙", color: "hsl(270, 80%, 65%)", glowColor: "hsl(270, 80%, 65%)", maxForClear: 7 },
  { id: "desires", label: "Цели", emoji: "✨", color: "hsl(45, 100%, 55%)", glowColor: "hsl(45, 100%, 55%)", maxForClear: 5 },
  { id: "health", label: "Здоровье", emoji: "🧘", color: "hsl(25, 95%, 55%)", glowColor: "hsl(25, 95%, 55%)", maxForClear: 14 },
  { id: "social", label: "Общение", emoji: "👥", color: "hsl(260, 80%, 60%)", glowColor: "hsl(260, 80%, 60%)", maxForClear: 10 },
];

const HEX_POSITIONS = [
  { x: 200, y: 180 },
  { x: 200, y: 60 },
  { x: 320, y: 120 },
  { x: 320, y: 240 },
  { x: 200, y: 300 },
  { x: 80, y: 240 },
  { x: 80, y: 120 },
];

const hexPoints = (cx: number, cy: number, r: number) => {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
};

const FogOfWarMap = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const weekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const [moods, completions, dreams, desires, posts] = await Promise.all([
        supabase.from("mood_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo),
        supabase.from("mission_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("completed_at", weekAgo),
        supabase.from("dream_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo),
        supabase.from("desires").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo),
      ]);

      const { count: healthCount } = await supabase.from("missions").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("category", "health");

      const counts: Record<string, number> = {
        mood: moods.count || 0,
        missions: completions.count || 0,
        dreams: dreams.count || 0,
        desires: desires.count || 0,
        health: healthCount || 0,
        social: posts.count || 0,
      };

      setZones(HEX_ZONES.map(z => ({ ...z, count: counts[z.id] || 0 })));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const totalClarity = useMemo(() => {
    if (zones.length === 0) return 0;
    const sum = zones.reduce((acc, z) => acc + Math.min(z.count / z.maxForClear, 1), 0);
    return Math.round((sum / zones.length) * 100);
  }, [zones]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-primary/10">
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const selected = zones.find(z => z.id === selectedZone);

  return (
    <div className="glass-card rounded-2xl p-5 border border-primary/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>🗺️</span> Карта осознанности
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            отмечай → открывай зоны → видь прогресс
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold font-mono text-primary">{totalClarity}%</p>
          <p className="text-[9px] text-muted-foreground font-mono">ясность</p>
        </div>
      </div>

      <div className="relative">
        <svg viewBox="0 0 400 370" className="w-full max-w-md mx-auto">
          <defs>
            {zones.map(z => {
              const clarity = Math.min(z.count / z.maxForClear, 1);
              return (
                <radialGradient key={`grad-${z.id}`} id={`grad-${z.id}`}>
                  <stop offset="0%" stopColor={z.color} stopOpacity={0.15 + clarity * 0.4} />
                  <stop offset="100%" stopColor={z.color} stopOpacity={0.03 + clarity * 0.15} />
                </radialGradient>
              );
            })}
            <filter id="fog-blur"><feGaussianBlur stdDeviation="3" /></filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {zones.map((_, i) => {
            const pos = HEX_POSITIONS[i + 1];
            const center = HEX_POSITIONS[0];
            const clarity = zones[i] ? Math.min(zones[i].count / zones[i].maxForClear, 1) : 0;
            return (
              <motion.line key={`line-${i}`} x1={center.x} y1={center.y} x2={pos.x} y2={pos.y}
                stroke={zones[i]?.color || "hsl(180,100%,50%)"} strokeOpacity={0.05 + clarity * 0.2}
                strokeWidth={1} strokeDasharray="4 4"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.1 }} />
            );
          })}

          <motion.polygon points={hexPoints(HEX_POSITIONS[0].x, HEX_POSITIONS[0].y, 48)}
            fill="url(#grad-mood)" stroke="hsl(180, 100%, 50%)" strokeWidth={1.5} strokeOpacity={0.3}
            filter="url(#glow)" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }} style={{ transformOrigin: `${HEX_POSITIONS[0].x}px ${HEX_POSITIONS[0].y}px` }} />
          <text x={HEX_POSITIONS[0].x} y={HEX_POSITIONS[0].y - 8} textAnchor="middle" fontSize="22">🧠</text>
          <text x={HEX_POSITIONS[0].x} y={HEX_POSITIONS[0].y + 16} textAnchor="middle" fill="hsl(180, 100%, 50%)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">
            {totalClarity}%
          </text>

          {zones.map((zone, i) => {
            const pos = HEX_POSITIONS[i + 1];
            const clarity = Math.min(zone.count / zone.maxForClear, 1);
            const fogOpacity = 1 - clarity;
            const isSelected = selectedZone === zone.id;
            const hexR = isSelected ? 50 : 45;
            return (
              <g key={zone.id} onClick={() => setSelectedZone(isSelected ? null : zone.id)} className="cursor-pointer">
                <motion.polygon points={hexPoints(pos.x, pos.y, hexR)} fill={`url(#grad-${zone.id})`}
                  stroke={zone.color} strokeWidth={isSelected ? 2 : 1} strokeOpacity={0.15 + clarity * 0.5}
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }} />
                {fogOpacity > 0.05 && (
                  <motion.polygon points={hexPoints(pos.x, pos.y, hexR - 1)} fill="hsl(220, 20%, 6%)"
                    fillOpacity={fogOpacity * 0.75} filter="url(#fog-blur)"
                    initial={{ fillOpacity: 0.9 }} animate={{ fillOpacity: fogOpacity * 0.75 }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }} style={{ pointerEvents: "none" }} />
                )}
                {clarity > 0.5 && (
                  <motion.circle cx={pos.x + 15} cy={pos.y - 10} r={2} fill={zone.color} opacity={0.4}
                    animate={{ y: [0, -8, 0], opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2 + i * 0.3, repeat: Infinity }} />
                )}
                <text x={pos.x} y={pos.y - 5} textAnchor="middle" fontSize="18" style={{ pointerEvents: "none" }}>{zone.emoji}</text>
                <text x={pos.x} y={pos.y + 15} textAnchor="middle" fill={zone.color} fontSize="8" fontFamily="var(--font-mono)" fontWeight="600"
                  opacity={0.5 + clarity * 0.5} style={{ pointerEvents: "none" }}>{zone.label}</text>
                <text x={pos.x} y={pos.y + 25} textAnchor="middle" fill="hsl(220, 10%, 55%)" fontSize="7" fontFamily="var(--font-mono)"
                  style={{ pointerEvents: "none" }}>{Math.round(clarity * 100)}%</text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-xl border border-border/30 bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{selected.emoji}</span>
            <span className="text-sm font-semibold" style={{ color: selected.color }}>{selected.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
              {selected.count}/{selected.maxForClear} записей
            </span>
          </div>
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: selected.color }}
              initial={{ width: 0 }} animate={{ width: `${Math.min(selected.count / selected.maxForClear, 1) * 100}%` }}
              transition={{ duration: 0.8 }} />
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-1.5">
            {selected.count === 0
              ? "Зона закрыта. Начни отмечать, чтобы открыть."
              : Math.min(selected.count / selected.maxForClear, 1) >= 1
              ? "✓ Зона полностью открыта. Ты видишь её ясно."
              : `Ещё ${selected.maxForClear - selected.count} записей для полного открытия.`}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default FogOfWarMap;
