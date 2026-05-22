import crypto from "crypto";

export function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.sub ?? null;
  } catch {
    return null;
  }
}
