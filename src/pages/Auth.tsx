import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap } from "lucide-react";
import ParticleField from "@/components/ParticleField";
import { lovable } from "@/integrations/lovable/index";
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground font-mono">или</span>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              setGeneralError("");
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                setGeneralError(result.error.message);
              }
            }}
            className="w-full py-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 text-foreground font-semibold text-sm transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Войти через Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
