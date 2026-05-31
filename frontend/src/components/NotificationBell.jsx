import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { notificationsApi } from "../api/client.js";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  const refreshCount = () => {
    notificationsApi
      .unreadCount()
      .then((res) => setCount(res.data.count))
      .catch(() => setCount(0));
  };

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Link
      to="/notifications"
      className="relative inline-flex shrink-0 items-center justify-center rounded-lg border border-theme-border p-2 text-[#6b0f1a] transition-colors hover:bg-[#fce1ee]"
      aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
      onClick={() => {
        setTimeout(refreshCount, 500);
      }}
    >
      <Bell className="h-6 w-6" strokeWidth={2} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6b0f1a] px-1 text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
