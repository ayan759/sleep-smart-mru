/** Single source of truth for poll answers (UI, validation, demo data and SQL CHECKs). */

export const POLL_ID = "fall-2026";
export const CONSENT_LINE = "Anonymous, used only for our UGST 1002 class project.";
export const MAX_BARRIERS = 3;
export const MAX_SUPPORTS = 2;
/** Breakdown groups smaller than this are never shown. */
export const MIN_GROUP_SIZE = 10;

export type Option = { id: string; label: string };

export const BARRIERS = [
  { id: "assignments", label: "Assignments or studying" },
  { id: "exams", label: "Exams or midterms" },
  { id: "early_classes", label: "Early classes" },
  { id: "late_classes", label: "Late classes or labs" },
  { id: "job_shifts", label: "Part-time job shifts" },
  { id: "commute", label: "Commute" },
  { id: "stress", label: "Stress or anxiety" },
  { id: "screens", label: "Phone, social media or screens" },
  { id: "gaming", label: "Gaming or streaming" },
  { id: "caffeine", label: "Caffeine or energy drinks" },
  { id: "social", label: "Social plans" },
  { id: "noise", label: "Noise, roommates or residence" },
  { id: "family", label: "Family responsibilities" },
  { id: "other", label: "Something else" },
] as const satisfies readonly Option[];

export const SUPPORTS = [
  { id: "posters", label: "Sleep tips posters on campus" },
  { id: "app_reminders", label: "MRU app reminders before exams" },
  { id: "sleep_tools", label: "Sleep tools like this app" },
  { id: "quiet_spaces", label: "Quiet rest spaces on campus" },
  { id: "fewer_early_exams", label: "Fewer early exam times" },
  { id: "workshops", label: "Sleep workshops from Wellness Services" },
  { id: "other", label: "Something else" },
] as const satisfies readonly Option[];

export const YEARS = [
  { id: "1", label: "1st year" },
  { id: "2", label: "2nd year" },
  { id: "3", label: "3rd year" },
  { id: "4", label: "4th year" },
  { id: "5plus", label: "5th year or more" },
] as const satisfies readonly Option[];

// TODO(confirm with Ayan): MRU faculty list for the optional question.
export const FACULTIES = [
  { id: "arts", label: "Arts" },
  { id: "business_comms", label: "Business and Communication Studies" },
  { id: "health_education", label: "Health, Community and Education" },
  { id: "science_tech", label: "Science and Technology" },
  { id: "open_studies", label: "Open Studies or undeclared" },
] as const satisfies readonly Option[];

export const SLEEP_BUCKETS = [
  { id: "lt5", label: "Under 5 h" },
  { id: "5_6", label: "5–6 h" },
  { id: "6_7", label: "6–7 h" },
  { id: "7_8", label: "7–8 h" },
  { id: "8_9", label: "8–9 h" },
  { id: "9plus", label: "9 h or more" },
] as const satisfies readonly Option[];

export type BarrierId = (typeof BARRIERS)[number]["id"];
export type SupportId = (typeof SUPPORTS)[number]["id"];

export const labelOf = (list: readonly Option[], id: string) =>
  list.find((o) => o.id === id)?.label ?? id;
