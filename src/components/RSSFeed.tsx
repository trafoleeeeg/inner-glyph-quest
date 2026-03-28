import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Rss, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

const TOPICS = [
  { id: "motivation", label: "Мотивация", emoji: "🔥" },
  { id: "mindfulness", label: "Осознанность", emoji: "🧘" },
  { id: "productivity", label: "Продуктивность", emoji: "⚡" },
  { id: "fitness", label: "Фитнес", emoji: "💪" },
  { id: "psychology", label: "Психология", emoji: "🧠" },
  { id: "habits", label: "Привычки", emoji: "🎯" },
];

interface RSSItem {
  title: string;
  description: string;
  link: string;
  source: string;
  topic: string;
}

const RSSFeed = () => {
  const [activeTopic, setActiveTopic] = useState("motivation");
  const [items, setItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("rss-content", {
        body: { topic: activeTopic },
      });
      if (fnError) throw fnError;
      setItems(data?.items || []);
    } catch (e: any) {
      setError("Не удалось загрузить контент");
      // Fallback content
      setItems(getFallbackContent(activeTopic));
    } finally {
      setLoading(false);
    }
  }, [activeTopic]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Rss className="w-4 h-4 text-accent" /> Читай и вдохновляйся
        </h3>
        <motion.button whileTap={{ scale: 0.9, rotate: 180 }} onClick={fetchContent}
          className="text-muted-foreground hover:text-primary transition-colors p-1">
          <RefreshCw className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Topic tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TOPICS.map(topic => (
          <motion.button key={topic.id} whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTopic(topic.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all ${
              activeTopic === topic.id
                ? "bg-accent/15 text-accent border border-accent/25"
                : "text-muted-foreground bg-muted/10 border border-transparent hover:border-border/20"
            }`}>
            <span>{topic.emoji}</span> {topic.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTopic} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-2">
            {items.map((item, i) => (
              <motion.a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block glass-card rounded-xl p-3 border border-border/20 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-[9px] font-mono text-muted-foreground/60 mt-1.5">{item.source}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors shrink-0 mt-0.5" />
                </div>
              </motion.a>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// Fallback content when edge function fails
function getFallbackContent(topic: string): RSSItem[] {
  const content: Record<string, RSSItem[]> = {
    motivation: [
      { title: "Как маленькие победы создают большие перемены", description: "Исследования показывают: празднование мелких достижений усиливает мотивацию на 34%", link: "#", source: "Наука мотивации", topic: "motivation" },
      { title: "Правило 2 минут: начни с малого", description: "Если действие занимает меньше 2 минут — сделай прямо сейчас. Это ключ к привычкам.", link: "#", source: "Atomic Habits", topic: "motivation" },
      { title: "Почему дисциплина важнее мотивации", description: "Мотивация приходит и уходит. Дисциплина — это то, что двигает вперёд каждый день.", link: "#", source: "Психология успеха", topic: "motivation" },
    ],
    mindfulness: [
      { title: "5 минут осознанности меняют химию мозга", description: "Регулярная медитация снижает кортизол и увеличивает объём префронтальной коры", link: "#", source: "Нейронаука", topic: "mindfulness" },
      { title: "Body scan: техника сканирования тела", description: "Простая практика для снятия напряжения за 3 минуты", link: "#", source: "Mindful.org", topic: "mindfulness" },
    ],
    productivity: [
      { title: "Deep Work: как войти в поток за 15 минут", description: "Кэл Ньюпорт выделяет 4 правила для глубокой концентрации", link: "#", source: "Deep Work", topic: "productivity" },
      { title: "Метод помидора 2.0: адаптируй под себя", description: "Классические 25/5 не для всех. Найди свой оптимальный ритм работы.", link: "#", source: "Productivity Science", topic: "productivity" },
    ],
    fitness: [
      { title: "7-минутная тренировка с научной базой", description: "HIIT за 7 минут даёт эффект часовой кардио-сессии", link: "#", source: "ACSM Journal", topic: "fitness" },
      { title: "Ходьба 10 000 шагов: миф или реальность?", description: "Новые исследования: даже 4400 шагов значительно снижают риски", link: "#", source: "Harvard Health", topic: "fitness" },
    ],
    psychology: [
      { title: "Нейропластичность: мозг меняется в любом возрасте", description: "Новые нейронные связи формируются каждый раз, когда вы учитесь чему-то новому", link: "#", source: "Neuroscience News", topic: "psychology" },
      { title: "Эффект Зейгарник: почему незаконченное запоминается", description: "Мозг лучше помнит прерванные задачи — используйте это для мотивации", link: "#", source: "Когнитивная психология", topic: "psychology" },
    ],
    habits: [
      { title: "Стекирование привычек: привяжи новое к старому", description: "После [существующая привычка] я буду [новая привычка]. Простая формула успеха.", link: "#", source: "James Clear", topic: "habits" },
      { title: "21 день — миф. Сколько реально нужно?", description: "Исследование UCL: в среднем 66 дней на формирование автоматической привычки", link: "#", source: "European Journal of Social Psychology", topic: "habits" },
    ],
  };
  return content[topic] || content.motivation;
}

export default RSSFeed;
