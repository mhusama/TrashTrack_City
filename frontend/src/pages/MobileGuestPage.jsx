import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, MapPin, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Report on the map",
    text: "Pin waste issues anywhere in Dhaka with your phone's location.",
  },
  {
    icon: Camera,
    title: "Photo evidence",
    text: "Snap or upload photos so crews know exactly what to clean up.",
  },
  {
    icon: Shield,
    title: "Track your reports",
    text: "Sign in to follow status updates from open to resolved.",
  },
];

export default function MobileGuestPage() {
  return (
    <div className="mobile-guest-page -mx-4 -mt-4 text-black">
      <section className="mobile-guest-hero px-4 pb-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 text-center"
        >
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[#6b0f1a]/20 bg-[#fce1ee] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#6b0f1a]">
              <Sparkles className="h-3.5 w-3.5" />
              Dhaka waste reporting
            </p>
            <h1 className="text-3xl font-bold leading-tight text-[#6b0f1a]">
              Keep your city clean
            </h1>
            <p className="mx-auto max-w-sm text-base text-black/80">
              Report overflow bins, illegal dumps, and missed pickups — right from your phone.
            </p>
          </div>
          <div className="flex flex-col gap-3 px-2">
            <Link to="/register" className="mobile-guest-cta mobile-guest-cta-primary">
              Create free account
            </Link>
            <Link to="/login" className="mobile-guest-cta">
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="space-y-3 px-4 pb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b0f1a]">
          How it works
        </h2>
        {features.map(({ icon: Icon, title, text }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * (i + 1) }}
            className="mobile-guest-feature card flex gap-4 p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fce1ee] text-[#6b0f1a]">
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-semibold text-[#6b0f1a]">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-black/80">{text}</p>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="mobile-guest-footer px-4 pb-6 text-center">
        <p className="text-sm text-black/70">
          Already helping your neighborhood?
        </p>
        <Link to="/login" className="link-inline mt-2 inline-block text-sm font-semibold">
          Sign in to your account
        </Link>
      </section>
    </div>
  );
}
