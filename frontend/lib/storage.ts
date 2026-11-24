/**
 * Versioned localStorage. Everything a student enters stays on their device.
 * Invalid or corrupt data falls back to defaults instead of crashing.
 */
export const STORAGE_KEYS = {
  sleepLog: "ssm:v1:sleepLog",
  schedule: "ssm:v1:schedule",
  plan: "ssm:v1:plan",
} as const;

export function loadJSON<T>(key: string, validate: (x: unknown) => x is T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the app keeps working in memory.
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
