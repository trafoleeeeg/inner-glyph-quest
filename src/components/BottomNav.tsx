import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Compass, CheckSquare, Search, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Хаб" },
  { path: "/feed", icon: Compass, label: "Лента" },
  { path: "/tasks", icon: CheckSquare, label: "Задачи" },
  { path: "/search", icon: Search, label: "Поиск" },
  { path: "/profile", icon: User, label: "Я" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav initial={{ y: 100 }} animate={{ y: 0 }} id="tutorial-nav"
      className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/30 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button key={path} whileTap={{ scale: 0.9 }} onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
              <motion.div animate={isActive ? { y: -2 } : { y: 0 }}>
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className="text-[9px] font-mono">{label}</span>
              {isActive && (
                <motion.div layoutId="nav-indicator"
                  className="absolute -top-px h-0.5 w-8 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
