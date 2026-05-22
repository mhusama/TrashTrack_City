import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Map reports",
    text: "Pin overflow bins, illegal dumps, and missed pickups on an interactive city map.",
  },
  {
    icon: Shield,
    title: "Secure accounts",
    text: "Residents sign in to submit reports; admins update status as crews respond.",
  },
  {
    icon: Zap,
    title: "Photo evidence",
    text: "Crop and attach photos so cleanup teams know exactly what to fix.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Keep your city <span className="text-brand-500">clean</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-slate-400">
          TrashTrack City is a sample MERN app for reporting and tracking waste issues
          across your neighborhood.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-700 px-6 py-3 text-slate-300 hover:bg-slate-800"
          >
            Sign in
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-6 text-left sm:grid-cols-3">
        {features.map(({ icon: Icon, title, text }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
          >
            <Icon className="mb-3 h-8 w-8 text-brand-500" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">{text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
