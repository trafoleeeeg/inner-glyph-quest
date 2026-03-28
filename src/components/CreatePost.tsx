import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image, Video, Mic, Circle, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "circle" | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingCircle, setRecordingCircle] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = type === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Файл слишком большой (макс ${type === "video" ? "50" : "10"}МБ)`);
      return;
    }
    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file));
    setFocused(true);
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setMediaFile(new File([blob], "voice.webm", { type: "audio/webm" }));
        setMediaType("audio");
        setMediaPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setFocused(true);
    } catch {
      toast.error("Нет доступа к микрофону");
    }
  };

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const startCircleRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 480, height: 480 }, audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setMediaFile(new File([blob], "circle.webm", { type: "video/webm" }));
        setMediaType("circle");
        setMediaPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingCircle(true);
      setFocused(true);
    } catch {
      toast.error("Нет доступа к камере");
    }
  };

  const stopCircleRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setRecordingCircle(false);
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (recording) stopAudioRecording();
    if (recordingCircle) stopCircleRecording();
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile || !user) return null;
    const ext = mediaFile.name.split(".").pop() || "bin";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, mediaFile);
    if (error) { toast.error("Ошибка загрузки медиа"); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && !mediaFile)) return;
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (mediaFile) imageUrl = await uploadMedia();

    const postType = mediaType === "circle" ? "circle" : mediaType === "audio" ? "voice" : mediaType === "video" ? "video" : "post";

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: content.trim() || "",
      image_url: imageUrl,
      post_type: postType,
    });

    if (error) {
      toast.error("Ошибка при публикации");
    } else {
      setContent("");
      clearMedia();
      setFocused(false);
      toast.success("Пост опубликован");
      onPostCreated();
    }
    setSubmitting(false);
  };

  const initials = (profile?.display_name || "N").slice(0, 2).toUpperCase();

  return (
    <motion.div layout className={`glass-card rounded-2xl p-4 border transition-colors duration-300 ${focused ? "border-primary/30" : "border-border/30"}`}>
      {/* Circle recording overlay */}
      <AnimatePresence>
        {recordingCircle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 flex flex-col items-center justify-center gap-4">
            <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-destructive animate-pulse">
              <video ref={videoRef} muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            </div>
            <p className="text-xs font-mono text-destructive animate-pulse">● REC</p>
            <motion.button whileTap={{ scale: 0.9 }} onClick={stopCircleRecording}
              className="px-6 py-2 rounded-xl bg-destructive/20 text-destructive text-sm font-semibold border border-destructive/30">
              Остановить
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <Avatar className="w-10 h-10 border border-primary/20 shrink-0">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Чем хочешь поделиться?"
            maxLength={2000}
            rows={focused ? 4 : 2}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-relaxed"
          />

          {/* Media preview */}
          <AnimatePresence>
            {mediaPreview && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="relative mt-2 rounded-xl overflow-hidden border border-border/30">
                {mediaType === "image" && <img src={mediaPreview} alt="" className="w-full max-h-80 object-cover rounded-xl" />}
                {mediaType === "video" && <video src={mediaPreview} controls className="w-full max-h-80 rounded-xl" />}
                {mediaType === "circle" && (
                  <div className="flex justify-center py-4">
                    <video src={mediaPreview} controls className="w-48 h-48 rounded-full object-cover border-2 border-primary/30" />
                  </div>
                )}
                {mediaType === "audio" && (
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-primary" />
                    </div>
                    <audio src={mediaPreview} controls className="flex-1 h-8" />
                  </div>
                )}
                <button onClick={clearMedia} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-destructive/20 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording indicator */}
          {recording && (
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
              className="flex items-center gap-2 mt-2 text-destructive text-xs font-mono">
              <div className="w-2 h-2 rounded-full bg-destructive" /> Запись голоса...
              <button onClick={stopAudioRecording} className="ml-auto px-3 py-1 rounded-lg bg-destructive/20 text-destructive text-xs border border-destructive/30">
                Стоп
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {focused && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between pt-3 border-t border-border/20">
                <div className="flex items-center gap-1">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleFileSelect(e, "image")} className="hidden" />
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={e => handleFileSelect(e, "video")} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Фото">
                    <Image className="w-4 h-4" />
                  </button>
                  <button onClick={() => videoInputRef.current?.click()} className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all" title="Видео">
                    <Video className="w-4 h-4" />
                  </button>
                  <button onClick={recording ? stopAudioRecording : startAudioRecording}
                    className={`p-2 rounded-lg transition-all ${recording ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-energy hover:bg-energy/10"}`} title="Голос">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button onClick={recordingCircle ? stopCircleRecording : startCircleRecording}
                    className={`p-2 rounded-lg transition-all ${recordingCircle ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-dream hover:bg-dream/10"}`} title="Кружок">
                    <Circle className="w-4 h-4" />
                  </button>
                  <span className={`text-[10px] font-mono ml-1 ${content.length > 1800 ? "text-destructive" : "text-muted-foreground/40"}`}>
                    {content.length}/2000
                  </span>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit} disabled={(!content.trim() && !mediaFile) || submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary text-xs font-semibold disabled:opacity-30 hover:bg-primary/30 transition-all">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Опубликовать
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default CreatePost;
