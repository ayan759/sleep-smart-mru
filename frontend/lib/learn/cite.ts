import { studyById } from "./studies";

const SHORT: Record<string, string> = { "csep-2020": "CSEP 2020" };

/** Short in-text citation, e.g. "Drake 2013" or "Okano 2019". */
export function cite(id: string): string {
  if (SHORT[id]) return SHORT[id];
  const s = studyById(id);
  if (!s) return id;
  const first = s.authors.split(/,|&| et al\./)[0].trim();
  return `${first} ${s.year}`;
}
