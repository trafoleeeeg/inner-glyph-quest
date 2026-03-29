import { motion } from "framer-motion";
import FogOfWarMap from "@/components/FogOfWarMap";
import LifeBalanceChart from "@/components/LifeBalanceChart";
import BottomNav from "@/components/BottomNav";

const MapPage = () => {
  return (
    <div className="min-h-screen bg-background relative pb-20">
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-xl font-bold text-primary text-glow-primary font-display">Карта Сознания</h1>
          <p className="text-[10px] text-muted-foreground font-mono">
            рассеивай туман • балансируй сферы • наращивай ясность
          </p>
        </motion.div>

        <FogOfWarMap />
        <LifeBalanceChart />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-4"
        >
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            чем больше данных — тем яснее картина
          </p>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default MapPage;
