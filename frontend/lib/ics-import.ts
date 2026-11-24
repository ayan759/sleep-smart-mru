import ICAL from "ical.js";
import { guessEventType, type ScheduleEvent } from "./schedule";
import { fromEdmontonWall } from "./time";

export type ImportResult = { events: ScheduleEvent[]; skippedAllDay: number };

type IcalTime = InstanceType<typeof ICAL.Time>;

/**
 * Convert an ical.js time to an instant. Times in UTC or in a zone defined by the file's
 * VTIMEZONE are exact. "Floating" times, or a TZID the file doesn't define, are read as
 * Calgary wall-clock time (America/Edmonton), which is what MRU schedules mean.
 */
function toInstant(t: IcalTime, knownZones: Set<string>): Date {
  const tzid = t.zone?.tzid;
  if (tzid === "UTC" || (tzid && knownZones.has(tzid))) return t.toJSDate();
  return fromEdmontonWall({
    year: t.year,
    month: t.month,
    day: t.day,
    hour: t.hour,
    minute: t.minute,
  });
}

/**
 * Parse an .ics file entirely in the browser. Recurring events (e.g. weekly classes via RRULE)
 * are expanded into individual occurrences inside [from, to]. All-day events are skipped.
 */
export function importIcs(text: string, from: Date, to: Date): ImportResult {
  const root = new ICAL.Component(ICAL.parse(text));
  const knownZones = new Set<string>();
  for (const vtz of root.getAllSubcomponents("vtimezone")) {
    const tz = new ICAL.Timezone(vtz);
    ICAL.TimezoneService.register(tz);
    if (tz.tzid) knownZones.add(tz.tzid);
  }

  const events: ScheduleEvent[] = [];
  let skippedAllDay = 0;
  const vevents = root.getAllSubcomponents("vevent");
  // Overridden occurrences (RECURRENCE-ID) replace their parent's expansion.
  const exceptions = vevents.filter((v) => v.hasProperty("recurrence-id"));

  for (const vevent of vevents) {
    if (vevent.hasProperty("recurrence-id")) continue;
    const event = new ICAL.Event(vevent, { strictExceptions: true, exceptions });
    if (event.startDate?.isDate) {
      skippedAllDay++;
      continue;
    }
    const title = (event.summary || "Untitled").trim();
    const push = (start: Date, end: Date, key: string) => {
      if (end <= from || start >= to || end <= start) return;
      events.push({
        id: `ics-${event.uid || title}-${key}`,
        title,
        type: guessEventType(title),
        start: start.toISOString(),
        end: end.toISOString(),
        source: "ics",
      });
    };

    if (event.isRecurring()) {
      const it = event.iterator();
      let next: IcalTime | null;
      let guard = 0;
      while ((next = it.next()) && guard++ < 2000) {
        const details = event.getOccurrenceDetails(next);
        const start = toInstant(details.startDate, knownZones);
        if (start >= to) break;
        push(start, toInstant(details.endDate, knownZones), String(start.getTime()));
      }
    } else {
      const start = toInstant(event.startDate, knownZones);
      push(start, toInstant(event.endDate, knownZones), String(start.getTime()));
    }
  }

  events.sort((a, b) => a.start.localeCompare(b.start));
  return { events, skippedAllDay };
}
