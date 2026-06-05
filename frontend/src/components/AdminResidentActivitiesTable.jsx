import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../api/client.js";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "blocked", label: "Blocked" },
  { value: "unblocked", label: "Unblocked" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_rejected", label: "Most Rejected" },
  { value: "lowest_rating", label: "Lowest Rating" },
];

function filterResidentActivities(activities, filterMode) {
  switch (filterMode) {
    case "blocked":
      return activities.filter((a) => a.blocked);
    case "unblocked":
      return activities.filter((a) => !a.blocked);
    case "all":
    default:
      return activities;
  }
}

function formatAcceptedRejected(accepted, rejected) {
  return `${accepted} accepted / ${rejected} rejected`;
}

function formatAverageRating(value, reviewsGivenCount) {
  if (!reviewsGivenCount) return "—";
  return `${Number(value).toFixed(1)} / 5 (${reviewsGivenCount} review${reviewsGivenCount !== 1 ? "s" : ""})`;
}

function sortResidentActivities(activities, sortMode) {
  const list = [...activities];

  switch (sortMode) {
    case "oldest":
      return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    case "most_rejected":
      return list.sort((a, b) => {
        const diff = (b.reportsRejected || 0) - (a.reportsRejected || 0);
        if (diff !== 0) return diff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    case "lowest_rating":
      return list.sort((a, b) => {
        const aHas = (a.reviewsGivenCount || 0) > 0;
        const bHas = (b.reviewsGivenCount || 0) > 0;
        if (!aHas && !bHas) return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (!aHas) return 1;
        if (!bHas) return -1;
        const diff =
          (a.averageReviewRatingGiven || 0) - (b.averageReviewRatingGiven || 0);
        if (diff !== 0) return diff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    case "newest":
    default:
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

function FilterDropdown({ filterMode, onFilterChange }) {
  const [open, setOpen] = useState(false);
  const activeLabel = filterMode !== "all"
    ? FILTER_OPTIONS.find((o) => o.value === filterMode)?.label
    : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sort-by-trigger flex items-center gap-2 rounded-lg border border-theme-border bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
      >
        Status
        {activeLabel && (
          <span className="text-xs font-normal opacity-80">({activeLabel})</span>
        )}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1090] cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-[1100] mt-1 min-w-[200px] rounded-lg border border-theme-border bg-white py-1 shadow-lg">
            {FILTER_OPTIONS.filter((o) => o.value !== "all").map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onFilterChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
                  filterMode === option.value ? "bg-[#6b0f1a] text-white" : "text-black"
                }`}
              >
                {option.label}
              </button>
            ))}
            {filterMode !== "all" && (
              <>
                <hr className="my-1 border-theme-border" />
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange("all");
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
                >
                  All
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SortDropdown({ sortMode, onSortChange }) {
  const [open, setOpen] = useState(false);
  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortMode)?.label || "Newest";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sort-by-trigger flex items-center gap-2 rounded-lg border border-theme-border bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
      >
        {currentLabel}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1090] cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-[1100] mt-1 min-w-[200px] rounded-lg border border-theme-border bg-white py-1 shadow-lg">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
                  sortMode === option.value ? "bg-[#6b0f1a] text-white" : "text-black"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminResidentActivitiesTable() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockingId, setBlockingId] = useState(null);
  const [filterMode, setFilterMode] = useState("all");
  const [sortMode, setSortMode] = useState("newest");

  const load = () => {
    adminApi
      .listResidentActivities()
      .then((res) => setActivities(res.data.activities))
      .catch(() => toast.error("Failed to load resident activities"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  const displayedActivities = useMemo(() => {
    const filtered = filterResidentActivities(activities, filterMode);
    return sortResidentActivities(filtered, sortMode);
  }, [activities, filterMode, sortMode]);

  const handleToggleBlock = async (activity) => {
    const nextBlocked = !activity.blocked;
    const action = nextBlocked ? "block" : "unblock";
    if (
      !window.confirm(
        `${nextBlocked ? "Block" : "Unblock"} resident ${activity.residentId}? They will ${
          nextBlocked ? "not be able to log in or post reports/reviews" : "regain access"
        }.`
      )
    ) {
      return;
    }

    setBlockingId(activity.residentUserId);
    try {
      await adminApi.setResidentBlocked(activity.residentUserId, nextBlocked);
      toast.success(nextBlocked ? "Resident blocked" : "Resident unblocked");
      setActivities((prev) =>
        prev.map((row) =>
          row.residentUserId === activity.residentUserId
            ? { ...row, blocked: nextBlocked }
            : row
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not ${action} resident`);
    } finally {
      setBlockingId(null);
    }
  };

  if (loading) {
    return <p className="text-black">Loading resident activities…</p>;
  }

  if (activities.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
        No resident activities yet. Reports and reviews will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-black">Filter</span>
          <FilterDropdown filterMode={filterMode} onFilterChange={setFilterMode} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-black">Sort by</span>
          <SortDropdown sortMode={sortMode} onSortChange={setSortMode} />
        </div>
      </div>

      {displayedActivities.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme-border p-8 text-center text-black">
          No activities match this filter.
        </p>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-theme-border bg-[#fce1ee]/40 text-xs uppercase tracking-wide text-[#6b0f1a]">
              <th className="px-4 py-3 font-semibold">Resident ID</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Accepted / Rejected Reports</th>
              <th className="px-4 py-3 font-semibold">Average Review Rating</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedActivities.map((activity) => (
              <tr
                key={activity._id}
                className={`border-b border-theme-border hover:bg-[#fce1ee]/20 ${
                  activity.blocked ? "bg-red-50/40" : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs text-[#6b0f1a]">
                  {activity.residentId || "—"}
                </td>
                <td className="px-4 py-3 text-black">{activity.activity}</td>
                <td className="px-4 py-3 text-black/80">
                  {new Date(activity.date).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-black">
                  {formatAcceptedRejected(activity.reportsAccepted, activity.reportsRejected)}
                </td>
                <td className="px-4 py-3 text-black">
                  {formatAverageRating(
                    activity.averageReviewRatingGiven,
                    activity.reviewsGivenCount
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={blockingId === activity.residentUserId}
                    onClick={() => handleToggleBlock(activity)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                      activity.blocked
                        ? "border border-green-600 text-green-700 hover:bg-green-50"
                        : "border border-red-600 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {blockingId === activity.residentUserId
                      ? "…"
                      : activity.blocked
                        ? "Unblock"
                        : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
