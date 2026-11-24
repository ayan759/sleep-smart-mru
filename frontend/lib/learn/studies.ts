/**
 * Research library. Every entry was checked on 2026-11-24 against PubMed, PMC, the journal's
 * own page or the publisher (see each `url`). Findings are summarised in our own words.
 * Rule: add nothing here that hasn't been checked the same way.
 */

export type Topic =
  | "learning"
  | "regularity"
  | "caffeine"
  | "screens"
  | "sleep-loss"
  | "habits"
  | "students"
  | "programs";

export const TOPICS: { id: Topic; label: string }[] = [
  { id: "learning", label: "Grades and learning" },
  { id: "regularity", label: "Sleep schedule" },
  { id: "sleep-loss", label: "Sleep loss" },
  { id: "caffeine", label: "Caffeine" },
  { id: "screens", label: "Phones and screens" },
  { id: "habits", label: "Daily habits" },
  { id: "students", label: "University students" },
  { id: "programs", label: "Sleep education" },
];

export type Study = {
  id: string;
  /** Plain-language headline of what was found. */
  headline: string;
  authors: string;
  year: number;
  journal: string;
  /** Who or what was studied. */
  sample: string;
  found: string;
  /** Why it matters to an MRU student. */
  forYou: string;
  url: string;
  linkLabel?: string;
  topics: Topic[];
};

export const STUDIES: Study[] = [
  {
    id: "okano-2019",
    headline: "Better sleep tracked with better grades in a chemistry class",
    authors: "Okano et al.",
    year: 2019,
    journal: "npj Science of Learning",
    sample: "88 students in an intro chemistry course wore Fitbits for a semester.",
    found:
      "Students who slept longer, better and more consistently scored higher. Their sleep measures accounted for nearly a quarter of the differences in grades.",
    forYou: "Sleep is part of studying, not time taken away from it.",
    url: "https://doi.org/10.1038/s41539-019-0055-z",
    topics: ["learning", "regularity", "students"],
  },
  {
    id: "phillips-2017",
    headline: "Irregular sleepers had later body clocks and lower grades",
    authors: "Phillips et al.",
    year: 2017,
    journal: "Scientific Reports",
    sample: "61 undergraduates kept sleep diaries for 30 days.",
    found:
      "The most irregular sleepers had a body clock running about two and a half hours later than the most regular sleepers, and more regular sleep went with better academic performance.",
    forYou:
      "Getting up at the same time every day, weekends included, matters as much as total hours.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5468315",
    topics: ["regularity", "learning", "students"],
  },
  {
    id: "mednick-2003",
    headline: "A 60 to 90 minute nap helped learning about as much as a night",
    authors: "Mednick, Nakayama & Stickgold",
    year: 2003,
    journal: "Nature Neuroscience",
    sample: "Adults practised a visual learning task, then napped or stayed awake.",
    found:
      "Naps of 60 to 90 minutes that included deep sleep and REM sleep produced learning similar to a full night of sleep on the task.",
    forYou: "A real nap after a hard study block can lock in what you just learned.",
    url: "https://doi.org/10.1038/nn1078",
    topics: ["learning", "habits"],
  },
  {
    id: "thacher-2008",
    headline: "Students who pulled all-nighters had lower GPAs",
    authors: "Thacher",
    year: 2008,
    journal: "Behavioral Sleep Medicine",
    sample: "Undergraduates at a liberal arts university reported their all-nighters and grades.",
    found:
      "All-nighters were linked to lower GPAs, later bedtimes and being more of a night owl. The study shows a link, not proof that all-nighters caused the lower grades.",
    forYou: "Cramming all night before an exam is the habit most tied to worse results.",
    url: "https://doi.org/10.1080/15402000701796114",
    topics: ["sleep-loss", "learning", "students"],
  },
  {
    id: "van-dongen-2003",
    headline: "Six hours a night for two weeks quietly wore down performance",
    authors: "Van Dongen, Maislin, Mullington & Dinges",
    year: 2003,
    journal: "Sleep",
    sample: "Adults were limited to 4, 6 or 8 hours in bed for 14 days in a lab.",
    found:
      "The 4-hour and 6-hour groups got steadily worse on attention and memory tests day after day, while their own sleepiness ratings suggested they were largely unaware of it.",
    forYou: "Feeling fine after a week of short nights doesn't mean you are performing fine.",
    url: "https://pubmed.ncbi.nlm.nih.gov/12683469/",
    topics: ["sleep-loss"],
  },
  {
    id: "williamson-2000",
    headline: "17 to 19 hours awake impaired people like a 0.05% blood alcohol level",
    authors: "Williamson & Feyer",
    year: 2000,
    journal: "Occupational and Environmental Medicine",
    sample: "39 adults were tested after staying awake and, separately, after drinking alcohol.",
    found:
      "After 17 to 19 hours without sleep, performance on some tests was as bad as or worse than at a blood alcohol concentration of 0.05%. Longer without sleep reached the level of 0.1%.",
    forYou: "Driving home after a long study day can be as risky as driving after drinking.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1739867",
    topics: ["sleep-loss"],
  },
  {
    id: "yoo-2007",
    headline: "Without sleep, the brain reacted more strongly to upsetting images",
    authors: "Yoo, Gujar, Hu, Jolesz & Walker",
    year: 2007,
    journal: "Current Biology",
    sample: "26 healthy adults either slept normally or stayed awake for about 35 hours.",
    found:
      "In the sleep-deprived group, the brain's emotional centre (the amygdala) reacted more strongly to negative pictures and was less connected to the part of the brain that calms it.",
    forYou: "Short sleep can make stress and anxiety during exams feel bigger.",
    url: "https://pubmed.ncbi.nlm.nih.gov/17956744/",
    topics: ["sleep-loss"],
  },
  {
    id: "drake-2013",
    headline: "Caffeine six hours before bed still cut sleep by over an hour",
    authors: "Drake, Roehrs, Shambroom & Roth",
    year: 2013,
    journal: "Journal of Clinical Sleep Medicine",
    sample:
      "12 healthy sleepers took 400 mg of caffeine at bedtime, 3 or 6 hours before bed, or a placebo.",
    found:
      "Even caffeine taken 6 hours before bed reduced measured sleep by more than an hour, and people mostly didn't notice it had happened.",
    forYou: "Stop caffeine at least 6 hours before you plan to sleep.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3805807",
    topics: ["caffeine", "habits"],
  },
  {
    id: "chang-2015",
    headline: "Reading on a tablet before bed delayed sleep and the body clock",
    authors: "Chang, Aeschbach, Duffy & Czeisler",
    year: 2015,
    journal: "Proceedings of the National Academy of Sciences",
    sample:
      "12 adults read on a light-emitting tablet or a printed book for 4 hours before bed, five nights each.",
    found:
      "After tablet reading, people took longer to fall asleep, released less melatonin, had a later body clock and were less alert the next morning than after the printed book.",
    forYou: "Dim the screen, or swap it for paper, in the last hour before bed.",
    url: "https://pubmed.ncbi.nlm.nih.gov/25535358/",
    topics: ["screens", "habits"],
  },
  {
    id: "exelmans-2016",
    headline: "Phone use in bed went with more insomnia and fatigue",
    authors: "Exelmans & Van den Bulck",
    year: 2016,
    journal: "Social Science & Medicine",
    sample: "A survey of 844 Flemish adults aged 18 to 94.",
    found:
      "More phone use after the lights were out was linked to later wake-up times, more insomnia symptoms and more fatigue, especially in younger adults.",
    forYou: "Charge your phone away from your bed.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26688552/",
    topics: ["screens", "habits"],
  },
  {
    id: "wittmann-2006",
    headline: "Living on two clocks: 'social jetlag'",
    authors: "Wittmann, Dinich, Merrow & Roenneberg",
    year: 2006,
    journal: "Chronobiology International",
    sample: "People's sleep timing on work days and free days was compared.",
    found:
      "Shifting sleep a lot between weekdays and weekends works like flying across time zones every week, and bigger shifts were linked to poorer sleep and well-being.",
    forYou: "Sleeping in for hours on Saturday makes Monday morning harder.",
    url: "https://doi.org/10.1080/07420520500545979",
    topics: ["regularity", "habits"],
  },
  {
    id: "ebrahim-2013",
    headline: "Alcohol helps you fall asleep, then breaks up the night",
    authors: "Ebrahim, Shapiro, Williams & Fenwick",
    year: 2013,
    journal: "Alcoholism: Clinical and Experimental Research",
    sample: "A review of studies of alcohol and sleep in healthy people.",
    found:
      "At every dose, alcohol shortened the time to fall asleep but increased sleep disruption in the second half of the night. High doses also cut REM sleep early in the night.",
    forYou: "A nightcap trades a faster start for a worse night.",
    url: "https://pubmed.ncbi.nlm.nih.gov/23347102/",
    topics: ["habits"],
  },
  {
    id: "kredlow-2015",
    headline: "Regular exercise improved sleep quality",
    authors: "Kredlow, Capozzoli, Hearon, Calkins & Otto",
    year: 2015,
    journal: "Journal of Behavioral Medicine",
    sample: "A meta-analysis of 66 studies.",
    found:
      "Regular physical activity had small benefits for total sleep time and moderate benefits for sleep quality, and helped people fall asleep faster.",
    forYou: "A walk to class or a gym session helps your sleep that night.",
    url: "https://doi.org/10.1007/s10865-015-9617-6",
    topics: ["habits"],
  },
  {
    id: "lund-2010",
    headline: "Over 60% of college students were poor-quality sleepers",
    authors: "Lund, Reider, Whiting & Prichard",
    year: 2010,
    journal: "Journal of Adolescent Health",
    sample: "A survey of 1,125 students aged 17 to 24 at an urban university.",
    found:
      "More than 60% scored as poor-quality sleepers, weekend sleep ran later, and feeling stressed was the biggest predictor of poor sleep.",
    forYou: "If you sleep badly, you are far from alone, and stress is a big part of it.",
    url: "https://pubmed.ncbi.nlm.nih.gov/20113918/",
    topics: ["students", "habits"],
  },
  {
    id: "hershner-chervin-2014",
    headline: "Why students are so sleepy, and what it costs",
    authors: "Hershner & Chervin",
    year: 2014,
    journal: "Nature and Science of Sleep",
    sample: "A review of research on college student sleep.",
    found:
      "About half of students report daytime sleepiness and about 70% get too little sleep, linked to lower grades, poorer mood and more car crashes.",
    forYou: "Student sleep problems are common, well studied and fixable.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4075951",
    topics: ["students", "sleep-loss"],
  },
  {
    id: "kuhn-2024",
    headline: "Sleep habits mattered more than major at two Canadian universities",
    authors: "Kuhn, Karsan, Heisz & Middleton",
    year: 2024,
    journal: "Frontiers in Psychology",
    sample: "1,566 students at the University of Waterloo and McMaster University.",
    found:
      "Sleep hygiene and attitudes about sleep were linked to sleep quality and insomnia, while academic discipline alone was not.",
    forYou: "Canadian students' sleep improves with habits, which you control.",
    url: "https://doi.org/10.3389/fpsyg.2024.1396579",
    topics: ["students", "habits"],
  },
  {
    id: "brown-2002",
    headline: "Knowing about sleep linked to better habits and better sleep",
    authors: "Brown, Buboltz & Soper",
    year: 2002,
    journal: "Behavioral Medicine",
    sample: "University students completed sleep hygiene and sleep quality surveys.",
    found:
      "Knowing good sleep habits was related to practising them, and those practices were related to better sleep quality.",
    forYou: "Learning how sleep works is the first step, which is why this guide exists.",
    url: "https://scholar.google.com/scholar?q=Brown+Buboltz+Soper+2002+sleep+hygiene+awareness+practices+sleep+quality+university+students",
    linkLabel: "Find the study",
    topics: ["programs", "students"],
  },
  {
    id: "blunden-2012",
    headline: "Sleep education raised knowledge, but behaviour didn't always follow",
    authors: "Blunden, Chapman & Rigney",
    year: 2012,
    journal: "Sleep Medicine Reviews",
    sample: "A review of sleep education programs.",
    found:
      "Most programs increased what people knew about sleep, but that didn't necessarily change how long they slept or their habits.",
    forYou: "Knowing isn't enough. Tools like Sleep Weather turn knowing into doing.",
    url: "https://pubmed.ncbi.nlm.nih.gov/22104441/",
    topics: ["programs"],
  },
  {
    id: "hershner-obrien-2018",
    headline: "A short online sleep program changed students' habits",
    authors: "Hershner & O'Brien",
    year: 2018,
    journal: "Journal of Clinical Sleep Medicine",
    sample: "University students were randomly assigned to an online sleep program or no program.",
    found:
      "After eight weeks, more students in the program had improved their sleep behaviours (50.3% versus 39.5%), and their depression scores improved too.",
    forYou: "Short, personal, online sleep help works for students.",
    url: "https://doi.org/10.5664/jcsm.6974",
    topics: ["programs", "students"],
  },
  {
    id: "csep-2020",
    headline: "Canada's guideline: 7 to 9 hours, on a regular schedule",
    authors: "Canadian Society for Exercise Physiology (Ross, Chaput et al.)",
    year: 2020,
    journal: "Canadian 24-Hour Movement Guidelines for Adults",
    sample: "Canadian guidance for adults aged 18 to 64.",
    found:
      "Adults should get 7 to 9 hours of good-quality sleep on a regular basis, with consistent bed and wake-up times.",
    forYou: "The target for students is 7 to 9 hours, at the same times every day.",
    url: "https://csepguidelines.ca/adults-18-64/",
    linkLabel: "Read the guideline",
    topics: ["regularity"],
  },
];

export const studyById = (id: string) => STUDIES.find((s) => s.id === id);
