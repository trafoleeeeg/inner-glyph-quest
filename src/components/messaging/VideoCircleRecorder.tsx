import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Square, Send, X, SwitchCamera } from "lucide-react";

interface Props {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

const VideoCircleRecorder = ({ onSend, onCancel }: Props) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: 480, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      onCancel();
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const switchCamera = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setFacingMode(f => f === "user" ? "environment" : "user");
    const newMode = facingMode === "user" ? "environment" : "user";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: 480, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch { /* ignore */ }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
      setBlob(videoBlob);
      const url = URL.createObjectURL(videoBlob);
      setPreviewUrl(url);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.start();
    setRecording(true);
    setDuration(0);
    timerRef.current = window.setInterval(() => {
      setDuration(d => {
        if (d >= 59) { stopRecording(); return 60; }
        return d + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center"
    >
      <button
        onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onCancel(); }}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Video circle */}
      <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-primary/30 relative mb-6">
        {!blob ? (
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />
        ) : previewUrl ? (
          <video
            ref={previewVideoRef}
            src={previewUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        ) : null}

        {recording && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-white font-mono">{formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {!blob ? (
          <>
            {!recording && (
              <button onClick={switchCamera} className="text-muted-foreground hover:text-foreground">
                <SwitchCamera className="w-6 h-6" />
              </button>
            )}
            {recording ? (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center"
              >
                <Square className="w-6 h-6 text-red-500" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center"
              >
                <div className="w-6 h-6 rounded-full bg-primary" />
              </button>
            )}
            {!recording && <div className="w-6" />}
          </>
        ) : (
          <button
            onClick={() => blob && onSend(blob)}
            className="px-6 py-3 rounded-full bg-foreground text-background text-sm font-semibold flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Отправить
          </button>
        )}
      </div>

      {!blob && !recording && (
        <p className="text-xs text-muted-foreground mt-4">Нажми для записи кружка (до 60 сек)</p>
      )}
    </motion.div>
  );
};

export default VideoCircleRecorder;
