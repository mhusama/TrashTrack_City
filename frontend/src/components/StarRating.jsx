import { Star } from "lucide-react";

export default function StarRating({ value, onChange, readOnly = false, size = "md" }) {
  const iconClass = size === "lg" ? "h-9 w-9" : "h-7 w-7";

  return (
    <div
      className="flex gap-1"
      role={readOnly ? "img" : "group"}
      aria-label={`Rating: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`rounded p-0.5 transition ${readOnly ? "cursor-default" : "hover:scale-110"}`}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={`${iconClass} ${
              star <= value ? "fill-[#6b0f1a] text-[#6b0f1a]" : "text-[#d4a5b5]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
