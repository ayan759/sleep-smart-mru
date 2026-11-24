/**
 * APA 7 reference list for the whole app (About page, Sleep Weather "How it works").
 *
 * Journal articles: authors, title, journal, volume, issue, pages and DOI were copied from the
 * Crossref record for each DOI (publisher-supplied) and cross-checked against PubMed, on
 * 2026-11-24. Titles are put into APA sentence case by hand; nothing was typed from memory.
 * Web pages: the title and "date modified" / "last reviewed" were read from the page itself
 * on 2026-11-24.
 *
 * Rule: add nothing here that hasn't been checked the same way.
 */

export type Reference = {
  id: string;
  /** Each author already in APA form ("Okano, K."). One string for a group author. */
  authors: string[];
  /** "2019", or "2025, April 2" for a dated web page. */
  date: string;
  title: string;
  /** Journal name. Absent for a web page, whose title is italic instead. */
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  /** eLocator for articles without pages, shown as "Article …". */
  article?: string;
  /** Publisher of a web page, when different from the author. */
  site?: string;
  /** https://doi.org/… when there is a DOI, else the official record. */
  url: string;
};

export const REFERENCES: Reference[] = [
  {
    id: "akerstedt-folkard-1997",
    authors: ["Åkerstedt, T.", "Folkard, S."],
    date: "1997",
    title:
      "The three-process model of alertness and its extension to performance, sleep latency, and sleep length",
    journal: "Chronobiology International",
    volume: "14",
    issue: "2",
    pages: "115–123",
    url: "https://doi.org/10.3109/07420529709001149",
  },
  {
    id: "akerstedt-2004",
    authors: ["Åkerstedt, T.", "Folkard, S.", "Portin, C."],
    date: "2004",
    title: "Predictions from the three-process model of alertness",
    journal: "Aviation, Space, and Environmental Medicine",
    volume: "75",
    issue: "3, Suppl.",
    pages: "A75–A83",
    url: "https://pubmed.ncbi.nlm.nih.gov/15018267/",
  },
  {
    id: "blunden-2012",
    authors: ["Blunden, S. L.", "Chapman, J.", "Rigney, G. A."],
    date: "2012",
    title:
      "Are sleep education programs successful? The case for improved and consistent research efforts",
    journal: "Sleep Medicine Reviews",
    volume: "16",
    issue: "4",
    pages: "355–370",
    url: "https://doi.org/10.1016/j.smrv.2011.08.002",
  },
  {
    id: "borbely-1982",
    authors: ["Borbély, A. A."],
    date: "1982",
    title: "A two process model of sleep regulation",
    journal: "Human Neurobiology",
    volume: "1",
    issue: "3",
    pages: "195–204",
    url: "https://pubmed.ncbi.nlm.nih.gov/7185792/",
  },
  {
    id: "brown-2002",
    authors: ["Brown, F. C.", "Buboltz, W. C., Jr.", "Soper, B."],
    date: "2002",
    title:
      "Relationship of sleep hygiene awareness, sleep hygiene practices, and sleep quality in university students",
    journal: "Behavioral Medicine",
    volume: "28",
    issue: "1",
    pages: "33–38",
    url: "https://doi.org/10.1080/08964280209596396",
  },
  {
    id: "chang-2015",
    authors: ["Chang, A.-M.", "Aeschbach, D.", "Duffy, J. F.", "Czeisler, C. A."],
    date: "2015",
    title:
      "Evening use of light-emitting eReaders negatively affects sleep, circadian timing, and next-morning alertness",
    journal: "Proceedings of the National Academy of Sciences",
    volume: "112",
    issue: "4",
    pages: "1232–1237",
    url: "https://doi.org/10.1073/pnas.1418490112",
  },
  {
    id: "daan-1984",
    authors: ["Daan, S.", "Beersma, D. G.", "Borbély, A. A."],
    date: "1984",
    title: "Timing of human sleep: Recovery process gated by a circadian pacemaker",
    journal: "American Journal of Physiology–Regulatory, Integrative and Comparative Physiology",
    volume: "246",
    issue: "2",
    pages: "R161–R183",
    url: "https://doi.org/10.1152/ajpregu.1984.246.2.R161",
  },
  {
    id: "drake-2013",
    authors: ["Drake, C.", "Roehrs, T.", "Shambroom, J.", "Roth, T."],
    date: "2013",
    title: "Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed",
    journal: "Journal of Clinical Sleep Medicine",
    volume: "9",
    issue: "11",
    pages: "1195–1200",
    url: "https://doi.org/10.5664/jcsm.3170",
  },
  {
    id: "ebrahim-2013",
    authors: ["Ebrahim, I. O.", "Shapiro, C. M.", "Williams, A. J.", "Fenwick, P. B."],
    date: "2013",
    title: "Alcohol and sleep I: Effects on normal sleep",
    journal: "Alcoholism: Clinical and Experimental Research",
    volume: "37",
    issue: "4",
    pages: "539–549",
    url: "https://doi.org/10.1111/acer.12006",
  },
  {
    id: "exelmans-2016",
    authors: ["Exelmans, L.", "Van den Bulck, J."],
    date: "2016",
    title: "Bedtime mobile phone use and sleep in adults",
    journal: "Social Science & Medicine",
    volume: "148",
    pages: "93–101",
    url: "https://doi.org/10.1016/j.socscimed.2015.11.037",
  },
  {
    id: "health-canada-caffeine",
    authors: ["Health Canada"],
    date: "2025, April 2",
    title: "Caffeine in foods",
    site: "Government of Canada",
    url: "https://www.canada.ca/en/health-canada/services/food-nutrition/food-safety/food-additives/caffeine-foods.html",
  },
  {
    id: "health-canada-energy-drinks",
    authors: ["Health Canada"],
    date: "2026, November 20",
    title: "Caffeinated energy drinks",
    site: "Government of Canada",
    url: "https://www.canada.ca/en/health-canada/services/food-nutrition/supplemented-foods/caffeinated-energy-drinks.html",
  },
  {
    id: "hershner-chervin-2014",
    authors: ["Hershner, S. D.", "Chervin, R. D."],
    date: "2014",
    title: "Causes and consequences of sleepiness among college students",
    journal: "Nature and Science of Sleep",
    volume: "6",
    pages: "73–84",
    url: "https://doi.org/10.2147/NSS.S62907",
  },
  {
    id: "hershner-obrien-2018",
    authors: ["Hershner, S.", "O'Brien, L. M."],
    date: "2018",
    title: "The impact of a randomized sleep education intervention for college students",
    journal: "Journal of Clinical Sleep Medicine",
    volume: "14",
    issue: "3",
    pages: "337–347",
    url: "https://doi.org/10.5664/jcsm.6974",
  },
  {
    id: "ingre-2014",
    authors: [
      "Ingre, M.",
      "Van Leeuwen, W.",
      "Klemets, T.",
      "Ullvetter, C.",
      "Hough, S.",
      "Kecklund, G.",
      "Karlsson, D.",
      "Åkerstedt, T.",
    ],
    date: "2014",
    title: "Validating and extending the three process model of alertness in airline operations",
    journal: "PLOS ONE",
    volume: "9",
    issue: "10",
    article: "e108679",
    url: "https://doi.org/10.1371/journal.pone.0108679",
  },
  {
    id: "kredlow-2015",
    authors: [
      "Kredlow, M. A.",
      "Capozzoli, M. C.",
      "Hearon, B. A.",
      "Calkins, A. W.",
      "Otto, M. W.",
    ],
    date: "2015",
    title: "The effects of physical activity on sleep: A meta-analytic review",
    journal: "Journal of Behavioral Medicine",
    volume: "38",
    issue: "3",
    pages: "427–449",
    url: "https://doi.org/10.1007/s10865-015-9617-6",
  },
  {
    id: "kuhn-2024",
    authors: ["Kuhn, T.", "Karsan, S.", "Heisz, J. J.", "Middleton, L. E."],
    date: "2024",
    title:
      "The differing relationships between academic discipline, sleep hygiene, and dysfunctional sleep attitudes on sleep quality and duration in Canadian university students",
    journal: "Frontiers in Psychology",
    volume: "15",
    article: "1396579",
    url: "https://doi.org/10.3389/fpsyg.2024.1396579",
  },
  {
    id: "lund-2010",
    authors: ["Lund, H. G.", "Reider, B. D.", "Whiting, A. B.", "Prichard, J. R."],
    date: "2010",
    title:
      "Sleep patterns and predictors of disturbed sleep in a large population of college students",
    journal: "Journal of Adolescent Health",
    volume: "46",
    issue: "2",
    pages: "124–132",
    url: "https://doi.org/10.1016/j.jadohealth.2009.06.016",
  },
  {
    id: "mednick-2003",
    authors: ["Mednick, S.", "Nakayama, K.", "Stickgold, R."],
    date: "2003",
    title: "Sleep-dependent learning: A nap is as good as a night",
    journal: "Nature Neuroscience",
    volume: "6",
    issue: "7",
    pages: "697–698",
    url: "https://doi.org/10.1038/nn1078",
  },
  {
    id: "ninds-sleep",
    authors: ["National Institute of Neurological Disorders and Stroke"],
    date: "2025, February 25",
    title: "Brain basics: Understanding sleep",
    site: "National Institutes of Health",
    url: "https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-understanding-sleep",
  },
  {
    id: "okano-2019",
    authors: [
      "Okano, K.",
      "Kaczmarzyk, J. R.",
      "Dave, N.",
      "Gabrieli, J. D. E.",
      "Grossman, J. C.",
    ],
    date: "2019",
    title:
      "Sleep quality, duration, and consistency are associated with better academic performance in college students",
    journal: "npj Science of Learning",
    volume: "4",
    article: "16",
    url: "https://doi.org/10.1038/s41539-019-0055-z",
  },
  {
    id: "phillips-2017",
    authors: [
      "Phillips, A. J. K.",
      "Clerx, W. M.",
      "O'Brien, C. S.",
      "Sano, A.",
      "Barger, L. K.",
      "Picard, R. W.",
      "Lockley, S. W.",
      "Klerman, E. B.",
      "Czeisler, C. A.",
    ],
    date: "2017",
    title:
      "Irregular sleep/wake patterns are associated with poorer academic performance and delayed circadian and sleep/wake timing",
    journal: "Scientific Reports",
    volume: "7",
    article: "3216",
    url: "https://doi.org/10.1038/s41598-017-03171-4",
  },
  {
    id: "roenneberg-2004",
    authors: [
      "Roenneberg, T.",
      "Kuehnle, T.",
      "Pramstaller, P. P.",
      "Ricken, J.",
      "Havel, M.",
      "Guth, A.",
      "Merrow, M.",
    ],
    date: "2004",
    title: "A marker for the end of adolescence",
    journal: "Current Biology",
    volume: "14",
    issue: "24",
    pages: "R1038–R1039",
    url: "https://doi.org/10.1016/j.cub.2004.11.039",
  },
  {
    id: "roenneberg-2003",
    authors: ["Roenneberg, T.", "Wirz-Justice, A.", "Merrow, M."],
    date: "2003",
    title: "Life between clocks: Daily temporal patterns of human chronotypes",
    journal: "Journal of Biological Rhythms",
    volume: "18",
    issue: "1",
    pages: "80–90",
    url: "https://doi.org/10.1177/0748730402239679",
  },
  {
    id: "csep-2020",
    // Crossref lists 32 authors; APA 7 shows the first 19, an ellipsis, then the last.
    authors: [
      "Ross, R.",
      "Chaput, J.-P.",
      "Giangregorio, L. M.",
      "Janssen, I.",
      "Saunders, T. J.",
      "Kho, M. E.",
      "Poitras, V. J.",
      "Tomasone, J. R.",
      "El-Kotob, R.",
      "McLaughlin, E. C.",
      "Duggan, M.",
      "Carrier, J.",
      "Carson, V.",
      "Chastin, S. F.",
      "Latimer-Cheung, A. E.",
      "Chulak-Bozzer, T.",
      "Faulkner, G.",
      "Flood, S. M.",
      "Gazendam, M. K.",
      "Healy, G. N.",
      "Katzmarzyk, P. T.",
      "Kennedy, W.",
      "Lane, K. N.",
      "Lorbergs, A.",
      "Maclaren, K.",
      "Marr, S.",
      "Powell, K. E.",
      "Rhodes, R. E.",
      "Ross-White, A.",
      "Welsh, F.",
      "Willumsen, J.",
      "Tremblay, M. S.",
    ],
    date: "2020",
    title:
      "Canadian 24-Hour Movement Guidelines for Adults aged 18–64 years and Adults aged 65 years or older: An integration of physical activity, sedentary behaviour, and sleep",
    journal: "Applied Physiology, Nutrition, and Metabolism",
    volume: "45",
    issue: "10, Suppl. 2",
    pages: "S57–S102",
    url: "https://doi.org/10.1139/apnm-2020-0467",
  },
  {
    id: "thacher-2008",
    authors: ["Thacher, P. V."],
    date: "2008",
    title:
      "University students and the “all nighter”: Correlates and patterns of students’ engagement in a single night of total sleep deprivation",
    journal: "Behavioral Sleep Medicine",
    volume: "6",
    issue: "1",
    pages: "16–31",
    url: "https://doi.org/10.1080/15402000701796114",
  },
  {
    id: "van-dongen-2003",
    authors: ["Van Dongen, H. P. A.", "Maislin, G.", "Mullington, J. M.", "Dinges, D. F."],
    date: "2003",
    title:
      "The cumulative cost of additional wakefulness: Dose-response effects on neurobehavioral functions and sleep physiology from chronic sleep restriction and total sleep deprivation",
    journal: "Sleep",
    volume: "26",
    issue: "2",
    pages: "117–126",
    url: "https://doi.org/10.1093/sleep/26.2.117",
  },
  {
    id: "williamson-2000",
    authors: ["Williamson, A. M.", "Feyer, A.-M."],
    date: "2000",
    title:
      "Moderate sleep deprivation produces impairments in cognitive and motor performance equivalent to legally prescribed levels of alcohol intoxication",
    journal: "Occupational and Environmental Medicine",
    volume: "57",
    issue: "10",
    pages: "649–655",
    url: "https://doi.org/10.1136/oem.57.10.649",
  },
  {
    id: "wittmann-2006",
    authors: ["Wittmann, M.", "Dinich, J.", "Merrow, M.", "Roenneberg, T."],
    date: "2006",
    title: "Social jetlag: Misalignment of biological and social time",
    journal: "Chronobiology International",
    volume: "23",
    issue: "1–2",
    pages: "497–509",
    url: "https://doi.org/10.1080/07420520500545979",
  },
  {
    id: "yoo-2007",
    authors: ["Yoo, S.-S.", "Gujar, N.", "Hu, P.", "Jolesz, F. A.", "Walker, M. P."],
    date: "2007",
    title: "The human emotional brain without sleep—A prefrontal amygdala disconnect",
    journal: "Current Biology",
    volume: "17",
    issue: "20",
    pages: "R877–R878",
    url: "https://doi.org/10.1016/j.cub.2007.08.007",
  },
];

/** APA 7 author list: "A", "A, & B", "A, B, & C"; 21 or more: first 19, ". . .", last. */
export function formatAuthors(authors: string[]): string {
  if (authors.length === 1) return authors[0];
  if (authors.length >= 21) {
    return `${authors.slice(0, 19).join(", ")}, . . . ${authors[authors.length - 1]}`;
  }
  return `${authors.slice(0, -1).join(", ")}, & ${authors[authors.length - 1]}`;
}

/** Group authors like "Health Canada" take no extra full stop; "Okano, K." already ends in one. */
export const authorBlock = (r: Reference) => {
  const a = formatAuthors(r.authors);
  return a.endsWith(".") ? a : `${a}.`;
};

/** Ends the title with a full stop unless it already ends in ? or !. */
export const titleSentence = (t: string) => (/[?!.]$/.test(t) ? t : `${t}.`);

const sortKey = (r: Reference) =>
  r.authors
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z ]/g, "")
    .toLowerCase();

/** APA order: by author names letter by letter ("nothing precedes something"), then date. */
export const sortReferences = (refs: Reference[]) =>
  [...refs].sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    if (ka !== kb) return ka < kb ? -1 : 1;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });

export const referenceById = (id: string) => REFERENCES.find((r) => r.id === id);

export const referencesByIds = (ids: string[]) =>
  sortReferences(
    ids.map((id) => {
      const r = referenceById(id);
      if (!r) throw new Error(`Unknown reference ${id}`);
      return r;
    }),
  );
