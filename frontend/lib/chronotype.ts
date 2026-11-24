/**
 * Circadian phase estimate from the sleep log (weekday vs free-day mid-sleep), following the
 * Munich ChronoType Questionnaire approach (Roenneberg, Wirz-Justice & Merrow, 2003;
 * Roenneberg et al., 2004). Pure functions; times are local clock hours.
 */

export type LoggedNight = {
  /** Clock hour of bedtime measured from midnight of the night's date (e.g. 23.5, or 25 = 1 a.m.). */
  bedHour: number;
  /** Sleep duration in hours. */
  durationHours: number;
  /** True if the following day had no class/work (a "free day" in MCTQ terms). */
  isFreeDay: boolean;
};

export type Chronotype = {
  midSleepWorkday: number | null; // hours after the night's midnight, may exceed 24
  midSleepFreeDay: number | null;
  /** Mid-sleep on free days corrected for sleep debt (MSFsc); falls back to what's available. */
  midSleepCorrected: number | null;
  /** Shift applied to the circadian acrophase, in hours (positive = later chronotype). */
  phaseShiftHours: number;
  basis: "free-days-corrected" | "free-days" | "workdays" | "default";
};

/**
 * ASSUMPTION — TODO(verify): the published default acrophase (16.8 h, see lib/alertness.ts) is
 * not tied to a stated sleep schedule in the sources we could read. We assume it corresponds to
 * a conventional 23:00–07:00 sleep, i.e. mid-sleep at 03:00, and shift the acrophase by the
 * user's mid-sleep relative to that. Replace once verified against Åkerstedt & Folkard.
 */
export const REFERENCE_MID_SLEEP = 3;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Mid-sleep for one night, in hours after that night's midnight (wraps into 24–36 if needed). */
export function midSleep(n: LoggedNight): number {
  // Bedtimes before noon are after midnight (e.g. 1 a.m. logged as 1) → move to 25.
  const bed = n.bedHour < 12 ? n.bedHour + 24 : n.bedHour;
  return bed + n.durationHours / 2;
}

export function estimateChronotype(nights: LoggedNight[]): Chronotype {
  const work = nights.filter((n) => !n.isFreeDay);
  const free = nights.filter((n) => n.isFreeDay);
  const msw = work.length ? mean(work.map(midSleep)) : null;
  const msf = free.length ? mean(free.map(midSleep)) : null;

  let corrected: number | null = null;
  let basis: Chronotype["basis"] = "default";
  if (msf !== null && work.length && free.length) {
    // Roenneberg et al. (2004): MSFsc = MSF − (SDf − SDweek)/2 when free-day sleep is longer,
    // with SDweek = (5·SDw + 2·SDf)/7. TODO(verify) against the paper's text.
    const sdw = mean(work.map((n) => n.durationHours));
    const sdf = mean(free.map((n) => n.durationHours));
    const sdweek = (5 * sdw + 2 * sdf) / 7;
    corrected = sdf > sdw ? msf - (sdf - sdweek) / 2 : msf;
    basis = "free-days-corrected";
  } else if (msf !== null) {
    corrected = msf;
    basis = "free-days";
  } else if (msw !== null) {
    corrected = msw;
    basis = "workdays";
  }

  const phaseShiftHours = corrected === null ? 0 : corrected - (REFERENCE_MID_SLEEP + 24);
  return {
    midSleepWorkday: msw,
    midSleepFreeDay: msf,
    midSleepCorrected: corrected,
    phaseShiftHours,
    basis,
  };
}
