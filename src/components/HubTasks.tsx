import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  priority: number;
  is_completed: boolean;
  completed_at: string | null;
  scheduled_date: string | null;
  category: string;
  sort_order: number;
  is_recurring: boolean;
  recurrence_rule: string | null;
  linked_mission_id: string | null;
}

const PRIORITY_DOT: Record<number, string> = {
  1: "bg-destructive",
  2: "bg-energy",
  3: "bg-primary",
  4: "bg-muted-foreground/30",
};

const HubTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_tasks")
      .select("id, title, priority, is_completed, completed_at, scheduled_date, category, sort_order, is_recurring, recurrence_rule, linked_mission_id")
      .eq("user_id", user.id)
      .is("parent_task_id", null)
      .order("sort_order")
      .order("created_at", { ascending: false });
    setTasks((data as Task[]) || []);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const todayTasks = tasks.filter(t => t.category === "today" || t.scheduled_date === today);
  const incomplete = todayTasks.filter(t => !t.is_completed);
  const completed = todayTasks.filter(t => t.is_completed);
  const progress = todayTasks.length > 0 ? Math.round((completed.length / todayTasks.length) * 100) : 0;

  const toggleComplete = async (task: Task) => {
    const newCompleted = !task.is_completed;
    await supabase.from("user_tasks").update({
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq("id", task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newCompleted } : t));
    if (newCompleted) {
      toast.success("✓", { description: task.title, duration: 1200 });
      await supabase.rpc("award_activity_xp", { p_amount: 10, p_activity: "task_complete" });
      import("@/lib/activityLogger").then(m => m.logActivity("task_completed", task.title));
    }
  };

  const addTask = async () => {
    if (!user || !newTitle.trim()) return;
    await supabase.from("user_tasks").insert({
      user_id: user.id,
      title: newTitle.trim(),
      category: "today",
      scheduled_date: today,
    });
    setNewTitle("");
    setShowInput(false);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("user_tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="py-4 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">Задачи на сегодня</h2>
        <span className="text-xs font-mono text-muted-foreground">{completed.length}/{todayTasks.length}</span>
      </div>

      {/* Progress bar */}
      {todayTasks.length > 0 && (
        <div className="h-1 bg-muted/30 rounded-full overflow-hidden mb-3">
          <motion.div className="h-full rounded-full bg-primary" 
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
        </div>
      )}

      {/* Incomplete tasks */}
      <div className="space-y-1">
        {incomplete.map(task => (
          <div key={task.id} className="flex items-center gap-2 group">
            <button onClick={() => toggleComplete(task)}
              className="w-5 h-5 rounded-full border border-border/50 flex items-center justify-center hover:border-primary transition-colors shrink-0">
            </button>
            <span className="text-xs text-foreground flex-1 truncate">{task.title}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority] || PRIORITY_DOT[3]}`} />
            <button onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {/* Completed tasks (collapsible) */}
      {completed.length > 0 && (
        <button onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground font-mono">
          {showCompleted ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Выполнено ({completed.length})
        </button>
      )}
      <AnimatePresence>
        {showCompleted && completed.map(task => (
          <motion.div key={task.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 0.4, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mt-1">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground line-through flex-1 truncate">{task.title}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Quick add */}
      {showInput ? (
        <div className="flex items-center gap-2 mt-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()}
            placeholder="Новая задача..." autoFocus
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-b border-border/30 py-1" />
          <button onClick={addTask} disabled={!newTitle.trim()} className="text-xs text-primary font-semibold disabled:opacity-30">+</button>
          <button onClick={() => { setShowInput(false); setNewTitle(""); }} className="text-xs text-muted-foreground">×</button>
        </div>
      ) : (
        <button onClick={() => setShowInput(true)}
          className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors font-mono">
          <Plus className="w-3 h-3" /> Добавить задачу
        </button>
      )}

      {todayTasks.length === 0 && !showInput && (
        <p className="text-[10px] text-muted-foreground/40 font-mono mt-1">Нет задач на сегодня</p>
      )}
    </div>
  );
};

export default HubTasks;
