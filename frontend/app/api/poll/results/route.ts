import { NextResponse } from "next/server";
import { POLL_ID } from "@/lib/poll/options";
import { getPollStore } from "@/lib/poll/store";

/** Aggregates only. Supabase URL + anon key are public by design; they let the dashboard
 * subscribe to the count-only poll_tick table for live updates. */
export async function GET(request: Request) {
  const store = getPollStore();
  const headers = { "Cache-Control": "no-store" };
  if (!store) return NextResponse.json({ error: "not_connected" }, { status: 503, headers });

  const dataset = new URL(request.url).searchParams.get("dataset") === "demo" ? "demo" : "live";
  try {
    const results = await store.results(POLL_ID, dataset);
    const realtime =
      store.kind === "supabase"
        ? { url: process.env.SUPABASE_URL, anonKey: process.env.SUPABASE_ANON_KEY }
        : null;
    return NextResponse.json({ results, realtime, storage: store.kind }, { headers });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers });
  }
}
