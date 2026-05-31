import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DHAKA_AREAS } from "../config/dhakaAreas.js";

export default function SortByDropdown({ sortMode, onSortChange, menuOpensUp = false }) {
  const [open, setOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  const handleSelect = (mode) => {
    onSortChange(mode);
    setOpen(false);
    setAreaOpen(false);
  };

  return (
    <div
      className="sort-by-root relative z-[1000] inline-block text-left"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setAreaOpen(false);
      }}
    >
      <button
        type="button"
        className="sort-by-trigger flex items-center gap-2 rounded-lg border border-theme-border bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
      >
        Sort By
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div
          className={`sort-by-menu absolute left-0 z-[1100] min-w-[220px] rounded-lg border border-theme-border bg-white py-1 shadow-lg ${
            menuOpensUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div
            className="relative"
            onMouseEnter={() => setAreaOpen(true)}
            onMouseLeave={() => setAreaOpen(false)}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
            >
              Area
              <ChevronRight className="h-4 w-4" />
            </button>

            {areaOpen && (
              <div
                className={`sort-by-submenu absolute left-full z-[1200] ml-1 max-h-52 min-w-[180px] overflow-y-auto rounded-lg border border-theme-border bg-white py-1 shadow-lg ${
                  menuOpensUp ? "top-0" : "bottom-0"
                }`}
              >
                {DHAKA_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleSelect({ type: "area", area })}
                    className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
                      sortMode.type === "area" && sortMode.area === area
                        ? "bg-[#6b0f1a] text-white"
                        : "text-black"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSelect({ type: "recent" })}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
              sortMode.type === "recent" ? "bg-[#6b0f1a] text-white" : "text-black"
            }`}
          >
            Recent Reports
          </button>

          <button
            type="button"
            onClick={() => handleSelect({ type: "resolved" })}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
              sortMode.type === "resolved" ? "bg-[#6b0f1a] text-white" : "text-black"
            }`}
          >
            Resolved Reports
          </button>

          <button
            type="button"
            onClick={() => handleSelect({ type: "under_review" })}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#6b0f1a] hover:text-white ${
              sortMode.type === "under_review" ? "bg-[#6b0f1a] text-white" : "text-black"
            }`}
          >
            Under Review Reports
          </button>

          {sortMode.type !== "all" && (
            <>
              <hr className="my-1 border-theme-border" />
              <button
                type="button"
                onClick={() => handleSelect({ type: "all" })}
                className="block w-full px-4 py-2 text-left text-sm text-black transition-colors hover:bg-[#6b0f1a] hover:text-white"
              >
                Show all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
