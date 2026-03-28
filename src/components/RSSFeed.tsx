import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Rss, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";

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
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("rss-content", {
        body: { topic: activeTopic },
      });
      if (fnError) throw fnError;
      setItems(data?.items || []);
    } catch {
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
            onClick={() => { setActiveTopic(topic.id); setExpandedItem(null); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all ${
              activeTopic === topic.id
                ? "bg-accent/15 text-accent border border-accent/25"
                : "text-muted-foreground bg-muted/10 border border-transparent hover:border-border/20"
            }`}>
            <span>{topic.emoji}</span> {topic.label}
          </motion.button>
        ))}
      </div>

      {/* Content — all inline, no external links */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTopic} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-2">
            {items.map((item, i) => {
              const isExpanded = expandedItem === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl border border-border/20 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : i)}
                    className="w-full p-3 text-left flex items-start gap-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground line-clamp-2">{item.title}</p>
                      {!isExpanded && item.description && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                      )}
                      <p className="text-[9px] font-mono text-muted-foreground/60 mt-1">{item.source}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-border/10 pt-2">
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// Fallback content — shown inline, no external links
function getFallbackContent(topic: string): RSSItem[] {
  const content: Record<string, RSSItem[]> = {
    motivation: [
      { title: "Как маленькие победы создают большие перемены", description: "Исследования показывают: празднование мелких достижений усиливает мотивацию на 34%. Когда ты фиксируешь каждый шаг — мозг выделяет дофамин, создавая петлю положительного подкрепления. Не жди «большого прорыва» — начни отмечать то, что уже делаешь каждый день.", link: "#", source: "Наука мотивации", topic: "motivation" },
      { title: "Правило 2 минут: начни с малого", description: "Если действие занимает меньше 2 минут — сделай прямо сейчас. Это ключ к привычкам. Принцип работает потому что самый сложный шаг — начать. Когда ты разрешаешь себе делать всего 2 минуты, порог входа исчезает.", link: "#", source: "Atomic Habits", topic: "motivation" },
      { title: "Почему дисциплина важнее мотивации", description: "Мотивация приходит и уходит — это эмоция, а не стратегия. Дисциплина — это система: ты делаешь действие не потому что хочешь, а потому что это часть твоей идентичности. Исследования показывают, что люди с высоким самоконтролем реже используют силу воли — они просто создали правильные условия.", link: "#", source: "Психология успеха", topic: "motivation" },
    ],
    mindfulness: [
      { title: "5 минут осознанности меняют химию мозга", description: "Регулярная медитация снижает кортизол (гормон стресса) на 23% и увеличивает объём префронтальной коры — зоны, отвечающей за решения и самоконтроль. Начни с 5 минут тихого сидения с фокусом на дыхании. Через 8 недель сканирование мозга покажет физические изменения.", link: "#", source: "Нейронаука", topic: "mindfulness" },
      { title: "Body scan: техника сканирования тела", description: "Простая практика: закрой глаза, мысленно «просканируй» тело от макушки до стоп. Замечай напряжение, не пытаясь его менять. За 3 минуты ты снимешь до 40% физического напряжения и вернёшь контакт с телом.", link: "#", source: "Mindful Practice", topic: "mindfulness" },
    ],
    productivity: [
      { title: "Deep Work: как войти в поток за 15 минут", description: "Кэл Ньюпорт выделяет 4 правила для глубокой концентрации: 1) Работай в ритуале — одно место, одно время. 2) Обними скуку — не хватайся за телефон в очереди. 3) Уходи из соцсетей на рабочее время. 4) Сжимай несущественное — email не срочен.", link: "#", source: "Deep Work", topic: "productivity" },
      { title: "Метод помидора 2.0: адаптируй под себя", description: "Классические 25/5 не для всех. Эксперименты показывают оптимальные циклы: 52 мин работы / 17 мин отдыха для аналитической работы, 25/5 для рутинных задач, 90/20 для творческих проектов. Найди свой ритм через 2 недели экспериментов.", link: "#", source: "Productivity Science", topic: "productivity" },
    ],
    fitness: [
      { title: "7-минутная тренировка с научной базой", description: "HIIT за 7 минут даёт эффект часовой кардио-сессии — доказано журналом ACSM. 12 упражнений по 30 секунд с 10-секундными перерывами. Используй собственный вес: приседания, отжимания, планка, выпады. Делай каждый день — и через месяц заметишь разницу в выносливости.", link: "#", source: "ACSM Journal", topic: "fitness" },
      { title: "Ходьба: недооценённый инструмент здоровья", description: "Новые исследования показали: даже 4400 шагов в день значительно снижают риск сердечно-сосудистых заболеваний. Не гонись за 10 000 — начни с 15-минутной прогулки после обеда. Ходьба также снижает кортизол и улучшает творческое мышление на 60%.", link: "#", source: "Harvard Health", topic: "fitness" },
    ],
    psychology: [
      { title: "Нейропластичность: мозг меняется в любом возрасте", description: "Каждый раз, когда ты учишься чему-то новому, нейроны формируют новые связи. Это называется нейропластичность. Она не заканчивается в детстве — мозг адаптируется всю жизнь. Ключ: повторение + эмоциональная вовлечённость. Именно поэтому привычки, привязанные к смыслу, укореняются быстрее.", link: "#", source: "Neuroscience News", topic: "psychology" },
      { title: "Эффект Зейгарник: почему незаконченное помнится", description: "Мозг лучше помнит прерванные задачи — они создают «открытый цикл» в сознании, который требует закрытия. Используй это: начни задачу на 2 минуты и прерви — мозг будет тянуть тебя завершить. Это мощный трюк против прокрастинации.", link: "#", source: "Когнитивная психология", topic: "psychology" },
    ],
    habits: [
      { title: "Стекирование привычек: привяжи новое к старому", description: "Формула: «После [существующая привычка] я буду [новая привычка]». Например: после того как налью кофе — запишу 3 благодарности. Привязка к существующему триггеру снижает когнитивную нагрузку на 47% и повышает вероятность выполнения.", link: "#", source: "James Clear", topic: "habits" },
      { title: "66 дней — реальный срок формирования привычки", description: "Миф о 21 дне опровергнут исследованием UCL (University College London). В среднем нужно 66 дней, чтобы действие стало автоматическим. Но диапазон — от 18 до 254 дней, в зависимости от сложности. Не сдавайся на 3-й неделе — ты только на полпути.", link: "#", source: "European Journal of Social Psychology", topic: "habits" },
    ],
  };
  return content[topic] || content.motivation;
}

export default RSSFeed;
