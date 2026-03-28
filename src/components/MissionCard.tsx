import { motion } from "framer-motion";
import { Check, Sparkles, Edit3, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export interface MissionData {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  xp_reward: number;
  completed?: boolean;
  difficulty_multiplier?: number;
  consecutive_successes?: number;
  consecutive_failures?: number;
  glyph_type?: string;
  elo_rating?: number;
}

interface MissionCardProps {
  mission: MissionData;
  onComplete: (id: string) => void;
  onEdit?: (id: string, data: { title: string; description: string; icon: string }) => void;
  onDelete?: (id: string) => void;
  index: number;
  devaluation?: number;
}

const categoryColors: Record<string, { border: string; text: string; bg: string }> = {
  habit: { border: 'border-primary/15 hover:border-primary/30', text: 'text-primary', bg: 'bg-primary/8' },
  mood: { border: 'border-energy/15 hover:border-energy/30', text: 'text-energy', bg: 'bg-energy/8' },
  dream: { border: 'border-dream/15 hover:border-dream/30', text: 'text-dream', bg: 'bg-dream/8' },
  desire: { border: 'border-secondary/15 hover:border-secondary/30', text: 'text-secondary', bg: 'bg-secondary/8' },
  health: { border: 'border-accent/15 hover:border-accent/30', text: 'text-accent', bg: 'bg-accent/8' },
  custom: { border: 'border-primary/15 hover:border-primary/30', text: 'text-primary', bg: 'bg-primary/8' },
};

const categoryLabels: Record<string, string> = {
  habit: 'Привычка', mood: 'Настрой', dream: 'Сон',
  desire: 'Цель', health: 'Здоровье', custom: 'Своё',
};

const glyphTypeLabels: Record<string, { label: string; color: string }> = {
  cognitive_constraint: { label: 'КОГНИТИВ', color: 'text-primary bg-primary/10' },
  physical_shock: { label: 'ФИЗИКА', color: 'text-destructive bg-destructive/10' },
  dynamic_complexity: { label: 'ДИНАМИКА', color: 'text-accent bg-accent/10' },
};

const MissionCard = ({ mission, onComplete, onEdit, onDelete, index, devaluation }: MissionCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(mission.title);
  const [editDesc, setEditDesc] = useState(mission.description || "");
  const [editIcon, setEditIcon] = useState(mission.icon);
  const [dragX, setDragX] = useState(0);

  const colors = categoryColors[mission.category] || categoryColors.custom;
  const diffMult = mission.difficulty_multiplier || 1;
  const effectiveXP = devaluation && devaluation > 0
    ? Math.max(Math.floor(mission.xp_reward * diffMult * (1 - devaluation)), Math.floor(mission.xp_reward * 0.3))
    : Math.floor(mission.xp_reward * diffMult);

  const glyphInfo = mission.glyph_type ? glyphTypeLabels[mission.glyph_type] : null;
  const isEscalated = diffMult > 1.1;
  const isReduced = diffMult < 0.9;

  const handleSaveEdit = () => {
    if (onEdit && editTitle.trim()) {
      onEdit(mission.id, { title: editTitle.trim(), description: editDesc.trim(), icon: editIcon });
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-4 border border-primary/15 space-y-2">
        <div className="flex items-center gap-2">
          <input value={editIcon} onChange={e => setEditIcon(e.target.value)} maxLength={2}
            className="w-10 h-10 text-center text-lg bg-muted/30 rounded-lg border border-border/30 focus:outline-none" />
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            placeholder="Название" autoFocus />
        </div>
        <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
          className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none"
          placeholder="Описание (необязательно)" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">Отмена</button>
          <button onClick={handleSaveEdit} className="text-xs text-primary font-semibold">Сохранить</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {onDelete && dragX < -30 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-y-0 right-0 w-20 bg-destructive/20 flex items-center justify-center rounded-r-xl">
          <Trash2 className="w-5 h-5 text-destructive" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.4 }}
        drag={onDelete ? "x" : false}
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.3}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80 && onDelete) {
            onDelete(mission.id);
          }
          setDragX(0);
        }}
        className={`glass-card rounded-xl p-3.5 border transition-all duration-200 cursor-pointer group relative ${
          mission.completed ? 'opacity-35 border-accent/8' : colors.border
        } ${isEscalated && !mission.completed ? 'ring-1 ring-accent/20' : ''} ${isReduced && !mission.completed ? 'ring-1 ring-destructive/15' : ''}`}
        onClick={() => !mission.completed && onComplete(mission.id)}
        whileHover={!mission.completed ? { y: -1 } : {}}
        whileTap={!mission.completed ? { scale: 0.98 } : {}}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${
            mission.completed ? 'bg-accent/15' : colors.bg
          }`}>
            {mission.completed ? <Check className="w-4 h-4 text-accent" /> : mission.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <h3 className={`text-sm font-medium ${mission.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {mission.title}
              </h3>
              {glyphInfo && !mission.completed && (
                <span className={`text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md ${glyphInfo.color}`}>
                  {glyphInfo.label}
                </span>
              )}
            </div>
            {mission.description && (
              <p className="text-[11px] text-muted-foreground truncate">{mission.description}</p>
            )}
            {/* Elo difficulty indicator */}
            {!mission.completed && diffMult !== 1 && (
              <div className="flex items-center gap-1 mt-1">
                {isEscalated ? (
                  <TrendingUp className="w-3 h-3 text-accent" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive/60" />
                )}
                <span className={`text-[9px] font-mono ${isEscalated ? 'text-accent' : 'text-destructive/60'}`}>
                  {isEscalated ? `+${Math.round((diffMult - 1) * 100)}% сложность` : `${Math.round((1 - diffMult) * 100)}% упрощение`}
                </span>
                {mission.consecutive_successes !== undefined && mission.consecutive_successes > 0 && (
                  <span className="text-[8px] text-muted-foreground/50 font-mono">
                    ({mission.consecutive_successes}/5 до эскалации)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1">
              {!mission.completed && <Sparkles className={`w-3 h-3 ${colors.text} opacity-40`} />}
              <span className={`font-mono text-xs font-bold ${mission.completed ? 'text-muted-foreground' : colors.text}`}>
                +{effectiveXP}
              </span>
            </div>
            {!mission.completed && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-primary transition-all"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        {onDelete && !mission.completed && (
          <p className="text-[8px] text-muted-foreground/20 font-mono mt-1 text-right md:hidden">
            ← свайпни для удаления
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default MissionCard;
