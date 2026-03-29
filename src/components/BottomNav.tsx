import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Compass, MessageCircle, User, Users } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Хаб" },
  { path: "/feed", icon: Compass, label: "Лента" },
  { path: "/messages", icon: MessageCircle, label: "Чаты" },
  { path: "/tribes", icon: Users, label: "Племена" },
  { path: "/profile", icon: User, label: "Я" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      id="tutorial-nav"
      className="fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around h-12">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button key={path} onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
