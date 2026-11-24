import { createHash, createHmac } from "node:crypto";

/** One-way hash of the random device token, scoped to the poll. Stored instead of the token. */
export function deviceHash(pollId: string, token: string): string {
  return createHash("sha256").update(`${pollId}:${token}`).digest("hex");
}

/**
 * Rate-limit bucket for an IP address: HMAC with a key that rotates daily, so the stored value
 * can't be reversed to an IP or linked across days. The raw IP is never stored.
 */
export function ipBucket(ip: string, secret: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  const dailyKey = createHmac("sha256", secret).update(`ssm-rate-${day}`).digest();
  return createHmac("sha256", dailyKey).update(ip).digest("hex").slice(0, 32);
}

/** Client IP as reported by Vercel's proxy (first X-Forwarded-For entry). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  );
}

/** Constant-time string comparison for the admin passcode. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0 && a.length === b.length;
}
