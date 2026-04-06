import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Paperclip, Mic, Video, Image as ImageIcon, X, Play, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import AudioRecorder from "@/components/messaging/AudioRecorder";
import VideoCircleRecorder from "@/components/messaging/VideoCircleRecorder";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  forwarded_post_id: string | null;
  reply_to_id: string | null;
  created_at: string;
  sender?: { display_name: string; avatar_url: string | null };
}

interface ConvInfo {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
}

const ConversationPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [convInfo, setConvInfo] = useState<ConvInfo | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showAudioRec, setShowAudioRec] = useState(false);
  const [showVideoRec, setShowVideoRec] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversation info
  useEffect(() => {
    if (!conversationId || !user) return;
    (async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      if (!conv) return;

      if (conv.type === "dm") {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conv.id)
          .neq("user_id", user.id)
          .limit(1);
        if (parts?.length) {
          const { data: profile } = await (supabase as any)
            .from("public_profiles")
            .select("display_name, avatar_url")
            .eq("user_id", parts[0].user_id)
            .single();
          setConvInfo({
            id: conv.id,
            type: conv.type,
            name: profile?.display_name || "Чат",
            avatar_url: profile?.avatar_url || null,
          });
          return;
        }
      }

      setConvInfo({ id: conv.id, type: conv.type, name: conv.name || "Группа", avatar_url: conv.avatar_url });
    })();
  }, [conversationId, user]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (!data) return;

    // Enrich with sender profiles
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await (supabase as any)
      .from("public_profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", senderIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setMessages(data.map(m => ({
      ...m,
      sender: (profileMap.get(m.sender_id) as { display_name: string; avatar_url: string | null }) || { display_name: "?", avatar_url: null },
    })));

    setTimeout(scrollToBottom, 100);
  }, [conversationId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Real-time messages
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        const { data: profile } = await (supabase as any)
          .from("public_profiles")
          .select("user_id, display_name, avatar_url")
          .eq("user_id", msg.sender_id)
          .single();

        setMessages(prev => [...prev, { ...msg, sender: profile || { display_name: "?", avatar_url: null } }]);
        setTimeout(scrollToBottom, 50);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  const sendMessage = async (type: string = "text", mediaUrl?: string, content?: string) => {
    if (!user || !conversationId || sending) return;
    const text = content || input.trim();
    if (type === "text" && !text) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: type === "text" ? text : content || null,
      message_type: type,
      media_url: mediaUrl || null,
    });

    if (error) {
      toast.error("Не удалось отправить");
    } else {
      setInput("");
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      import("@/lib/activityLogger").then(m => m.logActivity("message_sent", type, { conversation_id: conversationId }));
    }
    setSending(false);
  };

  const handleFileUpload = async (file: File, type: "image" | "video" | "audio" | "file") => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/chat/${conversationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error("Ошибка загрузки"); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    await sendMessage(type, urlData.publicUrl);
    setShowAttach(false);
  };

  const handleMediaUpload = async (blob: Blob, type: "audio" | "video_circle") => {
    if (!user) return;
    const ext = type === "audio" ? "webm" : "webm";
    const path = `${user.id}/chat/${conversationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, blob);
    if (error) { toast.error("Ошибка загрузки"); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    await sendMessage(type, urlData.publicUrl);
  };

  const renderMessage = (msg: Message) => {
    const isMine = msg.sender_id === user?.id;

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-2 px-4 py-1 ${isMine ? "flex-row-reverse" : ""}`}
      >
        {!isMine && convInfo?.type !== "dm" && (
          <Avatar className="w-7 h-7 shrink-0 mt-1">
            {msg.sender?.avatar_url && <AvatarImage src={msg.sender.avatar_url} />}
            <AvatarFallback className="bg-muted/30 text-muted-foreground text-[8px]">
              {(msg.sender?.display_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
          {!isMine && convInfo?.type !== "dm" && (
            <p className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.sender?.display_name}</p>
          )}
          <div className={`rounded-2xl px-3 py-2 ${
            isMine
              ? "bg-foreground text-background rounded-br-md"
              : "bg-muted/20 text-foreground rounded-bl-md"
          }`}>
            {msg.message_type === "text" && (
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
            )}
            {msg.message_type === "image" && msg.media_url && (
              <img src={msg.media_url} alt="" className="rounded-xl max-w-full max-h-60 object-cover" />
            )}
            {msg.message_type === "video" && msg.media_url && (
              <video src={msg.media_url} controls className="rounded-xl max-w-full max-h-60" />
            )}
            {msg.message_type === "audio" && msg.media_url && (
              <audio src={msg.media_url} controls className="max-w-full" />
            )}
            {msg.message_type === "video_circle" && msg.media_url && (
              <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-primary/30">
                <video src={msg.media_url} controls className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <p className={`text-[9px] text-muted-foreground/50 mt-0.5 px-1 ${isMine ? "text-right" : ""}`}>
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ru })}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/messages")} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar className="w-9 h-9">
            {convInfo?.avatar_url && <AvatarImage src={convInfo.avatar_url} />}
            <AvatarFallback className="bg-muted/30 text-muted-foreground text-xs">
              {(convInfo?.name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{convInfo?.name || "Загрузка..."}</p>
            <p className="text-[10px] text-muted-foreground">
              {convInfo?.type === "dm" ? "личные сообщения" : "группа"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Начни общение!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Audio / Video recorders */}
      <AnimatePresence>
        {showAudioRec && (
          <AudioRecorder
            onSend={blob => { handleMediaUpload(blob, "audio"); setShowAudioRec(false); }}
            onCancel={() => setShowAudioRec(false)}
          />
        )}
        {showVideoRec && (
          <VideoCircleRecorder
            onSend={blob => { handleMediaUpload(blob, "video_circle"); setShowVideoRec(false); }}
            onCancel={() => setShowVideoRec(false)}
          />
        )}
      </AnimatePresence>

      {/* Attachment menu */}
      <AnimatePresence>
        {showAttach && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t border-border bg-background px-4 py-3"
          >
            <div className="max-w-2xl mx-auto flex gap-4">
              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[9px]">Фото</span>
              </button>
              <button
                onClick={() => { setShowAudioRec(true); setShowAttach(false); }}
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-[9px]">Аудио</span>
              </button>
              <button
                onClick={() => { setShowVideoRec(true); setShowAttach(false); }}
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-[9px]">Кружок</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!showAudioRec && !showVideoRec && (
        <div className="shrink-0 border-t border-border bg-background">
          <div className="max-w-2xl mx-auto flex items-end gap-2 px-4 py-3">
            <button
              onClick={() => setShowAttach(!showAttach)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Сообщение..."
                rows={1}
                className="w-full bg-muted/20 border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-none max-h-32"
                style={{ minHeight: "40px" }}
              />
            </div>
            {input.trim() ? (
              <button
                onClick={() => sendMessage()}
                disabled={sending}
                className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center text-background shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => { setShowAudioRec(true); setShowAttach(false); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
          handleFileUpload(file, type as any);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default ConversationPage;
