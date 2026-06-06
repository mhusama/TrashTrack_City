const envBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/** Resolve API/media host — avoids broken localhost URLs when app is opened via LAN IP or ngrok. */
function resolveBaseURL() {
  if (typeof window === "undefined") return envBase;
  if (!envBase) return window.location.origin;

  try {
    const { hostname: envHost } = new URL(envBase);
    const pageHost = window.location.hostname;
    const envIsLoopback = envHost === "localhost" || envHost === "127.0.0.1";
    const pageIsLoopback = pageHost === "localhost" || pageHost === "127.0.0.1";
    if (envIsLoopback && !pageIsLoopback) {
      return window.location.origin;
    }
    return envBase;
  } catch {
    return window.location.origin;
  }
}

export function mediaUrl(path) {
  if (!path) return "";
  const trimmed = String(path).trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const base = resolveBaseURL();
  return `${base}${normalized}`;
}
