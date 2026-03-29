import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ChevronDown } from "lucide-react";

interface LogEntry {
  id: string;
  user_id: string;
  action_type: string;
  action_detail: string | null;
  metadata: any;
  created_at: string;
  display_name?: string;
}

const ACTION_LABELS: Record<string, { label: string; emoji: string }> = {
  login: { label: "Вход", emoji: "🔑" },
  mission_complete: { label: "Миссия", emoji: "✅" },
  mood_checkin: { label: "Настроение", emoji: "😊" },
  dream_logged: { label: "Сон", emoji: "🌙" },
  post_created: { label: "Пост", emoji: "📝" },
  message_sent: { label: "Сообщение", emoji: "💬" },
  profile_updated: { label: "Профиль", emoji: "👤" },
  habit_created: { label: "Привычка+", emoji: "🎯" },
  habit_deleted: { label: "Привычка-", emoji: "🗑" },
  task_completed: { label: "Задача", emoji: "☑️" },
  post_liked: { label: "Лайк", emoji: "❤️" },
  comment_added: { label: "Коммент", emoji: "💭" },
  tribe_joined: { label: "Племя", emoji: "🏕" },
  page_view: { label: "Просмотр", emoji: "👁" },
};

const ActivityLog = ({ selectedUserId }: { selectedUserId?: string }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      let query = supabase
        .from("activity_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (selectedUserId) {
        query = query.eq("user_id", selectedUserId);
      }
      if (filterType !== "all") {
        query = query.eq("action_type", filterType);
      }

      const { data } = await query;
      
      if (data && data.length > 0) {
        // Fetch display names
        const userIds = [...new Set((data as any[]).map((d: any) => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        
        const nameMap: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name; });
        
        setLogs((data as any[]).map((d: any) => ({
          ...d,
          display_name: nameMap[d.user_id] || "Unknown",
        })));
      } else {
        setLogs([]);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [selectedUserId, limit, filterType]);

  const actionTypes = ["all", ...Object.keys(ACTION_LABELS)];

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Лог действий {selectedUserId ? "(пользователь)" : "(все)"}
        </h3>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-[10px] bg-muted/30 border border-border/30 rounded-lg px-2 py-1 text-foreground"
        >
          {actionTypes.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "Все действия" : ACTION_LABELS[t]?.label || t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center text-muted-foreground text-xs py-8">Нет записей</p>
      ) : (
        <>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {logs.map((log) => {
              const info = ACTION_LABELS[log.action_type] || { label: log.action_type, emoji: "📌" };
              return (
                <div key={log.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <span className="text-sm">{info.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">{info.label}</span>
                      {!selectedUserId && (
                        <span className="text-[10px] font-semibold text-foreground truncate">{log.display_name}</span>
                      )}
                    </div>
                    {log.action_detail && (
                      <p className="text-[9px] text-muted-foreground truncate">{log.action_detail}</p>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("ru-RU", { 
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" 
                    })}
                  </span>
                </div>
              );
            })}
          </div>
          {logs.length >= limit && (
            <button
              onClick={() => setLimit((l) => l + 50)}
              className="w-full mt-3 text-[10px] text-primary hover:underline flex items-center justify-center gap-1"
            >
              Загрузить ещё <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityLog;
