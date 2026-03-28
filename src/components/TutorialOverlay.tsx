import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  text: string;
  emoji: string;
  targetId?: string; // CSS id to highlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    emoji: "👋",
    title: "Добро пожаловать в Inner Glyph!",
    text: "Это твой командный центр. Давай быстро разберёмся, что тут к чему. Это займёт 30 секунд.",
  },
  {
    id: "xp-bar",
    emoji: "📊",
    title: "Прогресс и уровень",
    text: "Вверху — твой уровень и шкала опыта (негэнтропии). Выполняй задачи и протоколы — полоска заполняется, уровень растёт.",
    targetId: "tutorial-xp",
  },
  {
    id: "stats",
    emoji: "⚡",
    title: "Твои показатели",
    text: "Энергия, стрик (дни подряд), выполненные миссии, сны и монеты. Энергия тратится каждый день — логируй активность, чтобы восполнять.",
    targetId: "tutorial-stats",
  },
  {
    id: "glyph",
    emoji: "◈",
    title: "Глиф — твоё отражение",
    text: "Анимированный символ, который отражает твоё состояние. Цвет, форма и пульсация меняются в зависимости от энергии, стрика и баланса жизни. Если забросишь — глиф деградирует.",
    targetId: "tutorial-glyph",
  },
  {
    id: "missions",
    emoji: "🎯",
    title: "Протоколы сжатия",
    text: "Ежедневные привычки с наградой XP. Нажми на карточку — и привычка выполнена. Повторяй одну и ту же слишком часто — XP падает (энтропия).",
    targetId: "tutorial-missions",
  },
  {
    id: "mood",
    emoji: "📡",
    title: "Сканер и дневник снов",
    text: "Записывай настроение и сны. Это данные для анализа паттернов — система находит связи, которые ты не замечаешь.",
    targetId: "tutorial-mood",
  },
  {
    id: "nav",
    emoji: "🧭",
    title: "Навигация",
    text: "Хаб — главная. Лента — посты сообщества. Задачи — трекер дел. Поиск — найди единомышленников. Я — твой профиль и аналитика.",
    targetId: "tutorial-nav",
  },
];

interface TutorialContextType {
  startTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType>({ startTutorial: () => {} });

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("igq_tutorial_done") && localStorage.getItem("neuro_onboarded")) {
      const timer = setTimeout(() => setActive(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTutorial = () => { setStep(0); setActive(true); };

  const next = () => {
    if (step < TUTORIAL_STEPS.length - 1) setStep(s => s + 1);
    else { setActive(false); localStorage.setItem("igq_tutorial_done", "1"); }
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const skip = () => { setActive(false); localStorage.setItem("igq_tutorial_done", "1"); };

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <TutorialContext.Provider value={{ startTutorial }}>
      {children}
      <AnimatePresence>
        {active && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-background/70 backdrop-blur-sm"
              onClick={skip}
            />

            {/* Tooltip */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-24 left-4 right-4 z-[95] max-w-md mx-auto"
            >
              <div className="glass-card rounded-2xl p-5 border border-primary/20 shadow-xl shadow-primary/5">
                {/* Progress dots */}
                <div className="flex items-center gap-1 mb-3">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                      i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-muted-foreground/15"
                    }`} />
                  ))}
                  <button onClick={skip} className="ml-auto text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{current.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{current.title}</h3>
                    <p className="text-xs text-foreground/70 leading-relaxed">{current.text}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={prev}
                    disabled={step === 0}
                    className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" /> Назад
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground/40">
                    {step + 1}/{TUTORIAL_STEPS.length}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={next}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"
                  >
                    {isLast ? "Готово!" : "Далее"} {!isLast && <ChevronRight className="w-3 h-3" />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TutorialContext.Provider>
  );
};
