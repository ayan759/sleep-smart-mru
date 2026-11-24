import {
  BARRIERS,
  FACULTIES,
  MAX_BARRIERS,
  MAX_SUPPORTS,
  POLL_ID,
  SLEEP_BUCKETS,
  SUPPORTS,
  YEARS,
  type Option,
} from "./options";

export type PollAnswers = {
  barriers: string[];
  topBarrier: string;
  supports: string[];
  yearOfStudy: string | null;
  faculty: string | null;
  sleepBucket: string | null;
};

export type ValidationResult =
  | { ok: true; pollId: string; token: string; answers: PollAnswers }
  | { ok: false; errors: Record<string, string> };

const ids = (list: readonly Option[]) => new Set(list.map((o) => o.id));
const BARRIER_IDS = ids(BARRIERS);
const SUPPORT_IDS = ids(SUPPORTS);
const YEAR_IDS = ids(YEARS);
const FACULTY_IDS = ids(FACULTIES);
const BUCKET_IDS = ids(SLEEP_BUCKETS);

const optional = (v: unknown, allowed: Set<string>) =>
  v === undefined || v === null || v === ""
    ? null
    : typeof v === "string" && allowed.has(v)
      ? v
      : undefined;

/** Strict server-side validation. Only known option ids are accepted; there is no free text. */
export function validateSubmission(body: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  if (!body || typeof body !== "object")
    return { ok: false, errors: { body: "Expected a JSON object." } };
  const b = body as Record<string, unknown>;

  if (b.pollId !== POLL_ID) errors.pollId = "Unknown poll.";
  const token =
    typeof b.token === "string" && /^[A-Za-z0-9-]{16,64}$/.test(b.token) ? b.token : null;
  if (!token) errors.token = "Missing device token.";

  const barriers = Array.isArray(b.barriers) ? [...new Set(b.barriers)] : [];
  if (
    barriers.length < 1 ||
    barriers.length > MAX_BARRIERS ||
    !barriers.every((x) => typeof x === "string" && BARRIER_IDS.has(x))
  )
    errors.barriers = `Pick 1 to ${MAX_BARRIERS} things that cut into your sleep.`;

  const top = b.topBarrier;
  if (typeof top !== "string" || !barriers.includes(top))
    errors.topBarrier = "Pick one of the things you chose above.";

  const supports = Array.isArray(b.supports) ? [...new Set(b.supports)] : [];
  if (
    supports.length < 1 ||
    supports.length > MAX_SUPPORTS ||
    !supports.every((x) => typeof x === "string" && SUPPORT_IDS.has(x))
  )
    errors.supports = `Pick 1 or ${MAX_SUPPORTS} supports.`;

  const yearOfStudy = optional(b.yearOfStudy, YEAR_IDS);
  const faculty = optional(b.faculty, FACULTY_IDS);
  const sleepBucket = optional(b.sleepBucket, BUCKET_IDS);
  if (yearOfStudy === undefined) errors.yearOfStudy = "Unknown year.";
  if (faculty === undefined) errors.faculty = "Unknown faculty.";
  if (sleepBucket === undefined) errors.sleepBucket = "Unknown sleep range.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    pollId: POLL_ID,
    token: token!,
    answers: {
      barriers: barriers as string[],
      topBarrier: top as string,
      supports: supports as string[],
      yearOfStudy: yearOfStudy ?? null,
      faculty: faculty ?? null,
      sleepBucket: sleepBucket ?? null,
    },
  };
}
