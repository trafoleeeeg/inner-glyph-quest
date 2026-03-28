import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  text: string;
  emoji: string;
  targetId?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  { id: "welcome", emoji: "👋", title: "Добро пожаловать в Inner Glyph!", text: "Это твой командный центр. Давай быстро разберёмся, что тут к чему." },
  { id: "xp-bar", emoji: "📊", title: "Прогресс и уровень", text: "Твой уровень и шкала негэнтропии. Выполняй задачи — полоска заполняется, уровень растёт.", targetId: "tutorial-xp" },
  { id: "stats", emoji: "⚡", title: "Твои показатели", text: "Энергия, стрик, миссии, сны и монеты. Энергия тратится каждый день — логируй активность.", targetId: "tutorial-stats" },
  { id: "glyph", emoji: "◈", title: "Глиф — твоё отражение", text: "Символ твоего состояния. Цвет и форма меняются от энергии и баланса. Забросишь — деградирует.", targetId: "tutorial-glyph" },
  { id: "fog", emoji: "🗺️", title: "Туман Войны", text: "Карта с зонами жизни. Логируй активность — туман рассеивается и ты видишь ясную картину.", targetId: "tutorial-fog" },
  { id: "missions", emoji: "🎯", title: "Протоколы сжатия", text: "Ежедневные привычки с наградой XP. Повторяй одну слишком часто — XP падает.", targetId: "tutorial-missions" },
  { id: "mood", emoji: "📡", title: "Сканер и дневник снов", text: "Записывай настроение и сны. Система находит паттерны, которые ты не замечаешь.", targetId: "tutorial-mood" },
  { id: "nav", emoji: "🧭", title: "Навигация", text: "Хаб → Лента → Племена → Задачи → Профиль. Всё под рукой.", targetId: "tutorial-nav" },
];

interface SpotlightRect { top: number; left: number; width: number; height: number; }

interface TutorialContextType { startTutorial: () => void; }
const TutorialContext = createContext<TutorialContextType>({ startTutorial: () => {} });
export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<"top" | "bottom">("bottom");

  useEffect(() => {
    if (!localStorage.getItem("igq_tutorial_done") && localStorage.getItem("neuro_onboarded")) {
      const timer = setTimeout(() => setActive(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateSpotlight = useCallback(() => {
    const current = TUTORIAL_STEPS[step];
    if (!current.targetId) { setSpotlight(null); return; }
    const el = document.getElementById(current.targetId);
    if (!el) { setSpotlight(null); return; }
    const rect = el.getBoundingClientRect();
    const pad = 8;
    setSpotlight({ top: rect.top - pad + window.scrollY, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });
    // Position tooltip above or below based on element position
    setTooltipPos(rect.top > window.innerHeight * 0.5 ? "top" : "bottom");
    // Scroll element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  useEffect(() => {
    if (!active) return;
    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    return () => window.removeEventListener("resize", updateSpotlight);
  }, [active, step, updateSpotlight]);

  const startTutorial = () => { setStep(0); setActive(true); };
  const next = () => { if (step < TUTORIAL_STEPS.length - 1) setStep(s => s + 1); else { setActive(false); localStorage.setItem("igq_tutorial_done", "1"); } };
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
            {/* Dark overlay with spotlight cutout */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90]" onClick={skip}>
              <svg className="absolute inset-0 w-full h-full" style={{ height: document.documentElement.scrollHeight }}>
                <defs>
                  <mask id="spotlight-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {spotlight && (
                      <rect x={spotlight.left} y={spotlight.top} width={spotlight.width} height={spotlight.height} rx="12" fill="black" />
                    )}
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
              </svg>
              {/* Spotlight border glow */}
              {spotlight && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute rounded-xl border-2 border-primary/50 pointer-events-none"
                  style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height, boxShadow: "0 0 20px hsl(var(--primary) / 0.3), inset 0 0 20px hsl(var(--primary) / 0.1)" }}
                />
              )}
            </motion.div>

            {/* Tooltip */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: tooltipPos === "bottom" ? 20 : -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed left-4 right-4 z-[95] max-w-md mx-auto"
              style={spotlight ? (tooltipPos === "bottom" ? { top: Math.min(spotlight.top + spotlight.height + 16, window.innerHeight - 200) } : { top: Math.max(spotlight.top - 180, 20) }) : { bottom: 100 }}
            >
              <div className="glass-card rounded-2xl p-5 border border-primary/20 shadow-xl shadow-primary/5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1 mb-3">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-muted-foreground/15"}`} />
                  ))}
                  <button onClick={skip} className="ml-auto text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{current.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{current.title}</h3>
                    <p className="text-xs text-foreground/70 leading-relaxed">{current.text}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button onClick={prev} disabled={step === 0}
                    className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors">
                    <ChevronLeft className="w-3 h-3" /> Назад
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground/40">{step + 1}/{TUTORIAL_STEPS.length}</span>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={next}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors">
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
