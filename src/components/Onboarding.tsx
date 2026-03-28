import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, BarChart3, Sparkles } from "lucide-react";

const SLIDES = [
  {
    icon: <Compass className="w-10 h-10" />,
    title: "Каждый день одно и то же?",
    text: "Ты знаешь, что можешь лучше, но не знаешь с чего начать. Просто записывай что делаешь — привычки, настроение, сны — и увидишь, где ты на самом деле.",
    visual: "🧠",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: <BarChart3 className="w-10 h-10" />,
    title: "Твой компаньон растёт с тобой",
    text: "У тебя появится виртуальный помощник. Он радуется, когда ты активен, и грустит, когда ты забиваешь. Не дай ему загрустить!",
    visual: "🤩",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: <Sparkles className="w-10 h-10" />,
    title: "Ты не один",
    text: "Тысячи людей тоже хотят стать лучше. Делись лайфхаками, вступай в группы и расти вместе с другими.",
    visual: "👥",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const finish = () => {
    localStorage.setItem("neuro_onboarded", "1");
    onComplete();
  };

  const next = () => {
    if (isLast) finish();
    else setSlide(s => s + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center px-6"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-sm w-full text-center"
        >
          {/* Visual */}
          <motion.div
            className={`w-24 h-24 rounded-3xl ${current.bg} flex items-center justify-center mx-auto mb-8 ${current.color}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <span className="text-4xl">{current.visual}</span>
          </motion.div>

          {/* Step indicator */}
          <motion.p
            className="text-xs font-mono text-muted-foreground mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Шаг {slide + 1} из {SLIDES.length}
          </motion.p>

          <motion.h1
            className="text-xl font-bold text-foreground font-display mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {current.title}
          </motion.h1>

          <motion.p
            className="text-sm text-muted-foreground leading-relaxed mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {current.text}
          </motion.p>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slide ? "w-8 bg-primary" : i < slide ? "w-4 bg-primary/40" : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <motion.button
            onClick={next}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm transition-all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isLast ? "Начать" : "Далее"}
          </motion.button>

          {!isLast && (
            <motion.button
              onClick={finish}
              className="block mx-auto mt-4 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
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
