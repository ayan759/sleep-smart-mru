import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { aggregate, rank, type Dataset, type GroupBreakdown, type PollResults } from "./aggregate";
import { BARRIERS, FACULTIES, SUPPORTS, YEARS, labelOf, type Option } from "./options";
import type { PollAnswers } from "./validate";

export type InsertOutcome = "ok" | "duplicate";

export interface PollStore {
  readonly kind: "supabase" | "memory";
  insert(
    pollId: string,
    dataset: Dataset,
    deviceHash: string,
    a: PollAnswers,
  ): Promise<InsertOutcome>;
  results(pollId: string, dataset: Dataset): Promise<PollResults>;
  /** True if this hit is within the limit. */
  rateHit(bucket: string, windowSeconds: number, limit: number): Promise<boolean>;
  clear(pollId: string, dataset: Dataset): Promise<number>;
  bulkInsert(
    pollId: string,
    dataset: Dataset,
    rows: { deviceHash: string; answers: PollAnswers }[],
  ): Promise<number>;
}

// ------------------------------------------------------------------ Supabase

const row = (pollId: string, dataset: Dataset, deviceHash: string, a: PollAnswers) => ({
  poll_id: pollId,
  dataset,
  device_hash: deviceHash,
  barriers: a.barriers,
  top_barrier: a.topBarrier,
  supports: a.supports,
  year_of_study: a.yearOfStudy,
  faculty: a.faculty,
  sleep_bucket: a.sleepBucket,
});

type CountRow = { option_id: string; n: number };
type GroupRow = CountRow & { group_id: string; group_n: number };

const toMap = (rows: CountRow[] | null) => new Map((rows ?? []).map((r) => [r.option_id, r.n]));

function groups(rows: GroupRow[] | null, list: readonly Option[]): GroupBreakdown[] {
  const byGroup = new Map<string, GroupRow[]>();
  for (const r of rows ?? []) byGroup.set(r.group_id, [...(byGroup.get(r.group_id) ?? []), r]);
  return list
    .filter((g) => byGroup.has(g.id))
    .map((g) => {
      const rs = byGroup.get(g.id)!;
      const n = rs[0].group_n;
      return {
        id: g.id,
        label: labelOf(list, g.id),
        n,
        top: rank(toMap(rs), n, BARRIERS).slice(0, 3),
      };
    });
}

class SupabaseStore implements PollStore {
  readonly kind = "supabase" as const;
  constructor(
    private readonly admin: SupabaseClient, // service role: inserts, admin, rate limits
    private readonly reader: SupabaseClient, // anon: aggregate views only
  ) {}

  async insert(
    pollId: string,
    dataset: Dataset,
    deviceHash: string,
    a: PollAnswers,
  ): Promise<InsertOutcome> {
    const { error } = await this.admin
      .from("poll_responses")
      .insert(row(pollId, dataset, deviceHash, a));
    if (!error) return "ok";
    if (error.code === "23505") return "duplicate";
    throw new Error(`insert failed: ${error.code}`);
  }

  async results(pollId: string, dataset: Dataset): Promise<PollResults> {
    const q = (view: string, cols: string) =>
      this.reader.from(view).select(cols).eq("poll_id", pollId).eq("dataset", dataset);
    const [totals, barriers, top, supports, years, faculties] = await Promise.all([
      q("v_poll_totals", "responses"),
      q("v_poll_barriers", "option_id, n"),
      q("v_poll_top_barrier", "option_id, n"),
      q("v_poll_supports", "option_id, n"),
      q("v_poll_year_barriers", "group_id, group_n, option_id, n"),
      q("v_poll_faculty_barriers", "group_id, group_n, option_id, n"),
    ]);
    const failed = [totals, barriers, top, supports, years, faculties].find((r) => r.error);
    if (failed?.error) throw new Error(`results failed: ${failed.error.code}`);
    const total = (totals.data as unknown as { responses: number }[])[0]?.responses ?? 0;
    return {
      dataset,
      total,
      barriers: rank(toMap(barriers.data as unknown as CountRow[]), total, BARRIERS),
      topBarrier: rank(toMap(top.data as unknown as CountRow[]), total, BARRIERS),
      supports: rank(toMap(supports.data as unknown as CountRow[]), total, SUPPORTS),
      byYear: groups(years.data as unknown as GroupRow[], YEARS),
      byFaculty: groups(faculties.data as unknown as GroupRow[], FACULTIES),
      updatedAt: new Date().toISOString(),
    };
  }

  async rateHit(bucket: string, windowSeconds: number, limit: number): Promise<boolean> {
    const { data, error } = await this.admin.rpc("poll_rate_hit", {
      p_bucket: bucket,
      p_window_seconds: windowSeconds,
      p_limit: limit,
    });
    if (error) return true; // fail open: never block a classroom vote because the limiter hiccuped
    return data === true;
  }

  async clear(pollId: string, dataset: Dataset): Promise<number> {
    const { count, error } = await this.admin
      .from("poll_responses")
      .delete({ count: "exact" })
      .eq("poll_id", pollId)
      .eq("dataset", dataset);
    if (error) throw new Error(`clear failed: ${error.code}`);
    return count ?? 0;
  }

  async bulkInsert(
    pollId: string,
    dataset: Dataset,
    rows: { deviceHash: string; answers: PollAnswers }[],
  ) {
    const { error } = await this.admin
      .from("poll_responses")
      .insert(rows.map((r) => row(pollId, dataset, r.deviceHash, r.answers)));
    if (error) throw new Error(`seed failed: ${error.code}`);
    return rows.length;
  }
}

// ------------------------------------------------------------------ In-memory (local dev only)

type MemoryState = {
  rows: Map<string, Map<string, PollAnswers>>; // `${poll}|${dataset}` → deviceHash → answers
  hits: Map<string, number>;
};
const g = globalThis as unknown as { __ssmPollMemory?: MemoryState };

class MemoryStore implements PollStore {
  readonly kind = "memory" as const;
  private state: MemoryState = (g.__ssmPollMemory ??= { rows: new Map(), hits: new Map() });
  private bucket(pollId: string, dataset: Dataset) {
    const key = `${pollId}|${dataset}`;
    if (!this.state.rows.has(key)) this.state.rows.set(key, new Map());
    return this.state.rows.get(key)!;
  }
  async insert(
    pollId: string,
    dataset: Dataset,
    deviceHash: string,
    a: PollAnswers,
  ): Promise<InsertOutcome> {
    const b = this.bucket(pollId, dataset);
    if (b.has(deviceHash)) return "duplicate";
    b.set(deviceHash, a);
    return "ok";
  }
  async results(pollId: string, dataset: Dataset) {
    return aggregate([...this.bucket(pollId, dataset).values()], dataset);
  }
  async rateHit(bucket: string, windowSeconds: number, limit: number) {
    const key = `${bucket}|${Math.floor(Date.now() / 1000 / windowSeconds)}`;
    const n = (this.state.hits.get(key) ?? 0) + 1;
    this.state.hits.set(key, n);
    return n <= limit;
  }
  async clear(pollId: string, dataset: Dataset) {
    const b = this.bucket(pollId, dataset);
    const n = b.size;
    b.clear();
    return n;
  }
  async bulkInsert(
    pollId: string,
    dataset: Dataset,
    rows: { deviceHash: string; answers: PollAnswers }[],
  ) {
    const b = this.bucket(pollId, dataset);
    for (const r of rows) b.set(r.deviceHash, r.answers);
    return rows.length;
  }
}

// ------------------------------------------------------------------ Selection

let cached: PollStore | null | undefined;

/**
 * Supabase when configured. Without it, an in-memory store in local development only;
 * in production we return null so the UI says the poll isn't connected (never silently drops votes).
 */
export function getPollStore(): PollStore | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && anon && service) {
    const opts = { auth: { persistSession: false, autoRefreshToken: false } };
    cached = new SupabaseStore(createClient(url, service, opts), createClient(url, anon, opts));
  } else {
    cached = process.env.NODE_ENV === "production" ? null : new MemoryStore();
  }
  return cached;
}

/** Secret for rate-limit bucket hashing (never sent to clients). */
export function rateSecret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_PASSCODE || "local-dev-only";
}
