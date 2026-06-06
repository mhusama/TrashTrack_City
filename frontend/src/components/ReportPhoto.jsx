import { useState } from "react";
import { ImageOff } from "lucide-react";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function ReportPhoto({
  src,
  alt = "Report photo",
  className = "mt-3 h-32 w-full rounded-lg border border-theme-border object-cover",
}) {
  const [failed, setFailed] = useState(false);
  const resolved = mediaUrl(src);

  if (!src || !resolved) return null;

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center gap-2 bg-neutral-100 text-neutral-500 ${className}`}
        role="img"
        aria-label="Photo unavailable"
      >
        <ImageOff className="h-5 w-5 shrink-0" aria-hidden />
        <span className="text-xs font-medium">Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
