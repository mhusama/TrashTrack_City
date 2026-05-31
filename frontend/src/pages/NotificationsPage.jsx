import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { notificationsApi } from "../api/client.js";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi
      .list()
      .then((res) => setNotifications(res.data.notifications))
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));

    notificationsApi.markRead().catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="card p-6">
        <h1 className="text-2xl font-bold text-[#6b0f1a]">Notifications</h1>
        <p className="mt-2 text-black">
          Updates about your reports, nearby issues, and similar locations in Dhaka.
        </p>
      </section>

      <section className="card p-6">
        {loading ? (
          <p className="text-black">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
            No notifications yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`rounded-lg border border-theme-border p-4 text-sm text-black ${
                  n.read ? "bg-white" : "bg-[#fce1ee]"
                }`}
              >
                <p>{n.message}</p>
                <p className="mt-2 text-xs text-black/70">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  );
}
