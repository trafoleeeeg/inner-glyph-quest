import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Calendar, Flag, ChevronDown, ChevronRight, Inbox, Sun, Archive, Repeat, Link2, GripVertical, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ParticleField from "@/components/ParticleField";
import BottomNav from "@/components/BottomNav";

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: number;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  scheduled_date: string | null;
  sort_order: number;
  created_at: string;
  parent_task_id: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  linked_mission_id: string | null;
}

interface Mission {
  id: string;
  title: string;
  icon: string;
}

const CATEGORIES = [
  { id: "today", label: "Сегодня", icon: Sun, color: "text-energy" },
  { id: "scheduled", label: "План", icon: Calendar, color: "text-primary" },
  { id: "inbox", label: "Входящие", icon: Inbox, color: "text-muted-foreground" },
  { id: "someday", label: "Когда-нибудь", icon: Archive, color: "text-secondary" },
];

const PRIORITY_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-destructive/10 border-destructive/20", text: "text-destructive", label: "Срочно" },
  2: { bg: "bg-energy/10 border-energy/20", text: "text-energy", label: "Высокий" },
  3: { bg: "bg-primary/10 border-primary/20", text: "text-primary", label: "Средний" },
  4: { bg: "bg-muted/20 border-border/20", text: "text-muted-foreground", label: "Низкий" },
};

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Каждый день" },
  { value: "weekdays", label: "По будням" },
  { value: "weekly", label: "Раз в неделю" },
  { value: "monthly", label: "Раз в месяц" },
];

const QUICK_PRESETS = [
  { title: "Записать сон", icon: "🌙" },
  { title: "Отметить настроение", icon: "📡" },
  { title: "Прогулка 30 мин", icon: "🚶" },
  { title: "Чтение 20 мин", icon: "📖" },
  { title: "Медитация", icon: "🧘" },
  { title: "Тренировка", icon: "💪" },
];

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("today");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState(3);
  const [newRecurrence, setNewRecurrence] = useState<string | null>(null);
  const [newLinkedMission, setNewLinkedMission] = useState<string | null>(null);
  const [collapsedCompleted, setCollapsedCompleted] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const [tasksRes, missionsRes] = await Promise.all([
      supabase.from("user_tasks").select("*").eq("user_id", user.id).order("sort_order").order("created_at", { ascending: false }),
      supabase.from("missions").select("id, title, icon").eq("user_id", user.id).eq("is_active", true),
    ]);
    setTasks((tasksRes.data as Task[]) || []);
    setMissions((missionsRes.data as Mission[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (parentId?: string) => {
    if (!user || !newTaskTitle.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("user_tasks").insert({
      user_id: user.id,
      title: newTaskTitle.trim(),
      category: parentId ? "inbox" : activeCategory,
      priority: newTaskPriority,
      scheduled_date: activeCategory === "today" && !parentId ? today : null,
      parent_task_id: parentId || null,
      is_recurring: !!newRecurrence,
      recurrence_rule: newRecurrence,
      linked_mission_id: newLinkedMission,
    });
    if (!error) {
      setNewTaskTitle("");
      setShowInput(false);
      setNewTaskPriority(3);
      setNewRecurrence(null);
      setNewLinkedMission(null);
      fetchTasks();
      toast.success(parentId ? "Подзадача добавлена" : "Задача добавлена");
    }
  };

  // Quick preset just prefills the title — user can then set params and confirm
  const handlePresetClick = (presetTitle: string) => {
    setNewTaskTitle(presetTitle);
  };

  const toggleComplete = async (task: Task) => {
    const newCompleted = !task.is_completed;
    await supabase.from("user_tasks").update({
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq("id", task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : t));
    if (newCompleted) {
      toast.success("✓ Выполнено", { description: task.title, duration: 1500 });
      await supabase.rpc("award_activity_xp", { p_amount: 10, p_activity: "task_complete" });
      if (task.is_recurring && task.recurrence_rule) {
        const nextDate = getNextDate(task.recurrence_rule);
        await supabase.from("user_tasks").insert({
          user_id: user!.id,
          title: task.title,
          category: "scheduled",
          priority: task.priority,
          scheduled_date: nextDate,
          is_recurring: true,
          recurrence_rule: task.recurrence_rule,
          linked_mission_id: task.linked_mission_id,
        });
        toast.info("🔄 Следующее повторение создано");
      }
    }
  };

  const deleteTask = async (id: string) => {
    await supabase.from("user_tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_task_id !== id));
  };

  const moveTask = async (id: string, category: string) => {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("user_tasks").update({
      category,
      scheduled_date: category === "today" ? today : null,
    }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, category, scheduled_date: category === "today" ? today : null } : t));
  };

  const handleReorder = async (reordered: Task[]) => {
    setTasks(prev => {
      const otherTasks = prev.filter(t => !reordered.find(r => r.id === t.id));
      return [...reordered, ...otherTasks];
    });
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from("user_tasks").update({ sort_order: i }).eq("id", reordered[i].id);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredTasks = tasks.filter(t => {
    if (t.parent_task_id) return false;
    if (activeCategory === "today") {
      return (t.category === "today" || t.scheduled_date === today);
    }
    return t.category === activeCategory;
  });

  // Sort: incomplete first, then completed
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.is_completed === b.is_completed) return a.sort_order - b.sort_order;
    return a.is_completed ? 1 : -1;
  });

  const getSubtasks = (parentId: string) => tasks.filter(t => t.parent_task_id === parentId);

  const completedTasks = tasks.filter(t => t.is_completed && !t.parent_task_id);
  const todayCompleted = completedTasks.filter(t => t.completed_at && t.completed_at.startsWith(today));

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!;

  const todayTasksTotal = tasks.filter(t => !t.parent_task_id && (t.category === "today" || t.scheduled_date === today)).length;
  const todayTasksDone = todayCompleted.length;
  const progressPercent = todayTasksTotal > 0 ? Math.round((todayTasksDone / todayTasksTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header with daily progress */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">☐</span> Задачи
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                +10 XP за каждую выполненную задачу
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold font-mono text-primary">{todayTasksDone}/{todayTasksTotal}</p>
              <p className="text-[9px] text-muted-foreground font-mono">сегодня</p>
            </div>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-accent/60"
              initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.8 }} />
          </div>
          {todayTasksDone > 0 && todayTasksDone === todayTasksTotal && todayTasksTotal > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[10px] text-accent font-mono mt-1.5 text-center">
              ✨ Все задачи на сегодня выполнены!
            </motion.p>
          )}
        </motion.div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground bg-muted/10 border border-transparent"
              }`}>
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
              <span className="text-[10px] opacity-60">
                {tasks.filter(t => {
                  if (t.parent_task_id) return false;
                  if (cat.id === "today") return (t.category === "today" || t.scheduled_date === today) && !t.is_completed;
                  return t.category === cat.id && !t.is_completed;
                }).length}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Task list — incomplete first, completed at bottom */}
        <div className="space-y-1.5">
          <AnimatePresence>
            {sortedTasks.map((task, i) => (
              <motion.div key={task.id}
                initial={{ opacity: 0 }} animate={{ opacity: task.is_completed ? 0.5 : 1 }}
                className={task.is_completed ? "opacity-50" : ""}
              >
                <TaskItem
                  task={task}
                  index={i}
                  subtasks={getSubtasks(task.id)}
                  missions={missions}
                  onToggle={() => toggleComplete(task)}
                  onDelete={() => deleteTask(task.id)}
                  onMove={moveTask}
                  onToggleSubtask={(st) => toggleComplete(st)}
                  onDeleteSubtask={(id) => deleteTask(id)}
                  onAddSubtask={(parentId, title) => {
                    setNewTaskTitle(title);
                    addTask(parentId);
                  }}
                  activeCategory={activeCategory}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {sortedTasks.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <activeCat.icon className={`w-10 h-10 ${activeCat.color} mx-auto mb-3 opacity-30`} />
            <p className="text-xs text-muted-foreground font-mono">Нет задач</p>
          </motion.div>
        )}

        {/* Add task */}
        <AnimatePresence>
          {showInput ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="glass-card rounded-xl p-4 border border-primary/15 space-y-3">
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="Что нужно сделать?" autoFocus
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />

              {/* Quick presets — now they just prefill the title */}
              {!newTaskTitle && (
                <div className="flex flex-wrap gap-1">
                  {QUICK_PRESETS.map(p => (
                    <button key={p.title} onClick={() => handlePresetClick(p.title)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40 transition-colors border border-border/20">
                      <span>{p.icon}</span> {p.title}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Priority */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(p => (
                  <button key={p} onClick={() => setNewTaskPriority(p)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] border transition-all ${
                      newTaskPriority === p ? PRIORITY_COLORS[p].bg + " " + PRIORITY_COLORS[p].text : "border-transparent text-muted-foreground/30"
                    }`}>
                    <Flag className="w-3 h-3" />
                  </button>
                ))}
              </div>

              {/* Recurrence */}
              <div className="flex items-center gap-1 flex-wrap">
                <Repeat className="w-3 h-3 text-muted-foreground/50" />
                {RECURRENCE_OPTIONS.map(r => (
                  <button key={r.value} onClick={() => setNewRecurrence(newRecurrence === r.value ? null : r.value)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                      newRecurrence === r.value ? "bg-accent/20 text-accent border border-accent/30" : "text-muted-foreground/40 hover:text-muted-foreground bg-muted/10"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Link to habit */}
              {missions.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Link2 className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/50 font-mono">Привычка:</span>
                  {missions.slice(0, 5).map(m => (
                    <button key={m.id} onClick={() => setNewLinkedMission(newLinkedMission === m.id ? null : m.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
                        newLinkedMission === m.id ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground/40 hover:text-muted-foreground bg-muted/10"
                      }`}>
                      {m.icon} {m.title.slice(0, 15)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button onClick={() => { setShowInput(false); setNewTaskTitle(""); setNewRecurrence(null); setNewLinkedMission(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground">Отмена</button>
                <button onClick={() => addTask()} disabled={!newTaskTitle.trim()}
                  className="text-xs text-primary font-semibold hover:text-primary/80 disabled:opacity-30">Добавить</button>
              </div>
            </motion.div>
          ) : (
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowInput(true)}
              className="w-full py-3 rounded-xl border border-dashed border-primary/15 text-sm font-mono text-muted-foreground/50 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Добавить задачу
            </motion.button>
          )}
        </AnimatePresence>

      </div>
      <BottomNav />
    </div>
  );
};

// --- TaskItem component ---

const getNextDate = (rule: string) => {
  const now = new Date();
  switch (rule) {
    case "daily": now.setDate(now.getDate() + 1); break;
    case "weekdays": {
      let d = now; d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    case "weekly": now.setDate(now.getDate() + 7); break;
    case "monthly": now.setMonth(now.getMonth() + 1); break;
  }
  return now.toISOString().split("T")[0];
};

interface TaskItemProps {
  task: Task;
  index: number;
  subtasks: Task[];
  missions: Mission[];
  onToggle: () => void;
  onDelete: () => void;
  onMove: (id: string, cat: string) => void;
  onToggleSubtask: (task: Task) => void;
  onDeleteSubtask: (id: string) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  activeCategory: string;
}

const TaskItem = ({ task, index, subtasks, missions, onToggle, onDelete, onMove, onToggleSubtask, onDeleteSubtask, onAddSubtask, activeCategory }: TaskItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [subInput, setSubInput] = useState("");
  const [showSub, setShowSub] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[3];
  const linkedMission = task.linked_mission_id ? missions.find(m => m.id === task.linked_mission_id) : null;
  const completedSubs = subtasks.filter(s => s.is_completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className={`glass-card rounded-xl p-3 border ${priority.bg} group`}>
        <div className="flex items-center gap-3">
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground/20 hover:text-muted-foreground/50">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <motion.button whileTap={{ scale: 0.8 }} onClick={onToggle}
            className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${priority.bg} ${priority.text}`}>
          </motion.button>
          <div className="flex-1 min-w-0" onClick={() => setShowActions(!showActions)}>
            <p className="text-sm text-foreground truncate">{task.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {task.is_recurring && <span className="text-[9px] font-mono text-accent">🔄 повтор</span>}
              {linkedMission && <span className="text-[9px] font-mono text-primary">{linkedMission.icon} {linkedMission.title.slice(0, 12)}</span>}
              {subtasks.length > 0 && <span className="text-[9px] font-mono text-muted-foreground">{completedSubs}/{subtasks.length} подзадач</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {subtasks.length > 0 && (
              <button onClick={() => setExpanded(!expanded)} className="p-1 text-muted-foreground/40 hover:text-foreground">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
            <button onClick={onDelete} className="p-1 text-muted-foreground/30 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Actions row */}
        <AnimatePresence>
          {showActions && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t border-border/20 flex items-center gap-1 flex-wrap">
              {CATEGORIES.filter(c => c.id !== activeCategory).map(cat => (
                <button key={cat.id} onClick={() => { onMove(task.id, cat.id); setShowActions(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-muted-foreground hover:text-foreground bg-muted/10 hover:bg-muted/30 transition-colors">
                  <cat.icon className="w-3 h-3" /> {cat.label}
                </button>
              ))}
              <button onClick={() => { setShowSub(!showSub); setShowActions(false); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                <Plus className="w-3 h-3" /> Подзадача
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtask input */}
        <AnimatePresence>
          {showSub && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center gap-2">
              <input value={subInput} onChange={e => setSubInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && subInput.trim()) { onAddSubtask(task.id, subInput.trim()); setSubInput(""); setShowSub(false); } }}
                placeholder="Подзадача..." autoFocus
                className="flex-1 bg-muted/20 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
              <button onClick={() => { if (subInput.trim()) { onAddSubtask(task.id, subInput.trim()); setSubInput(""); setShowSub(false); } }}
                className="text-xs text-primary font-mono">+</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtasks */}
        <AnimatePresence>
          {(expanded || subtasks.length <= 3) && subtasks.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 ml-6 space-y-1">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/10 group/sub">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => onToggleSubtask(sub)}
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                      sub.is_completed ? "bg-accent/20 border-accent/30" : "border-border/30"
                    }`}>
                    {sub.is_completed && <Check className="w-2.5 h-2.5 text-accent" />}
                  </motion.button>
                  <span className={`text-xs flex-1 ${sub.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{sub.title}</span>
                  <button onClick={() => onDeleteSubtask(sub.id)} className="opacity-0 group-hover/sub:opacity-100 text-muted-foreground/30 hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TasksPage;