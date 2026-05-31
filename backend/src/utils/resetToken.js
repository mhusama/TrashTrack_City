import crypto from "crypto";

const expiryMinutes = Number(process.env.RESET_PASSWORD_EXPIRY_MINUTES) || 2;
export const RESET_PASSWORD_EXPIRY_MS = expiryMinutes * 60 * 1000;

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
