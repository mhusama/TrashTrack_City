import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DHAKA_AREAS } from "../config/dhakaAreas.js";

export const ADMIN_STATUS_LABELS = {
  all: "All statuses",
  open: "PENDING",
  in_progress: "UNDER REVIEW",
  resolved: "RESOLVED",
  rejected: "REJECTED",
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "rejected"];

const SORT_ORDER_LABELS = {
  newest: "Newest",
  oldest: "Oldest",
};

function FilterButton({ label, activeLabel, open, onToggle, onClose, align = "left", children }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="sort-by-trigger flex items-center gap-2 rounded-lg border border-theme-border bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
      >
        {label}
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
            onClick={onClose}
          />
          <div
            className={`absolute top-full z-[1100] mt-1 max-h-52 min-w-[200px] overflow-y-auto rounded-lg border border-theme-border bg-white py-1 shadow-lg ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminTableFilters({
  areaFilter,
  statusFilter,
  sortOrder,
  onAreaChange,
  onStatusChange,
  onSortOrderChange,
}) {
  const [areaOpen, setAreaOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const closeAll = () => {
    setAreaOpen(false);
    setStatusOpen(false);
    setSortOpen(false);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-black">Filter</span>
        <div className="flex flex-wrap items-center gap-2">
        <FilterButton
          label="Area"
          activeLabel={areaFilter !== "all" ? areaFilter : null}
          open={areaOpen}
          onToggle={() => {
            setStatusOpen(false);
            setSortOpen(false);
            setAreaOpen((v) => !v);
          }}
          onClose={closeAll}
        >
          {DHAKA_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => {
                onAreaChange(area);
                setAreaOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
                areaFilter === area ? "bg-[#6b0f1a] text-white" : "text-black"
              }`}
            >
              {area}
            </button>
          ))}
          {areaFilter !== "all" && (
            <>
              <hr className="my-1 border-theme-border" />
              <button
                type="button"
                onClick={() => {
                  onAreaChange("all");
                  setAreaOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
              >
                All areas
              </button>
            </>
          )}
        </FilterButton>

        <FilterButton
          label="Status"
          activeLabel={
            statusFilter !== "all" ? ADMIN_STATUS_LABELS[statusFilter] : null
          }
          open={statusOpen}
          onToggle={() => {
            setAreaOpen(false);
            setSortOpen(false);
            setStatusOpen((v) => !v);
          }}
          onClose={closeAll}
        >
          {STATUS_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onStatusChange(value);
                setStatusOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
                statusFilter === value ? "bg-[#6b0f1a] text-white" : "text-black"
              }`}
            >
              {ADMIN_STATUS_LABELS[value]}
            </button>
          ))}
          {statusFilter !== "all" && (
            <>
              <hr className="my-1 border-theme-border" />
              <button
                type="button"
                onClick={() => {
                  onStatusChange("all");
                  setStatusOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
              >
                All statuses
              </button>
            </>
          )}
        </FilterButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-black">Sort by</span>
        <FilterButton
          label={SORT_ORDER_LABELS[sortOrder] || "Newest"}
          open={sortOpen}
          align="right"
          onToggle={() => {
            setAreaOpen(false);
            setStatusOpen(false);
            setSortOpen((v) => !v);
          }}
          onClose={closeAll}
        >
          {(["newest", "oldest"]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onSortOrderChange(value);
                setSortOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
                sortOrder === value ? "bg-[#6b0f1a] text-white" : "text-black"
              }`}
            >
              {SORT_ORDER_LABELS[value]}
            </button>
          ))}
        </FilterButton>
      </div>
    </div>
  );
}
