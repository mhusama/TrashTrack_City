/**
 * Helper to get the public URL for an uploaded file.
 * Handles Cloudinary remote URLs (`file.path` / `file.secure_url`)
 * and falls back to local disk `/uploads/${filename}`.
 */
export function getFileUrl(file) {
  if (!file) return "";
  if (file.path && (file.path.startsWith("http://") || file.path.startsWith("https://"))) {
    return file.path;
  }
  if (file.secure_url) {
    return file.secure_url;
  }
  if (file.filename) {
    return `/uploads/${file.filename}`;
  }
  return "";
}
