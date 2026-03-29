import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Send, X } from "lucide-react";

interface Props {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

const AudioRecorder = ({ onSend, onCancel }: Props) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      onCancel();
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    startRecording();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border-t border-border bg-background px-4 py-3"
    >
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <button onClick={() => { stopRecording(); onCancel(); }} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {recording ? (
          <>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-foreground">{formatTime(duration)}</span>
              <span className="text-xs text-muted-foreground">Запись...</span>
            </div>
            <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <Square className="w-4 h-4" />
            </button>
          </>
        ) : blob ? (
          <>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-mono text-foreground">{formatTime(duration)}</span>
              <span className="text-xs text-muted-foreground">Готово</span>
            </div>
            <button
              onClick={() => onSend(blob)}
              className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background"
            >
              <Send className="w-4 h-4" />
            </button>
          </>
        ) : null}
      </div>
    </motion.div>
  );
};

export default AudioRecorder;
