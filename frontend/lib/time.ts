/** All app times are interpreted in Calgary local time. */
export const EDMONTON_TZ = "America/Edmonton";

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

const clockFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EDMONTON_TZ,
  hour: "numeric",
  minute: "2-digit",
});

/** Canadian-style clock time in Edmonton, e.g. "8:00 a.m.". */
export function formatClock(at: Date | string): string {
  const date = typeof at === "string" ? new Date(at) : at;
  return clockFormatter.format(date).replace(/ | /g, " ");
}
