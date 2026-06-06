import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Shield, Zap } from "lucide-react";
import LandingHeroBanner from "../components/LandingHeroBanner.jsx";

const features = [
  {
    icon: MapPin,
    title: "Map reports",
    text: "Pin overflow bins, illegal dumps, and missed pickups on the Dhaka city map.",
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
    <div className="space-y-16 pb-8 pt-0 text-center text-black">
      <LandingHeroBanner />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h1 className="text-4xl font-bold tracking-tight text-[#6b0f1a] sm:text-5xl">
          Keep your city clean
        </h1>
        <p className="mx-auto max-w-xl text-lg text-black">
          TrashTrack City helps you report and track waste issues across Dhaka.
        </p>
        <div className="landing-hero-cta-row flex flex-wrap justify-center gap-4">
          <Link to="/register" className="guest-cta-btn landing-hero-cta">
            Get started
          </Link>
          <Link to="/login" className="guest-cta-btn landing-hero-cta">
            Sign in
          </Link>
          <Link to="/contact" className="guest-cta-btn landing-hero-cta">
            Contact us
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
            className="card p-6"
          >
            <Icon className="mb-3 h-8 w-8 text-[#6b0f1a]" />
            <h3 className="text-lg font-semibold text-[#6b0f1a]">{title}</h3>
            <p className="mt-2 text-lg text-black">{text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
