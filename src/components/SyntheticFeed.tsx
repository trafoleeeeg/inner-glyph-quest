import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lock, TrendingUp, Flame } from "lucide-react";

interface SyntheticAgent {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  streak: number;
  total_missions_completed: number;
  personality_type: string;
}

interface SyntheticPost {
  id: string;
  agent_id: string;
  content: string;
  post_type: string;
  likes_count: number;
  created_at: string;
  agent?: SyntheticAgent;
}

// Generate synthetic posts locally if DB is empty
const SYNTHETIC_CONTENT = [
  { name: "GHOST_071", type: "predator", level: 12, streak: 34, missions: 187, posts: [
    "Сегодня 5 из 5. Без исключений. 🔥",
    "Когнитивный шторм: переключился на dynamic_complexity — чувствую как мозг перестраивается.",
    "34 дня подряд. Кто-нибудь вообще здесь конкурирует?",
  ]},
  { name: "neural_drift", type: "predator", level: 8, streak: 19, missions: 94, posts: [
    "Physical shock в 6 утра перед работой. Мембрана восстановлена за 3 дня.",
    "Раньше думал что мотивация — это настроение. Теперь понимаю: это градиент.",
  ]},
  { name: "entropy_null", type: "prey", level: 5, streak: 7, missions: 41, posts: [
    "Первая неделя полного протокола. Ещё вчера хотел удалить. Сегодня — 4/4.",
    "Кто-то тут тоже застрял на фазе Голодания? Как выходили?",
  ]},
  { name: "sigma_loop", type: "predator", level: 15, streak: 52, missions: 312, posts: [
    "Алгоритм повысил сложность на 45%. Принято.",
    "52 дня. Глиф на пике. Жду следующую мутацию.",
    "Чем больше сопротивление — тем выше сжатие. Это не метафора.",
  ]},
  { name: "void_walker_x", type: "prey", level: 3, streak: 2, missions: 12, posts: [
    "Только начал. Сложно, но Глиф уже заметно изменился.",
    "Протокол восстановления мембраны — спас от срыва.",
  ]},
];

const SyntheticFeed = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<SyntheticAgent[]>([]);
  const [posts, setPosts] = useState<SyntheticPost[]>([]);

  useEffect(() => {
    const loadAgents = async () => {
      const { data: dbAgents } = await supabase.from('synthetic_agents').select('*').eq('is_active', true);
      
      if (dbAgents && dbAgents.length > 0) {
        setAgents(dbAgents);
        const { data: dbPosts } = await supabase
          .from('synthetic_posts')
          .select('*')
          .in('agent_id', dbAgents.map(a => a.id))
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (dbPosts) {
          const agentMap = new Map(dbAgents.map(a => [a.id, a]));
          setPosts(dbPosts.map(p => ({ ...p, agent: agentMap.get(p.agent_id) })));
        }
      } else {
        // Generate local synthetic content
        const localPosts: SyntheticPost[] = [];
        const localAgents: SyntheticAgent[] = [];
        
        SYNTHETIC_CONTENT.forEach((s, si) => {
          const agentId = `synth-${si}`;
          const agent: SyntheticAgent = {
            id: agentId,
            display_name: s.name,
            avatar_url: null,
            bio: null,
            level: s.level,
            streak: s.streak,
            total_missions_completed: s.missions,
            personality_type: s.type,
          };
          localAgents.push(agent);
          
          s.posts.forEach((content, pi) => {
            const hoursAgo = Math.floor(Math.random() * 48) + 1;
            localPosts.push({
              id: `synth-post-${si}-${pi}`,
              agent_id: agentId,
              content,
              post_type: 'motivation',
              likes_count: Math.floor(Math.random() * 30) + 3,
              created_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
              agent,
            });
          });
        });
        
        localPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAgents(localAgents);
        setPosts(localPosts);
      }
    };
    
    loadAgents();
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'только что';
    if (hours < 24) return `${hours}ч`;
    return `${Math.floor(hours / 24)}д`;
  };

  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      {posts.map((post, i) => (
        <motion.div key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card rounded-xl p-3.5 border border-border/20"
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="w-9 h-9 border border-primary/20">
                <AvatarFallback className="bg-muted/40 text-muted-foreground text-[9px] font-mono">
                  {post.agent?.display_name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Closed profile indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-background border border-border/30 flex items-center justify-center">
                <Lock className="w-2 h-2 text-muted-foreground/50" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-semibold text-foreground">{post.agent?.display_name}</span>
                <span className="text-[8px] font-mono text-muted-foreground/50">
                  Lv.{post.agent?.level}
                </span>
                {(post.agent?.streak ?? 0) > 10 && (
                  <span className="flex items-center gap-0.5 text-[8px] font-mono text-accent">
                    <Flame className="w-2.5 h-2.5" />{post.agent?.streak}
                  </span>
                )}
                {post.agent?.personality_type === 'predator' && (
                  <TrendingUp className="w-3 h-3 text-destructive/40" />
                )}
                <span className="text-[8px] text-muted-foreground/30 ml-auto">{timeAgo(post.created_at)}</span>
              </div>
              
              <p className="text-xs text-foreground/80 leading-relaxed">{post.content}</p>
              
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[9px] text-muted-foreground/40 font-mono">
                  ♡ {post.likes_count}
                </span>
                <span className="text-[8px] text-muted-foreground/20 font-mono">
                  {post.agent?.total_missions_completed} привычек
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SyntheticFeed;
