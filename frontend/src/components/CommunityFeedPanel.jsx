import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { communityFeedApi } from "../api/client.js";
import ReviewCommentsSection from "./ReviewCommentsSection.jsx";
import SortByDropdown from "./SortByDropdown.jsx";
import StarRating from "./StarRating.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../config/roles.js";
import { mediaUrl } from "../utils/mediaUrl.js";
import { filterFeedItems, getFilterLabel } from "../utils/reportFilters.js";

function FeedItem({ item, backPath }) {
  return (
    <article className="rounded-xl border border-theme-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-black">{item.title}</h3>
          {item.reportId && (
            <p className="text-xs text-black/60">Report ID: {item.reportId}</p>
          )}
        </div>
        <p className="text-xs text-black/60">
          {new Date(item.feedback.submittedAt).toLocaleString()}
        </p>
      </div>

      <p className="mt-2 text-sm text-black/70">
        Review by <strong>{item.reviewerName}</strong>
        {item.assignedTeamDisplay && (
          <>
            {" "}
            · Team: <strong>{item.assignedTeamDisplay}</strong>
          </>
        )}
      </p>

      <div className="mt-3">
        <StarRating value={item.feedback.rating} readOnly />
      </div>

      {item.feedback.comment && (
        <p className="mt-3 text-sm text-black">{item.feedback.comment}</p>
      )}

      {item.feedback.photoUrl && (
        <img
          src={mediaUrl(item.feedback.photoUrl)}
          alt=""
          className="mt-3 max-h-48 rounded-lg border object-cover"
        />
      )}

      <ReviewCommentsSection
        reportId={item._id}
        comments={item.comments}
        backPath={backPath}
        backLabel="Back to Community Feed"
        className="mt-4"
      />
    </article>
  );
}

export default function CommunityFeedPanel() {
  const { user } = useAuth();
  const backPath = user ? homePathForRole(user.role, user.crewSubRole) : "/";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState({ type: "all" });
  const [now, setNow] = useState(() => new Date());

  const load = () => {
    communityFeedApi
      .list()
      .then((res) => setItems(res.data.items))
      .catch(() => toast.error("Failed to load community feed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const refreshTimer = setInterval(load, 30_000);
    const clockTimer = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const filteredItems = useMemo(
    () => filterFeedItems(items, sortMode, now),
    [items, sortMode, now]
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-black">Community Feed</h2>
        <p className="mt-1 text-sm text-black/70">
          Public reviews from residents across the city. Reply as a resident, admin, or crew
          member.
        </p>
      </div>

      <div className="dashboard-sort-slot relative z-[1000]">
        <SortByDropdown sortMode={sortMode} onSortChange={setSortMode} />
      </div>

      {sortMode.type !== "all" && (
        <p className="text-sm font-medium text-[#6b0f1a]">
          {getFilterLabel(sortMode)} ({filteredItems.length} review
          {filteredItems.length !== 1 ? "s" : ""})
        </p>
      )}

      {loading ? (
        <p className="text-black">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
          No reviews yet. When residents rate resolved reports, they will appear here.
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
          No reviews match this filter.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <FeedItem key={item._id} item={item} backPath={backPath} />
          ))}
        </div>
      )}
    </section>
  );
}
