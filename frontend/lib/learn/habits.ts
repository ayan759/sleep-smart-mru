/** Habits that help and hurt, and the quiz. Every item cites study ids from studies.ts. */

export type Habit = { title: string; why: string; sources: string[] };

export const GOOD_HABITS: Habit[] = [
  {
    title: "Wake up at the same time every day",
    why: "Weekends too. Students with the most regular schedules had earlier body clocks and better grades, and Canada's guideline asks for consistent bed and wake-up times.",
    sources: ["phillips-2017", "csep-2020"],
  },
  {
    title: "Get 7 to 9 hours",
    why: "That's the Canadian guideline for adults. In one class, sleep length, quality and consistency explained nearly a quarter of the differences in grades.",
    sources: ["csep-2020", "okano-2019"],
  },
  {
    title: "Stop caffeine 6 hours before bed",
    why: "Caffeine 6 hours before bed still cut sleep by more than an hour in a sleep study, and people didn't notice.",
    sources: ["drake-2013"],
  },
  {
    title: "Sleep on what you studied",
    why: "Sleep helps memory set in. A 60 to 90 minute nap helped learning on a task about as much as a full night.",
    sources: ["mednick-2003", "okano-2019"],
  },
  {
    title: "Move during the day",
    why: "Across 66 studies, regular exercise improved sleep quality and helped people fall asleep faster.",
    sources: ["kredlow-2015"],
  },
  {
    title: "Put the screen away before bed",
    why: "Reading on a lit tablet before bed delayed sleep and the body clock compared with a printed book.",
    sources: ["chang-2015", "exelmans-2016"],
  },
];

export const BAD_HABITS: Habit[] = [
  {
    title: "All-nighters before exams",
    why: "All-nighters were linked to lower GPAs, and two weeks of 6-hour nights wore down performance while people felt fine.",
    sources: ["thacher-2008", "van-dongen-2003"],
  },
  {
    title: "Driving after a long day awake",
    why: "After 17 to 19 hours awake, people performed on some tests like someone at a 0.05% blood alcohol level.",
    sources: ["williamson-2000"],
  },
  {
    title: "Energy drinks to push through",
    why: "One can holds up to 180 mg of caffeine, close to half of Health Canada's 400 mg daily limit, and caffeine lingers for hours.",
    sources: ["drake-2013"],
  },
  {
    title: "A drink to fall asleep",
    why: "Alcohol helps you fall asleep faster, then breaks up the second half of the night.",
    sources: ["ebrahim-2013"],
  },
  {
    title: "Sleeping in until noon on weekends",
    why: "Big shifts between weekday and weekend sleep act like weekly jet lag and were linked to poorer sleep and well-being.",
    sources: ["wittmann-2006", "phillips-2017"],
  },
  {
    title: "Scrolling in bed",
    why: "Phone use after lights out was linked to later wake-up times, more insomnia symptoms and more fatigue.",
    sources: ["exelmans-2016", "chang-2015"],
  },
];

export type QuizItem = { statement: string; good: boolean; explain: string; sources: string[] };

export const QUIZ: QuizItem[] = [
  {
    statement: "Sleeping until noon on Saturday to catch up",
    good: false,
    explain: "A big weekend shift works like weekly jet lag. Waking at a steady time helps more.",
    sources: ["wittmann-2006", "phillips-2017"],
  },
  {
    statement: "A coffee at 2 p.m. when you go to bed at 11:30",
    good: true,
    explain: "That's more than 6 hours before bed, the cut-off a sleep study supports.",
    sources: ["drake-2013"],
  },
  {
    statement: "A drink to help you fall asleep",
    good: false,
    explain: "Alcohol speeds up falling asleep but breaks up the second half of the night.",
    sources: ["ebrahim-2013"],
  },
  {
    statement: "Pulling an all-nighter before a midterm",
    good: false,
    explain:
      "All-nighters are linked to lower GPAs, and tired brains also react more strongly to stress.",
    sources: ["thacher-2008", "yoo-2007"],
  },
  {
    statement: "A 60 to 90 minute nap after a long study block",
    good: true,
    explain: "A nap that long helped learning on a task about as much as a full night of sleep.",
    sources: ["mednick-2003"],
  },
  {
    statement: "Scrolling your phone in bed until you feel sleepy",
    good: false,
    explain:
      "Screen light delays your body clock, and phone use in bed is linked to more insomnia and fatigue.",
    sources: ["chang-2015", "exelmans-2016"],
  },
  {
    statement: "A run or a gym session in the afternoon",
    good: true,
    explain: "Regular exercise improves sleep quality and helps you fall asleep faster.",
    sources: ["kredlow-2015"],
  },
  {
    statement: "Driving home at 1 a.m. after being up since 6 a.m.",
    good: false,
    explain:
      "That's 19 hours awake, when people performed like someone at a 0.05% blood alcohol level.",
    sources: ["williamson-2000"],
  },
];
