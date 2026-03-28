import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  message: string;
  message_type: string;
  created_at: string;
}

const CommunityChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [displayName, setDisplayName] = useState("Нейронавт");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch display name
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setDisplayName(data.display_name); });

    // Fetch messages
    supabase.from("chat_messages").select("*").order("created_at", { ascending: true }).limit(100)
      .then(({ data }) => setMessages(data || []));

    // Subscribe to realtime
    const channel = supabase
      .channel("chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => { setMessages(prev => [...prev, payload.new as ChatMessage]); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    const msg = newMessage.trim();
    if (msg.length > 500) return;
    setNewMessage("");
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      display_name: displayName,
      message: msg,
      message_type: "text",
    });
  };

  const typeColors: Record<string, string> = {
    achievement: 'border-l-accent',
    level_up: 'border-l-primary',
    streak: 'border-l-streak',
    text: 'border-l-transparent',
  };

  const typeIcons: Record<string, string> = {
    achievement: '🏆',
    level_up: '⬆️',
    streak: '🔥',
    text: '',
  };

  return (
    <div className="min-h-screen bg-background cyber-grid relative flex flex-col">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 flex flex-col flex-1 w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">💬 Сообщество</h1>
          <span className="text-xs font-mono text-muted-foreground ml-auto">{messages.length} сообщений</span>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[calc(100vh-200px)]">
          {messages.map((msg, i) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-3 border-l-2 ${typeColors[msg.message_type]} ${
                  isOwn ? 'glass-card-hover border border-primary/10' : 'glass-card border border-border/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold ${isOwn ? 'text-primary' : 'text-secondary'}`}>
                      {msg.display_name}
                    </span>
                    {typeIcons[msg.message_type] && (
                      <span className="text-xs">{typeIcons[msg.message_type]}</span>
                    )}
                    <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">{msg.message}</p>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
          {messages.length === 0 && (
            <div className="text-center py-20 text-muted-foreground text-sm">
              <p className="text-3xl mb-2">💬</p>
              <p>Начни общение первым!</p>
            </div>
          )}
        </div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-3 border border-border/30 flex items-center gap-2"
        >
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Написать сообщение..."
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-all disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default CommunityChat;
