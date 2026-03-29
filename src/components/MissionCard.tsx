import { motion } from "framer-motion";
import { Check, Edit3, Trash2, TrendingUp, TrendingDown } from "lucide-react";
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

const glyphTypeLabels: Record<string, string> = {
  cognitive_constraint: 'КОГНИТИВ',
  physical_shock: 'ФИЗИКА',
  dynamic_complexity: 'ДИНАМИКА',
};

const MissionCard = ({ mission, onComplete, onEdit, onDelete, index, devaluation }: MissionCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(mission.title);
  const [editDesc, setEditDesc] = useState(mission.description || "");
  const [editIcon, setEditIcon] = useState(mission.icon);
  const [dragX, setDragX] = useState(0);

  const diffMult = mission.difficulty_multiplier || 1;
  const effectiveXP = devaluation && devaluation > 0
    ? Math.max(Math.floor(mission.xp_reward * diffMult * (1 - devaluation)), Math.floor(mission.xp_reward * 0.3))
    : Math.floor(mission.xp_reward * diffMult);

  const glyphLabel = mission.glyph_type ? glyphTypeLabels[mission.glyph_type] : null;
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
      <div className="py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <input value={editIcon} onChange={e => setEditIcon(e.target.value)} maxLength={2}
            className="w-10 h-10 text-center text-lg bg-muted rounded-lg border border-border focus:outline-none" />
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            placeholder="Название" autoFocus />
        </div>
        <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
          className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none"
          placeholder="Описание (необязательно)" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Отмена</button>
          <button onClick={handleSaveEdit} className="text-xs text-foreground font-semibold">Сохранить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {onDelete && dragX < -30 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-y-0 right-0 w-20 bg-destructive/20 flex items-center justify-center">
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
          if (info.offset.x < -80 && onDelete) onDelete(mission.id);
          setDragX(0);
        }}
        className={`py-3 border-b border-border cursor-pointer group ${
          mission.completed ? 'opacity-35' : ''
        }`}
        onClick={() => !mission.completed && onComplete(mission.id)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${
            mission.completed ? 'bg-muted' : 'bg-muted'
          }`}>
            {mission.completed ? <Check className="w-4 h-4 text-foreground" /> : mission.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={`text-sm font-medium ${mission.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {mission.title}
              </h3>
              {glyphLabel && !mission.completed && (
                <span className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {glyphLabel}
                </span>
              )}
            </div>
            {mission.description && (
              <p className="text-[11px] text-muted-foreground truncate">{mission.description}</p>
            )}
            {!mission.completed && diffMult !== 1 && (
              <div className="flex items-center gap-1 mt-0.5">
                {isEscalated ? <TrendingUp className="w-3 h-3 text-foreground/50" /> : <TrendingDown className="w-3 h-3 text-muted-foreground" />}
                <span className="text-[9px] font-mono text-muted-foreground">
                  {isEscalated ? `+${Math.round((diffMult - 1) * 100)}%` : `-${Math.round((1 - diffMult) * 100)}%`}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`font-mono text-xs font-bold ${mission.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
              +{effectiveXP}
            </span>
            {!mission.completed && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MissionCard;
