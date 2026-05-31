const baseURL = import.meta.env.VITE_API_URL || "";

export function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
    return path;
  }
  return `${baseURL}${path}`;
}
