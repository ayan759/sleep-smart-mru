/**
 * Caffeine still in the body over time (simplified: absorbed right away, then halving every
 * half-life). Educational estimate only.
 *
 * Sources (checked 2026-11-24):
 * - Amounts and the 400 mg daily limit: Health Canada, "Caffeine in Foods" (Table 1 and 2),
 *   https://www.canada.ca/en/health-canada/services/food-nutrition/food-safety/food-additives/caffeine-foods.html
 *   Ranges are shown as given; the calculator uses the middle of a range.
 * - Energy drinks: "up to 180 mg" per serving, Health Canada's cap for caffeinated energy drinks,
 *   https://www.canada.ca/en/health-canada/services/food-nutrition/supplemented-foods/caffeinated-energy-drinks.html
 * - Half-life: mean about 5 h in healthy adults, range 1.5 to 9.5 h, NCBI Bookshelf NBK223808
 *   (https://www.ncbi.nlm.nih.gov/books/NBK223808/), also Harvard T.H. Chan Nutrition Source.
 * - The 6-hour cut-off: Drake et al. (2013), J Clin Sleep Med.
 */

export const DAILY_LIMIT_MG = 400; // Health Canada, adults 18+
export const HALF_LIFE_H = { typical: 5, fast: 1.5, slow: 9.5 };
export const CUTOFF_HOURS_BEFORE_BED = 6; // Drake et al. 2013

export type Drink = { id: string; label: string; serving: string; mg: number; shown: string };

export const DRINKS: Drink[] = [
  { id: "brewed", label: "Brewed coffee", serving: "1 cup (237 ml)", mg: 135, shown: "135 mg" },
  { id: "drip", label: "Filter drip coffee", serving: "1 cup (237 ml)", mg: 179, shown: "179 mg" },
  { id: "instant", label: "Instant coffee", serving: "1 cup (237 ml)", mg: 91, shown: "76–106 mg" },
  { id: "tea", label: "Black or green tea", serving: "1 cup (237 ml)", mg: 40, shown: "30–50 mg" },
  { id: "cola", label: "Cola", serving: "1 can (355 ml)", mg: 41, shown: "36–46 mg" },
  { id: "energy", label: "Energy drink", serving: "1 can", mg: 180, shown: "up to 180 mg" },
];

export const drinkById = (id: string) => DRINKS.find((d) => d.id === id) ?? DRINKS[0];

export type Intake = { mg: number; atMin: number }; // minutes on the day's timeline

/** Caffeine (mg) remaining at time t (minutes) from all intakes, for a given half-life (hours). */
export function remainingAt(intakes: Intake[], tMin: number, halfLifeH: number): number {
  let total = 0;
  for (const i of intakes) {
    if (tMin < i.atMin) continue;
    total += i.mg * Math.pow(0.5, (tMin - i.atMin) / 60 / halfLifeH);
  }
  return total;
}

/** "HH:MM" → minutes after 6:00 a.m. on the day's timeline (times before 6 a.m. are after midnight). */
export function toTimelineMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const mins = h * 60 + m;
  return mins >= 6 * 60 ? mins - 6 * 60 : mins + 18 * 60;
}
