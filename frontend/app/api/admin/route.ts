import { NextResponse } from "next/server";
import { generateDemoResponses } from "@/lib/poll/demo";
import { POLL_ID } from "@/lib/poll/options";
import { clientIp, deviceHash, ipBucket, safeEqual } from "@/lib/poll/privacy";
import { getPollStore, rateSecret } from "@/lib/poll/store";

const ADMIN_LIMIT_PER_MINUTE = 10;
const json = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const store = getPollStore();
  if (!store) return json({ error: "not_connected" }, 503);

  const allowed = await store.rateHit(
    `admin:${ipBucket(clientIp(request.headers), rateSecret())}`,
    60,
    ADMIN_LIMIT_PER_MINUTE,
  );
  if (!allowed) return json({ error: "rate_limited" }, 429);

  const expected = process.env.ADMIN_PASSCODE;
  const given = request.headers.get("x-admin-passcode") ?? "";
  if (!expected || !safeEqual(given, expected)) return json({ error: "unauthorized" }, 401);

  let action: unknown;
  try {
    action = ((await request.json()) as { action?: unknown }).action;
  } catch {
    return json({ error: "invalid" }, 422);
  }

  try {
    if (action === "reset_live") {
      const removed = await store.clear(POLL_ID, "live");
      return json({ ok: true, removed }, 200);
    }
    if (action === "reseed_demo") {
      await store.clear(POLL_ID, "demo");
      const rows = generateDemoResponses().map((answers, i) => ({
        deviceHash: deviceHash(POLL_ID, `demo-response-${i}`),
        answers,
      }));
      const added = await store.bulkInsert(POLL_ID, "demo", rows);
      return json({ ok: true, added }, 200);
    }
    return json({ error: "invalid", errors: { action: "Use reset_live or reseed_demo." } }, 422);
  } catch {
    return json({ error: "server_error" }, 500);
  }
}
