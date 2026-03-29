import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import AnalyticsCharts from "@/components/AnalyticsCharts";

const HubAnalytics = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-4 border-b border-border">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Аналитика</h2>
        </div>
        {expanded 
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> 
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-3"
          >
            <AnalyticsCharts />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HubAnalytics;
