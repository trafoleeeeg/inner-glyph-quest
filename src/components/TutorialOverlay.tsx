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
  { id: "welcome", emoji: "👋", title: "Добро пожаловать!", text: "Это твой центр управления жизнью. Давай быстро покажу, что тут есть." },
  { id: "xp-bar", emoji: "📊", title: "Уровень и опыт", text: "За каждую привычку и запись ты получаешь опыт. Полоска заполняется — уровень растёт.", targetId: "tutorial-xp" },
  { id: "stats", emoji: "⚡", title: "Твои показатели", text: "Энергия, серия активных дней, монеты. Энергия снижается, если не отмечать активность.", targetId: "tutorial-stats" },
  { id: "glyph", emoji: "◈", title: "Глиф — твой аватар", text: "Живая геометрическая фигура. Чем больше делаешь — тем ярче и сложнее она становится.", targetId: "tutorial-glyph" },
  { id: "life", emoji: "🔭", title: "Обзор жизни", text: "Диаграмма 6 сфер: тело, разум, эмоции, общение, рост, сны. Показывает, где всё хорошо, а где стоит подтянуть.", targetId: "tutorial-fog" },
  { id: "missions", emoji: "🎯", title: "Ежедневные привычки", text: "Отмечай привычки каждый день. За повторение XP снижается — добавляй разнообразие.", targetId: "tutorial-missions" },
  { id: "mood", emoji: "😊", title: "Настроение и сны", text: "Записывай, как себя чувствуешь. Со временем увидишь закономерности.", targetId: "tutorial-mood" },
  { id: "nav", emoji: "🧭", title: "Навигация", text: "Внизу 5 вкладок: Хаб · Лента · Племена · Задачи · Я.", targetId: "tutorial-nav" },
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
    if (!current?.targetId) { setSpotlight(null); return; }
    const el = document.getElementById(current.targetId);
    if (!el) { setSpotlight(null); return; }
    const rect = el.getBoundingClientRect();
    const pad = 8;
    setSpotlight({ top: rect.top - pad + window.scrollY, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });
    setTooltipPos(rect.top > window.innerHeight * 0.5 ? "top" : "bottom");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  useEffect(() => {
    if (!active) return;
    // Small delay to let layout settle after scroll
    const timer = setTimeout(updateSpotlight, 300);
    window.addEventListener("resize", updateSpotlight);
    return () => { clearTimeout(timer); window.removeEventListener("resize", updateSpotlight); };
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]" onClick={skip}
              style={{ position: "fixed" }}>
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }}>
                {spotlight && (
                  <div
                    className="absolute rounded-xl"
                    style={{
                      top: spotlight.top - window.scrollY,
                      left: spotlight.left,
                      width: spotlight.width,
                      height: spotlight.height,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
                      background: "transparent",
                      border: "2px solid hsl(var(--primary) / 0.5)",
                    }}
                  />
                )}
              </div>
            </motion.div>

            {/* Tooltip */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: tooltipPos === "bottom" ? 20 : -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed left-4 right-4 z-[95] max-w-md mx-auto"
              style={
                spotlight
                  ? (tooltipPos === "bottom"
                    ? { top: Math.min((spotlight.top - window.scrollY) + spotlight.height + 16, window.innerHeight - 220) }
                    : { top: Math.max((spotlight.top - window.scrollY) - 200, 20) })
                  : { bottom: 100 }
              }
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