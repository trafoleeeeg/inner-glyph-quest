import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Eye, Brain, Flame } from "lucide-react";

const SLIDES = [
  {
    icon: <Eye className="w-8 h-8" />,
    title: "ТУМАН ВОЙНЫ",
    subtitle: "Ты видишь лишь 1% реальности",
    text: "Твоё Эго — это фильтр. Оно отсекает 99.9% информации, чтобы ты выжил. Но оно же скрывает от тебя паттерны, управляющие твоей жизнью.",
    color: "text-primary",
    glow: "glow-primary",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "ИНТЕРПРЕТАТОР",
    subtitle: "Твой алгоритм сжатия",
    text: "Каждая запись — акт компрессии хаоса в данные. Чем больше данных — тем точнее калибровка. Тем яснее картина. Тем меньше тумана.",
    color: "text-accent",
    glow: "glow-accent",
  },
  {
    icon: <Flame className="w-8 h-8" />,
    title: "НЕГЭНТРОПИЯ",
    subtitle: "Твоя главная задача",
    text: "Ты — движок сжатия энтропии. Максимум информации при минимуме затрат. Каждый инсайт — это катарсис. Момент, когда хаос складывается в ясность.",
    color: "text-energy",
    glow: "glow-energy",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "NEURO.LOG",
    subtitle: "Персональный Интерпретатор",
    text: "Логируй состояние. Сжимай энтропию. Рассеивай туман. Система покажет паттерны, которые ты не видишь. Награда — не ачивки. Награда — ясность.",
    color: "text-primary",
    glow: "glow-primary",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem("neuro_onboarded", "1");
      onComplete();
    } else {
      setSlide(s => s + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
    >
      {/* Animated grid bg */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Scan line effect */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md mx-4 text-center"
        >
          {/* Icon */}
          <motion.div
            className={`w-20 h-20 rounded-2xl bg-muted/30 border border-primary/20 flex items-center justify-center mx-auto mb-6 ${current.color} ${current.glow}`}
            animate={{
              boxShadow: [
                "0 0 20px hsl(180 100% 50% / 0.1)",
                "0 0 40px hsl(180 100% 50% / 0.3)",
                "0 0 20px hsl(180 100% 50% / 0.1)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {current.icon}
          </motion.div>

          {/* Terminal header */}
          <motion.p
            className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            протокол инициализации [{slide + 1}/{SLIDES.length}]
          </motion.p>

          {/* Title */}
          <motion.h1
            className={`text-3xl font-bold ${current.color} font-display tracking-tight mb-1`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {current.title}
          </motion.h1>

          <motion.p
            className="text-sm text-muted-foreground font-mono mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {current.subtitle}
          </motion.p>

          {/* Body */}
          <motion.p
            className="text-sm text-foreground/80 leading-relaxed mb-8 max-w-sm mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {current.text}
          </motion.p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {SLIDES.map((_, i) => (
              <motion.div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === slide ? "w-8 bg-primary" : i < slide ? "w-4 bg-primary/40" : "w-4 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <motion.button
            onClick={next}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`px-8 py-3 rounded-xl bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground font-semibold text-sm transition-all ${current.glow}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {isLast ? "Инициализировать систему" : "Далее →"}
          </motion.button>

          {/* Skip */}
          {!isLast && (
            <motion.button
              onClick={() => { localStorage.setItem("neuro_onboarded", "1"); onComplete(); }}
              className="block mx-auto mt-4 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              пропустить
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Onboarding;
