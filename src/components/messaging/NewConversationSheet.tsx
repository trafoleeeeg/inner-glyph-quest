import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

interface UserResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
}

const NewConversationSheet = ({ open, onClose, onCreated }: Props) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!open) { setSearch(""); setUsers([]); setSelectedUsers([]); setGroupName(""); setMode("dm"); }
  }, [open]);

  useEffect(() => {
    if (!search.trim() || !user) { setUsers([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("public_profiles")
        .select("user_id, display_name, avatar_url, level")
        .ilike("display_name", `%${search.trim()}%`)
        .neq("user_id", user.id)
        .limit(20);
      setUsers((data || []) as UserResult[]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, user]);

  const startDM = async (targetUser: UserResult) => {
    if (!user || creating) return;
    setCreating(true);

    try {
      // Check if DM already exists
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvs?.length) {
        for (const mc of myConvs) {
          const { data: conv } = await supabase
            .from("conversations")
            .select("id, type")
            .eq("id", mc.conversation_id)
            .eq("type", "dm")
            .single();

          if (conv) {
            const { data: otherPart } = await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", conv.id)
              .eq("user_id", targetUser.user_id)
              .single();

            if (otherPart) {
              onCreated(conv.id);
              setCreating(false);
              return;
            }
          }
        }
      }

      // Create new DM
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({ type: "dm", created_by: user.id })
        .select()
        .single();

      if (convErr || !conv) throw convErr;

      // Add both participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id, role: "owner" },
        { conversation_id: conv.id, user_id: targetUser.user_id, role: "member" },
      ]);

      onCreated(conv.id);
    } catch (e) {
      toast.error("Не удалось создать диалог");
    }
    setCreating(false);
  };

  const createGroup = async () => {
    if (!user || creating || selectedUsers.length < 1 || !groupName.trim()) return;
    setCreating(true);

    try {
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({ type: "group", name: groupName.trim(), created_by: user.id })
        .select()
        .single();

      if (error || !conv) throw error;

      const participants = [
        { conversation_id: conv.id, user_id: user.id, role: "owner" as const },
        ...selectedUsers.map(u => ({
          conversation_id: conv.id,
          user_id: u.user_id,
          role: "member" as const,
        })),
      ];

      await supabase.from("conversation_participants").insert(participants);
      onCreated(conv.id);
    } catch (e) {
      toast.error("Не удалось создать группу");
    }
    setCreating(false);
  };

  const toggleUser = (u: UserResult) => {
    setSelectedUsers(prev =>
      prev.some(s => s.user_id === u.user_id)
        ? prev.filter(s => s.user_id !== u.user_id)
        : [...prev, u]
    );
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-background border-border">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-foreground">Новое сообщение</SheetTitle>
        </SheetHeader>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMode("dm")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === "dm" ? "bg-foreground text-background" : "bg-muted/20 text-muted-foreground"
            }`}
          >
            Личное
          </button>
          <button
            onClick={() => setMode("group")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
              mode === "group" ? "bg-foreground text-background" : "bg-muted/20 text-muted-foreground"
            }`}
          >
            <Users className="w-3 h-3" /> Группа
          </button>
        </div>

        {mode === "group" && (
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Название группы"
            className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none"
          />
        )}

        {/* Selected users for group */}
        {mode === "group" && selectedUsers.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {selectedUsers.map(u => (
              <span key={u.user_id}
                onClick={() => toggleUser(u)}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {u.display_name} ×
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по никнейму..."
            className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 -mx-6 px-6" style={{ maxHeight: "calc(85vh - 280px)" }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : users.length === 0 && search.trim() ? (
            <p className="text-center text-xs text-muted-foreground py-8">Никого не найдено</p>
          ) : (
            users.map(u => {
              const isSelected = selectedUsers.some(s => s.user_id === u.user_id);
              return (
                <button
                  key={u.user_id}
                  onClick={() => mode === "dm" ? startDM(u) : toggleUser(u)}
                  disabled={creating}
                  className={`w-full flex items-center gap-3 py-3 border-b border-border hover:bg-muted/10 transition-colors text-left ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback className="bg-muted/30 text-muted-foreground text-xs font-mono">
                      {u.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{u.display_name}</p>
                    <p className="text-[10px] text-muted-foreground">LVL {u.level}</p>
                  </div>
                  {mode === "group" && isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {mode === "group" && selectedUsers.length > 0 && groupName.trim() && (
          <button
            onClick={createGroup}
            disabled={creating}
            className="w-full mt-3 py-3 rounded-xl bg-foreground text-background text-sm font-semibold disabled:opacity-50"
          >
            Создать группу ({selectedUsers.length + 1} участников)
          </button>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NewConversationSheet;
