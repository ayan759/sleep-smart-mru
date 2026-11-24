export type EventType = "class" | "exam" | "work" | "other";

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "exam", label: "Exam" },
  { value: "work", label: "Work shift" },
  { value: "other", label: "Other" },
];

export type ScheduleEvent = {
  id: string;
  title: string;
  type: EventType;
  start: string; // ISO instant
  end: string; // ISO instant
  source: "ics" | "manual";
  /** The study planner may suggest moving optional events. */
  optional?: boolean;
};

const EXAM = /\b(exam|midterm|mid-term|final|quiz|test)\b/i;
const WORK = /\b(shift|work)\b/i;
const COURSE = /\b[A-Z]{3,4}\s?\d{4}\b/;

/** Best guess of an event's type from its title; students can change it. */
export function guessEventType(title: string): EventType {
  if (EXAM.test(title)) return "exam";
  if (WORK.test(title)) return "work";
  if (COURSE.test(title) || /\b(lecture|lab|tutorial|seminar|class)\b/i.test(title)) return "class";
  return "other";
}

/** "COMP 2631" from "COMP2631 - Lecture", if present. */
export function courseCodeOf(title: string): string | null {
  const m = COURSE.exec(title);
  return m ? m[0].replace(/([A-Z]+)\s?(\d+)/, "$1 $2") : null;
}

export function isValidEvent(e: unknown): e is ScheduleEvent {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.start === "string" &&
    typeof x.end === "string" &&
    ["class", "exam", "work", "other"].includes(x.type as string) &&
    !Number.isNaN(Date.parse(x.start as string)) &&
    Date.parse(x.end as string) > Date.parse(x.start as string)
  );
}
