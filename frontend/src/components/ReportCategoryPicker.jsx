import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  REPORT_CATEGORY_GROUPS,
  categoryRequiresSubcategory,
  formatReportCategory,
} from "../config/reportCategories.js";

export default function ReportCategoryPicker({ category, subcategory, onChange, required = true }) {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
        setSubOpen(false);
        setHoveredCategory(null);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const activeGroup =
    REPORT_CATEGORY_GROUPS.find((group) => group.value === category) ||
    REPORT_CATEGORY_GROUPS.find((group) => group.value === hoveredCategory);

  const displayValue =
    category && (!categoryRequiresSubcategory(category) || subcategory)
      ? formatReportCategory(category, subcategory)
      : "";

  const handleCategorySelect = (value) => {
    if (categoryRequiresSubcategory(value)) {
      onChange({ category: value, subcategory: "" });
      setHoveredCategory(value);
      setSubOpen(true);
      return;
    }
    onChange({ category: value, subcategory: "" });
    setLoading(true);
    setTimeout(() => {
      setOpen(false);
      setSubOpen(false);
      setHoveredCategory(null);
      setLoading(false);
    }, 600);
  };

  const handleSubcategorySelect = (categoryValue, subValue) => {
    onChange({ category: categoryValue, subcategory: subValue });
    setLoading(true);
    setTimeout(() => {
      setOpen(false);
      setSubOpen(false);
      setHoveredCategory(null);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="block space-y-1">
      <span className="label-text">
        Category{required ? " *" : ""}
      </span>
      <div
        ref={pickerRef}
        className="report-category-picker relative z-[1000]"
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={loading}
          className="input-field flex w-full items-center justify-between text-left disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={displayValue ? "text-black" : "text-neutral-500"}>
            {displayValue || "Select a category"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-[1100] mt-1 flex items-start">
            <div className="min-w-[280px] rounded-lg border border-theme-border bg-white py-1 shadow-lg">
              {REPORT_CATEGORY_GROUPS.map((group, index) => (
                <div
                  key={group.value}
                  className="relative"
                  onMouseEnter={() => {
                    setHoveredCategory(group.value);
                    if (group.subcategories.length > 0) {
                      setSubOpen(true);
                    } else {
                      setSubOpen(false);
                    }
                  }}
                >
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleCategorySelect(group.value)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#6b0f1a] hover:text-white ${
                      category === group.value ? "bg-[#fce1ee] font-semibold text-[#6b0f1a]" : "text-black"
                    }`}
                  >
                    <span>
                      {index + 1}. {group.label}
                    </span>
                    {group.subcategories.length > 0 && <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>

            {subOpen && activeGroup?.subcategories?.length > 0 && (
              <div className="ml-1 max-h-64 min-w-[220px] overflow-y-auto rounded-lg border border-theme-border bg-white py-1 shadow-lg">
                {activeGroup.subcategories.map((sub) => (
                  <button
                    key={sub.value}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubcategorySelect(activeGroup.value, sub.value)}
                    className={`block w-full px-4 py-2 text-left text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#6b0f1a] hover:text-white ${
                      category === activeGroup.value && subcategory === sub.value
                        ? "bg-[#6b0f1a] text-white"
                        : "text-black"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
