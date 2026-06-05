import { motion } from "framer-motion";
import SmartHeatmapVisualization from "./SmartHeatmapVisualization.jsx";

export default function StatisticsPanel({ title = "Statistics" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="stats-panel-wrap w-full min-w-0 space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-black">{title}</h2>
        <p className="mt-1 text-sm text-neutral-700">
          Smart heatmap visualization of complaint density across Dhaka — filter by report category,
          time, and severity.
        </p>
      </div>
      <SmartHeatmapVisualization />
    </motion.section>
  );
}
