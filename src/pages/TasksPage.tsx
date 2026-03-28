import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Calendar, Flag, ChevronDown, ChevronRight, Inbox, Sun, Clock, Archive } from "lucide-react";
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
}

const CATEGORIES = [
  { id: "today", label: "Сегодня", icon: Sun, color: "text-energy" },
  { id: "scheduled", label: "Запланировано", icon: Calendar, color: "text-primary" },
  { id: "inbox", label: "Входящие", icon: Inbox, color: "text-muted-foreground" },
  { id: "someday", label: "Когда-нибудь", icon: Archive, color: "text-secondary" },
];

const PRIORITY_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-destructive/10 border-destructive/20", text: "text-destructive", label: "Срочно" },
  2: { bg: "bg-energy/10 border-energy/20", text: "text-energy", label: "Высокий" },
  3: { bg: "bg-primary/10 border-primary/20", text: "text-primary", label: "Средний" },
  4: { bg: "bg-muted/20 border-border/20", text: "text-muted-foreground", label: "Низкий" },
};

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("today");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState(3);
  const [collapsedCompleted, setCollapsedCompleted] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .order("created_at", { ascending: false });
    setTasks((data as Task[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("user_tasks").insert({
      user_id: user.id,
      title: newTaskTitle.trim(),
      category: activeCategory,
      priority: newTaskPriority,
      scheduled_date: activeCategory === "today" ? today : null,
    });
    if (!error) {
      setNewTaskTitle("");
      setShowInput(false);
      setNewTaskPriority(3);
      fetchTasks();
      toast.success("Задача добавлена");
    }
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
      // Award XP for completing task
      await supabase.rpc("award_activity_xp", { p_amount: 10, p_activity: "task_complete" });
    }
  };

  const deleteTask = async (id: string) => {
    await supabase.from("user_tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const moveTask = async (id: string, category: string) => {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("user_tasks").update({
      category,
      scheduled_date: category === "today" ? today : null,
    }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, category, scheduled_date: category === "today" ? today : null } : t));
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredTasks = tasks.filter(t => {
    if (activeCategory === "today") {
      return (t.category === "today" || t.scheduled_date === today) && !t.is_completed;
    }
    return t.category === activeCategory && !t.is_completed;
  });

  const completedTasks = tasks.filter(t => t.is_completed);
  const todayCompleted = completedTasks.filter(t => t.completed_at && t.completed_at.startsWith(today));

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!;

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="text-primary">☐</span> Задачи
          </h1>
          <p className="text-[10px] text-muted-foreground font-mono">
            +10 XP за каждую выполненную задачу
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground bg-muted/10 border border-transparent"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
              <span className="text-[10px] opacity-60">
                {tasks.filter(t => {
                  if (cat.id === "today") return (t.category === "today" || t.scheduled_date === today) && !t.is_completed;
                  return t.category === cat.id && !t.is_completed;
                }).length}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Tasks list */}
        <div className="space-y-1.5">
          <AnimatePresence>
            {filteredTasks.map((task, i) => (
              <TaskItem
                key={task.id}
                task={task}
                index={i}
                onToggle={() => toggleComplete(task)}
                onDelete={() => deleteTask(task.id)}
                onMove={moveTask}
                activeCategory={activeCategory}
              />
            ))}
          </AnimatePresence>

          {filteredTasks.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-12">
              <activeCat.icon className={`w-10 h-10 ${activeCat.color} mx-auto mb-3 opacity-30`} />
              <p className="text-xs text-muted-foreground font-mono">Нет задач</p>
              <p className="text-[10px] text-muted-foreground/50 font-mono mt-1">
                {activeCategory === "today" ? "Запланируй день" : "Добавь задачу"}
              </p>
            </motion.div>
          )}
        </div>

        {/* Add task */}
        <AnimatePresence>
          {showInput ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="glass-card rounded-xl p-4 border border-primary/15 space-y-3"
            >
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="Что нужно сделать?"
                autoFocus
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map(p => (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] border transition-all ${
                        newTaskPriority === p
                          ? PRIORITY_COLORS[p].bg + " " + PRIORITY_COLORS[p].text
                          : "border-transparent text-muted-foreground/30"
                      }`}
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowInput(false); setNewTaskTitle(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground">Отмена</button>
                  <button onClick={addTask}
                    className="text-xs text-primary font-semibold hover:text-primary/80">Добавить</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInput(true)}
              className="w-full py-3 rounded-xl border border-dashed border-primary/15 text-sm font-mono text-muted-foreground/50 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Добавить задачу
            </motion.button>
          )}
        </AnimatePresence>

        {/* Completed today */}
        {todayCompleted.length > 0 && (
          <div>
            <button
              onClick={() => setCollapsedCompleted(!collapsedCompleted)}
              className="flex items-center gap-2 text-xs text-muted-foreground/50 font-mono mb-2 hover:text-muted-foreground transition-colors"
            >
              {collapsedCompleted ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Выполнено сегодня ({todayCompleted.length})
            </button>
            <AnimatePresence>
              {!collapsedCompleted && todayCompleted.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 0.5, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 mb-1"
                >
                  <button onClick={() => toggleComplete(task)}
                    className="w-5 h-5 rounded-md bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </button>
                  <span className="text-xs text-muted-foreground line-through flex-1">{task.title}</span>
                  <button onClick={() => deleteTask(task.id)} className="text-muted-foreground/20 hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

const TaskItem = ({ task, index, onToggle, onDelete, onMove, activeCategory }: {
  task: Task; index: number; onToggle: () => void; onDelete: () => void;
  onMove: (id: string, cat: string) => void; activeCategory: string;
}) => {
  const [showActions, setShowActions] = useState(false);
  const prio = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[3];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`glass-card rounded-xl p-3.5 border transition-all ${prio.bg} group`}
      onClick={() => setShowActions(!showActions)}
    >
      <div className="flex items-start gap-3">
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={e => { e.stopPropagation(); onToggle(); }}
          className={`w-5 h-5 rounded-md border-2 ${prio.text} border-current/30 flex items-center justify-center shrink-0 mt-0.5 hover:bg-accent/20 transition-colors`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">{task.title}</p>
          {task.due_date && (
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> {new Date(task.due_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {task.priority <= 2 && <Flag className={`w-3 h-3 ${prio.text}`} />}
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground/20 hover:text-destructive transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick move actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-1.5 mt-2 pt-2 border-t border-border/20"
          >
            {CATEGORIES.filter(c => c.id !== activeCategory).map(cat => (
              <button
                key={cat.id}
                onClick={e => { e.stopPropagation(); onMove(task.id, cat.id); setShowActions(false); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <cat.icon className="w-3 h-3" /> {cat.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TasksPage;
