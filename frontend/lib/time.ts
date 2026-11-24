/** All app times are interpreted in Calgary local time. */
export const EDMONTON_TZ = "America/Edmonton";

const HOUR_MS = 3_600_000;
export const MINUTE_MS = 60_000;
export { HOUR_MS };

const offsetFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDMONTON_TZ,
  timeZoneName: "longOffset",
});

/** UTC offset in Edmonton at a given instant, e.g. "-07:00" (MST) or "-06:00" (MDT). */
export function edmontonOffset(at: Date): string {
  const part = offsetFormatter.formatToParts(at).find((p) => p.type === "timeZoneName");
  const raw = part?.value ?? "GMT";
  return raw === "GMT" ? "+00:00" : raw.replace("GMT", "");
}

/** Offset in minutes (e.g. -420 for MST). */
export function edmontonOffsetMinutes(at: Date): number {
  const m = /([+-])(\d{2}):(\d{2})/.exec(edmontonOffset(at));
  if (!m) return 0;
  const mins = Number(m[2]) * 60 + Number(m[3]);
  return m[1] === "-" ? -mins : mins;
}

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDMONTON_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export type WallTime = { year: number; month: number; day: number; hour: number; minute: number };

/** Edmonton wall-clock fields for an instant. */
export function edmontonParts(at: Date | number): WallTime {
  const parts = partsFormatter.formatToParts(typeof at === "number" ? new Date(at) : at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** Instant for an Edmonton wall-clock time (DST-safe; nonexistent times roll forward). */
export function fromEdmontonWall(w: WallTime): Date {
  const naive = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  let guess = naive - edmontonOffsetMinutes(new Date(naive)) * MINUTE_MS;
  // Re-check once: the offset at the guessed instant may differ across a DST change.
  guess = naive - edmontonOffsetMinutes(new Date(guess)) * MINUTE_MS;
  return new Date(guess);
}

/** "YYYY-MM-DD" in Edmonton for an instant. */
export function edmontonDate(at: Date | number): string {
  const p = edmontonParts(at);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Add whole calendar days to a "YYYY-MM-DD" date. */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** Instant of an Edmonton date + "HH:MM" clock time. */
export function atClock(ymd: string, hhmm: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hour, minute] = hhmm.split(":").map(Number);
  return fromEdmontonWall({ year: y, month: m, day: d, hour, minute });
}

/** "HH:MM" (24 h) Edmonton clock time of an instant. */
export function clockOf(at: Date | number): string {
  const p = edmontonParts(at);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Decimal Edmonton clock hour (0–24) of an instant, e.g. 13.5 for 1:30 p.m. */
export function clockHour(at: Date | number): number {
  const p = edmontonParts(at);
  return p.hour + p.minute / 60;
}

const clockFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDMONTON_TZ,
  hour: "numeric",
  minute: "2-digit",
});

/** Canadian-style clock time in Edmonton, e.g. "8:00 a.m.". */
export function formatClock(at: Date | string | number): string {
  const date = at instanceof Date ? at : new Date(at);
  return clockFormatter.format(date).replace(/ | /g, " ");
}

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDMONTON_TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** e.g. "Tue, Dec 1" in Edmonton. */
export function formatDay(at: Date | number): string {
  return dayFormatter.format(at instanceof Date ? at : new Date(at)).replace(/\./g, "");
}

/** Weekday (0 = Sunday) of a "YYYY-MM-DD" date. */
export function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
