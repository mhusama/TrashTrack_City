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

      <section className="card p-4 sm:p-6">
        <ContactUsForm user={user} showHistory={Boolean(user)} />
      </section>
    </motion.div>
  );
}
