import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../config/roles.js";

// FAULTY VERSION FOR TESTING:
// The embedded iframe points to /city-survey_noconfirm.html
// which intentionally OMITS the window.confirm("Confirm Review?") dialog.
// This will cause TC08 ("Confirm Review?") to FAIL in automated tests!
export default function CitySurveyPage() {
  const { user } = useAuth();
  const dashboardPath = user ? homePathForRole(user.role, user.crewSubRole) : "/";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-3xl space-y-4 px-1 sm:px-0 pb-12"
    >
      <div>
        <Link
          to={dashboardPath}
          className="text-sm font-medium text-[#6b0f1a] hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <h1
          id="survey-parent-title"
          className="mt-3 text-2xl font-bold text-black"
        >
          Resident Community & Ward Survey (Faulty - No Confirm)
        </h1>
        <p
          id="survey-parent-desc"
          className="mt-1 text-sm text-black/80"
        >
          Directly provide feedback on municipal waste collection schedules, secondary transfer stations (STS), and street cleanliness in your ward.
        </p>
      </div>

      {/* Embedded Municipal Survey IFrame pointing to the faulty version */}
      <section className="card p-3 sm:p-5 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            External Municipal Feedback Service
          </span>
          <span className="text-xs bg-red-100 text-red-800 font-medium px-2 py-0.5 rounded">
            Faulty Portal (No Confirm Dialog)
          </span>
        </div>

        <iframe
          id="city-survey-iframe"
          name="city-survey-iframe"
          src="/city-survey_noconfirm.html"
          title="City Cleanliness Survey"
          className="w-full h-[580px] border border-gray-200 rounded-md bg-gray-50"
        />
      </section>
    </motion.div>
  );
}
