import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

/* ───────── Step definitions ───────── */
interface TutorialStep {
  target: string;          // data-tour attribute value
  title: string;
  text: string;
  emoji: string;
}

// Steps are ordered by visual position on the Hub (top → bottom)
const HUB_STEPS: TutorialStep[] = [
  {
    target: "gauges",
    emoji: "🎯",
    title: "Кольца активности",
    text: "Движение, Энергия, Настрой — три главных показателя. Они обновляются по мере выполнения привычек и чекинов.",
  },
  {
    target: "xp-bar",
    emoji: "📊",
    title: "Прогресс уровня",
    text: "Полоска опыта. За каждое выполненное действие ты получаешь XP — когда она заполнится, уровень вырастет.",
  },
  {
    target: "stats-row",
    emoji: "⚡",
    title: "Ключевые метрики",
    text: "Энергия, серия дней, выполненные привычки, записанные сны и монеты — всё в одном месте.",
  },
  {
    target: "missions",
    emoji: "✅",
    title: "Ежедневные привычки",
    text: "Твои протоколы. Отмечай выполненные — за регулярность получаешь бонусы, за пропуски система адаптирует сложность.",
  },
  {
    target: "tasks",
    emoji: "📋",
    title: "Задачи",
    text: "Свободные задачи на день. Добавляй что угодно — от рабочих дел до личных целей.",
  },
  {
    target: "mood",
    emoji: "😊",
    title: "Чекин настроения",
    text: "Записывай как себя чувствуешь. Данные используются для анализа паттернов и калибровки протоколов.",
  },
  {
    target: "nav",
    emoji: "🧭",
    title: "Навигация",
    text: "Хаб — центр. Лента — посты сообщества. Чаты — личные сообщения. Племена — группы. Профиль — настройки и аналитика.",
  },
];

/* ───────── Spotlight geometry ───────── */
interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/* ───────── Context ───────── */
interface TutorialContextType {
  startTutorial: () => void;
}
const TutorialContext = createContext<TutorialContextType>({ startTutorial: () => {} });
export const useTutorial = () => useContext(TutorialContext);

/* ───────── Provider ───────── */
export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<TutorialStep[]>([]);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<"top" | "bottom">("bottom");

  // Resolve which steps are actually visible in the DOM right now
  const resolveSteps = useCallback(() => {
    return HUB_STEPS.filter((s) => document.querySelector(`[data-tour="${s.target}"]`));
  }, []);

  const startTutorial = useCallback(() => {
    const steps = resolveSteps();
    if (steps.length === 0) return;
    setVisibleSteps(steps);
    setStepIdx(0);
    setActive(true);
  }, [resolveSteps]);

  // Update spotlight position for current step
  const updateSpotlight = useCallback(() => {
    const step = visibleSteps[stepIdx];
    if (!step) { setSpotlight(null); return; }

    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) { setSpotlight(null); return; }

    const rect = el.getBoundingClientRect();
    const pad = 8;
    setSpotlight({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
    setTooltipPos(rect.top > window.innerHeight * 0.5 ? "top" : "bottom");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [visibleSteps, stepIdx]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(updateSpotlight, 350);
    window.addEventListener("resize", updateSpotlight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSpotlight);
    };
  }, [active, stepIdx, updateSpotlight]);

  const step = visibleSteps[stepIdx] ?? null;
  const total = visibleSteps.length;
  const isLast = stepIdx === total - 1;

  const next = () => {
    if (isLast) { close(); } else { setStepIdx((i) => i + 1); }
  };
  const prev = () => { if (stepIdx > 0) setStepIdx((i) => i - 1); };
  const close = () => {
    setActive(false);
    localStorage.setItem("igq_tutorial_done", "1");
  };

  return (
    <TutorialContext.Provider value={{ startTutorial }}>
      {children}
      <AnimatePresence>
        {active && step && (
          <>
            {/* Overlay with SVG spotlight cutout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              onClick={close}
            >
              {spotlight ? (
                <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                  <defs>
                    <mask id="tut-mask">
                      <rect x="0" y="0" width="100%" height="100%" fill="white" />
                      <rect
                        x={spotlight.left}
                        y={spotlight.top}
                        width={spotlight.width}
                        height={spotlight.height}
                        rx="16"
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect
                    x="0" y="0" width="100%" height="100%"
                    fill="rgba(0,0,0,0.82)"
                    mask="url(#tut-mask)"
                    style={{ pointerEvents: "all" }}
                  />
                  {/* Highlight border */}
                  <rect
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx="16"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                </svg>
              ) : (
                <div className="absolute inset-0 bg-black/80" />
              )}
            </motion.div>

            {/* Tooltip card */}
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, y: tooltipPos === "bottom" ? 16 : -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed left-4 right-4 z-[95] max-w-sm mx-auto"
              style={
                spotlight
                  ? tooltipPos === "bottom"
                    ? { top: Math.min(spotlight.top + spotlight.height + 12, window.innerHeight - 200) }
                    : { top: Math.max(spotlight.top - 180, 16) }
                  : { bottom: 120 }
              }
            >
              <div
                className="rounded-2xl p-5 bg-card/95 backdrop-blur-xl border border-border shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Progress dots */}
                <div className="flex items-center gap-1 mb-3">
                  {visibleSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === stepIdx
                          ? "w-6 bg-primary"
                          : i < stepIdx
                          ? "w-3 bg-primary/40"
                          : "w-3 bg-muted-foreground/15"
                      }`}
                    />
                  ))}
                  <button onClick={close} className="ml-auto text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{step.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={prev}
                    disabled={stepIdx === 0}
                    className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" /> Назад
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground/40">
                    {stepIdx + 1}/{total}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={next}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {isLast ? "Готово" : "Далее"}
                    {!isLast && <ChevronRight className="w-3 h-3" />}
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
