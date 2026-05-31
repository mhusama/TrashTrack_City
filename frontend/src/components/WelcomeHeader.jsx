import { motion } from "framer-motion";
import NotificationBell from "./NotificationBell.jsx";

export default function WelcomeHeader({ name, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-black">Welcome back, {name}</h1>
          {subtitle && <p className="mt-2 text-black">{subtitle}</p>}
          {children}
        </div>
        <NotificationBell />
      </div>
    </motion.div>
  );
}
