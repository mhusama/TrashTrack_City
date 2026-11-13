import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import ContactUsForm from "../components/ContactUsForm.jsx";
import { homePathForRole } from "../config/roles.js";

export default function ContactUsPage() {
  const { user } = useAuth();
  const dashboardPath = user ? homePathForRole(user.role, user.crewSubRole) : "/";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl space-y-4 px-1 sm:px-0"
    >
      <div>
        <Link
          to={dashboardPath}
          className="text-sm font-medium text-[#6b0f1a] hover:underline"
        >
          ← Back
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-black">Contact us</h1>
        <p className="mt-2 text-sm text-black/80">
          Questions, feedback, or issues with TrashTrack City? Send us a message and our
          admin team will respond by email
          {user ? " and in your notifications" : ""}.
        </p>
      </div>

      <div className="card p-3 sm:p-4 bg-[#fdf2f4] border border-[#fce1ee] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg">
        <div>
          <p className="text-sm font-semibold text-[#6b0f1a]">Official City Sanitation Survey</p>
          <p className="text-xs text-black/70">Rate waste collection and STS bin clearance in your ward via our embedded municipal portal.</p>
        </div>
        <Link
          to="/survey"
          className="shrink-0 px-3 py-1.5 bg-[#6b0f1a] text-white rounded text-xs font-medium hover:bg-[#851320] transition"
        >
          Open City Survey →
        </Link>
      </div>

      <section className="card p-4 sm:p-6">
        <ContactUsForm user={user} showHistory={Boolean(user)} />
      </section>
    </motion.div>
  );
}
