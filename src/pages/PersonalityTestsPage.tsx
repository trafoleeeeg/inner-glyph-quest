import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface Test {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Question {
  id: string;
  question_text: string;
  options: { id: string; text: string; points_to: string }[];
}

const PersonalityTestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTests = async () => {
      setLoading(true);
      const [{ data: testsData }, { data: resultsData }] = await Promise.all([
        (supabase as any).from("personality_tests").select("*").order("created_at"),
        (supabase as any).from("personality_results").select("test_id").eq("user_id", user.id)
      ]);
      if (testsData) setTests(testsData as Test[]);
      if (resultsData) setCompletedTests(new Set(resultsData.map((r: any) => r.test_id)));
      setLoading(false);
    };
    fetchTests();
  }, [user]);

  const startTest = async (test: Test) => {
    setActiveTest(test);
    setCurrentQIndex(0);
    setAnswers({});
    const { data } = await (supabase as any)
      .from("personality_questions")
      .select("*")
      .eq("test_id", test.id)
      .order("order_index");
    if (data) setQuestions(data as unknown as Question[]);
  };

  const handleAnswer = async (pointsTo: string) => {
    const q = questions[currentQIndex];
    const newAnswers = { ...answers, [q.id]: pointsTo };
    setAnswers(newAnswers);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      const counts: Record<string, number> = {};
      Object.values(newAnswers).forEach(type => { counts[type] = (counts[type] || 0) + 1; });
      const resultType = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      
      if (user && activeTest) {
        await (supabase as any).from("personality_results").upsert({
          user_id: user.id, test_id: activeTest.id, result_type: resultType,
          summary: `Ты прошел тест "${activeTest.title}" и твой архетип: ${resultType}`
        }, { onConflict: 'user_id, test_id' });
        setCompletedTests(prev => new Set(prev).add(activeTest.id));
      }
      setActiveTest(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => activeTest ? setActiveTest(null) : navigate(-1)} className="text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">{activeTest ? activeTest.title : "Тесты личности"}</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!activeTest ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {loading ? <p className="text-center text-muted-foreground">Загрузка...</p> : tests.map(test => {
                const isCompleted = completedTests.has(test.id);
                return (
                  <motion.div key={test.id} whileTap={{ scale: 0.98 }} onClick={() => startTest(test)} className="glass-card p-5 rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors border border-border/50 flex items-center gap-4">
                    <span className="text-3xl">{test.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground flex items-center gap-2">{test.title} {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400" />}</p>
                      <p className="text-xs text-muted-foreground">{test.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {questions.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-xs text-muted-foreground">Вопрос {currentQIndex + 1} из {questions.length}</p>
                  <h2 className="text-lg font-bold text-foreground">{questions[currentQIndex].question_text}</h2>
                  <div className="space-y-3">
                    {questions[currentQIndex].options.map((opt, i) => (
                      <motion.button key={opt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} onClick={() => handleAnswer(opt.points_to)} className="w-full text-left p-4 rounded-xl border border-border/50 bg-muted/10 hover:bg-primary/10 hover:border-primary/30 transition-all font-medium text-sm text-foreground">
                        {opt.text}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : <p className="text-center text-muted-foreground">Загрузка вопросов...</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};
export default PersonalityTestsPage;
