import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Eye, Brain, Flame, Users } from "lucide-react";

const SLIDES = [
  {
    icon: <Eye className="w-8 h-8" />,
    title: "ТЫ НЕ ВИДИШЬ КАРТИНУ",
    subtitle: "И это нормально",
    text: "Каждый день ты принимаешь сотни решений на автопилоте. Почему устал? Почему тревожно? Почему не хочется ничего? Ответы есть — ты просто их не записываешь.",
    color: "text-primary",
    glow: "glow-primary",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "ЗАПИСЫВАЙ — И УВИДИШЬ",
    subtitle: "Как рентген для твоей жизни",
    text: "Залогировал настроение → увидел, что после спорта тебе всегда лучше. Записал сон → понял, что тревожишься о работе. Чем больше данных — тем яснее картина.",
    color: "text-accent",
    glow: "glow-accent",
  },
  {
    icon: <Flame className="w-8 h-8" />,
    title: "СИСТЕМА РАБОТАЕТ ЗА ТЕБЯ",
    subtitle: "Паттерны, которые ты пропускаешь",
    text: "Искусственный интеллект анализирует твои записи и находит связи, которые ты не замечаешь. «В дни без движения твоя энергия падает на 40%» — такие инсайты меняют поведение.",
    color: "text-energy",
    glow: "glow-energy",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "ТЫ НЕ ОДИН",
    subtitle: "Сообщество тех, кто растёт",
    text: "Делись прогрессом, читай других, находи единомышленников. Вместе проще: поддержка и здоровая конкуренция — мощнейшие мотиваторы.",
    color: "text-secondary",
    glow: "glow-secondary",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "NEURO.LOG",
    subtitle: "Начни видеть свою жизнь",
    text: "Выполняй протоколы. Логируй состояние. Получай награды. Каждый день — чуть больше ясности. Каждый инсайт — шаг к лучшей версии себя.",
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
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
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

          <motion.p
            className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            [{slide + 1}/{SLIDES.length}]
          </motion.p>

          <motion.h1
            className={`text-2xl font-bold ${current.color} font-display tracking-tight mb-1`}
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

          <motion.p
            className="text-sm text-foreground/80 leading-relaxed mb-8 max-w-sm mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {current.text}
          </motion.p>

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

          <motion.button
            onClick={next}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`px-8 py-3 rounded-xl bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground font-semibold text-sm transition-all ${current.glow}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {isLast ? "Начать" : "Далее →"}
          </motion.button>

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
