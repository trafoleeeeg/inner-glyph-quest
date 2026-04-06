import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const PersonalityPrints = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchResults = async () => {
      const { data } = await (supabase as any)
        .from("personality_results")
        .select(`
          id,
          result_type,
          summary,
          personality_tests (title, icon)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
      if (data) setResults(data);
    };
    fetchResults();
  }, [user]);

  if (results.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 border border-border/50 text-center">
        <h3 className="text-sm font-semibold mb-2">Отпечатки личности</h3>
        <p className="text-xs text-muted-foreground mb-3">Пройдите тесты, чтобы узнать свои сильные стороны</p>
        <Link to="/tests" className="text-xs text-primary font-semibold">Перейти к тестам →</Link>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          🔮 Отпечатки личности
        </h3>
        <Link to="/tests" className="text-xs text-primary">Все тесты</Link>
      </div>
      <div className="space-y-2">
        {results.map((r: any, i: number) => (
          <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/30">
            <span className="text-2xl">{r.personality_tests?.icon}</span>
            <div>
              <p className="text-xs font-semibold text-foreground">{r.personality_tests?.title}</p>
              <p className="text-[10px] text-muted-foreground">{r.result_type}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default PersonalityPrints;
