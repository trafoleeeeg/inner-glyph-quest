import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap } from "lucide-react";
import ParticleField from "@/components/ParticleField";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Некорректный email").max(255),
  password: z.string().min(6, "Минимум 6 символов").max(100),
});

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Минимум 2 символа").max(30, "Максимум 30 символов"),
  email: z.string().trim().email("Некорректный email").max(255),
  password: z.string()
    .min(8, "Минимум 8 символов")
    .max(100, "Максимум 100 символов")
    .regex(/[A-Z]/, "Нужна хотя бы одна заглавная буква")
    .regex(/[a-z]/, "Нужна хотя бы одна строчная буква")
    .regex(/[0-9]/, "Нужна хотя бы одна цифра"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const validate = (): boolean => {
    setErrors({});
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ displayName: displayName || "Нейронавт", email, password });
      }
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          const field = e.path[0] as string;
          fieldErrors[field] = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = isLogin
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, displayName.trim() || "Нейронавт");
      if (result.error) {
        setGeneralError(result.error.message);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-destructive text-[11px] font-mono mt-1">{errors[field]}</motion.p>;
  };

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden flex items-center justify-center">
      <ParticleField />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 w-full max-w-md mx-4">
        
        {/* Logo */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary text-glow-primary font-display tracking-tight">NEURO.LOG</h1>
          </div>
          <p className="text-xs text-muted-foreground font-mono">система оцифровки нейроинтерфейса</p>
        </motion.div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-primary/10">
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-6">
            {["Вход", "Регистрация"].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setErrors({}); setGeneralError(""); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  (i === 0 ? isLogin : !isLogin) ? "bg-primary/20 text-primary border border-primary/20 glow-primary" : "text-muted-foreground hover:text-foreground"
                }`}>{tab}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Позывной</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Нейронавт" maxLength={30}
                    className={`w-full bg-muted/50 border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${errors.displayName ? 'border-destructive/50' : 'border-border/50 focus:border-primary/50'}`} />
                  <FieldError field="displayName" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="neuro@log.app" maxLength={255}
                className={`w-full bg-muted/50 border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${errors.email ? 'border-destructive/50' : 'border-border/50 focus:border-primary/50'}`} />
              <FieldError field="email" />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Пароль</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" maxLength={100}
                  className={`w-full bg-muted/50 border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all pr-10 ${errors.password ? 'border-destructive/50' : 'border-border/50 focus:border-primary/50'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError field="password" />
              {!isLogin && !errors.password && (
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">8+ символов, заглавная, строчная, цифра</p>
              )}
            </div>

            {generalError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-xs font-mono">{generalError}</motion.p>
            )}

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground font-semibold text-sm transition-all glow-primary disabled:opacity-50">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Загрузка...
                </span>
              ) : isLogin ? "Войти в систему" : "Создать аккаунт"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
