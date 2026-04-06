import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { handleAiMessage } from "@/services/aiPsychologist";
import { Bot, X, Send, Minus } from "lucide-react";
import { toast } from "sonner";

const AI_USER_ID = "00000000-0000-0000-0000-000000000000";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const AiChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const initChat = async () => {
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
              .eq("user_id", AI_USER_ID)
              .single();

            if (otherPart) {
              setConversationId(conv.id);
              return;
            }
          }
        }
      }

      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({ type: "dm", created_by: user.id })
        .select()
        .single();

      if (convErr || !conv) return;

      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id, role: "owner" },
        { conversation_id: conv.id, user_id: AI_USER_ID, role: "member" },
      ]);

      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: AI_USER_ID,
        content: "Привет! Я твой ИИ-психолог. Чем могу помочь?",
        message_type: "text"
      });

      setConversationId(conv.id);
    };
    initChat();
  }, [user]);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (data) setMessages(data as Message[]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    fetchMessages();

    const channel = supabase
      .channel(`widget-conv-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !conversationId || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
      message_type: "text"
    });

    if (error) {
      toast.error("Ошибка отправки");
      setLoading(false);
      return;
    }

    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    handleAiMessage(conversationId, user.id, text);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="w-80 h-[28rem] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">ИИ Психолог</p>
                  <span className="text-[10px] text-green-400">онлайн</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Minus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map(msg => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted/30 text-foreground rounded-bl-md"}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-2">
              <div className="flex items-center gap-2 bg-muted/20 rounded-xl">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Сообщение..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none"
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()} className="p-2 text-primary disabled:opacity-30">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center border-2 border-background"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </div>
  );
};
export default AiChatWidget;
