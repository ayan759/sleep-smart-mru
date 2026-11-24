import { NextResponse } from "next/server";
import { POLL_ID } from "@/lib/poll/options";
import { clientIp, deviceHash, ipBucket } from "@/lib/poll/privacy";
import { getPollStore, rateSecret } from "@/lib/poll/store";
import { validateSubmission } from "@/lib/poll/validate";

/**
 * Generous per-IP limit: a whole class votes over MRU Wi-Fi from one public IP.
 * The real one-vote-per-device guard is the hashed device token (unique in the database).
 */
const SUBMIT_LIMIT_PER_MINUTE = 120;

const json = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const store = getPollStore();
  if (!store) return json({ error: "not_connected" }, 503);

  const allowed = await store.rateHit(
    `submit:${ipBucket(clientIp(request.headers), rateSecret())}`,
    60,
    SUBMIT_LIMIT_PER_MINUTE,
  );
  if (!allowed) return json({ error: "rate_limited" }, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid", errors: { body: "Expected JSON." } }, 422);
  }
  const result = validateSubmission(body);
  if (!result.ok) return json({ error: "invalid", errors: result.errors }, 422);

  try {
    const outcome = await store.insert(
      POLL_ID,
      "live",
      deviceHash(POLL_ID, result.token),
      result.answers,
    );
    if (outcome === "duplicate") return json({ error: "already_submitted" }, 409);
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "server_error" }, 500);
  }
}
