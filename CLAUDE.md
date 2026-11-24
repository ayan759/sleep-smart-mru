# Sleep Smart MRU — project brief for Claude

Mobile-first web app that Mount Royal University (Calgary) students open from a poster QR code.
It turns sleep *knowledge* into sleep *action*. Built by Ayan (developer) for the UGST 1002
"Advocating for Change" group project (Avalin, Liv, Ayan, Ozzy). Full plan: `docs/step-0-proposal.md`.

## Key dates
- **Working, deployed demo: 2026-11-30 (hard deadline).** Presentation Dec 1, 3 or 8, 2026 (live demo).
  APA report due Dec 9, 2026.
- If time is tight, protect Phases 1–3 quality; cut Phase 4 extras first.

## Context (use these facts in app copy; do NOT invent others)
- Dimension: PHYSICAL wellness (sleep), linked to emotional, social, environmental wellness.
- Research question: "To what extent does a lack of knowledge about healthy sleep habits contribute to
  poor sleep quality among Mount Royal University students?"
- 33% of MRU students said sleep hurt academic performance, beside stress (46%) and anxiety (38%)
  (NCHA 2019, reported in MRU Wellness Services, 2021).
- Adults 18–64: 7–9 h good-quality sleep, consistent bed/wake times (Canadian 24-Hour Movement Guidelines, CSEP, 2020).
- Health Canada: ≤ 400 mg caffeine/day for adults; one energy drink can have up to 180 mg.
- Knowledge → habits → quality (Brown et al., 2002; Kuhn et al., 2024, 1,566 Canadian students).
- Information alone raises knowledge but often doesn't change behaviour (Blunden et al., 2012).
- Short personalized online program improved college students' sleep behaviours, 50.3% vs 39.5%
  (Hershner & O'Brien, 2018).
- Core gap: KNOWING vs DOING. Pitch: posters/table tents with QR code + MRU app reminders, ~$1,000/term.

## Features
- **A — Alertness Forecaster ("Sleep Weather")** `/forecast`: 7-night sleep log + tonight's plan,
  .ics import (client-side, ical.js, RRULE, America/Edmonton + DST) or manual events
  (class/exam/work/other). `lib/alertness.ts` = pure deterministic model, 15-min steps, index 0–100,
  bands relative to the user's own range, Recharts area chart, warning cards, "What if I sleep at…"
  slider, side-by-side comparison, `/forecast/how-it-works`.
- **B — Exam-Crunch Optimizer** `/plan`: FastAPI + OR-Tools CP-SAT, 30-min slots, ≤ 14 days,
  10 s time limit. NEVER < 7 h sleep; steady wake time (±drift). Infeasible → explanation + options,
  never relax sleep. Output: day list (mobile) / week grid (desktop), per-course totals, .ics download,
  "Add to Google Calendar" links. Google Calendar OAuth = stretch goal, only if asked.
- **C — Sleep-Barrier Poll + Committee Dashboard** `/poll`, `/dashboard`, `/present`: anonymous,
  < 60 s, no free text, Supabase Postgres, inserts only via server route, RLS on, public reads only
  aggregate views, breakdowns only for groups ≥ 10, live via realtime, demo/live toggle,
  ADMIN_PASSCODE-protected reset/reseed. Consent line: "Anonymous, used only for our UGST 1002 class project."

## Stack & architecture
- One Vercel project using **Vercel Services (Beta)**: `frontend/` (Next.js App Router, TS, Tailwind v4,
  Recharts) + `backend/` (Python 3.12, FastAPI, OR-Tools, uv). `vercel.json` `services` + rewrites:
  `/api/py/(.*)` → solver, `/(.*)` → web. FastAPI routes MUST include the `/api/py` prefix
  (services receive the original path). Local dev: `vercel dev -L` from repo root.
- Re-check current Vercel docs before changing `vercel.json`; don't rely on memory.
- No accounts. Sleep logs, schedules and plans live in localStorage (`ssm:v1:*`, validated on load).
  Only anonymous poll answers go to Supabase.
- All times in **America/Edmonton**. Store ISO strings with offsets; be DST-safe.
- Env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only, never
  `NEXT_PUBLIC_`), `ADMIN_PASSCODE`. Keep `.env.example` current; never commit `.env*` secrets.

## Conventions
- After each phase: lint + tests pass → commit with a clear message → report what works, what's
  left, how to test on a phone.
- Tests: Vitest for `frontend/lib/*` (alertness, chronotype, ics); pytest for `backend/`
  (sleep ≥ 7 h, no overlaps, required hours met, infeasible → explanation not crash).
- Model code: every numeric parameter has a code comment citing its primary source. If a parameter
  can't be verified, write `// TODO(verify): …` and tell Ayan. **Never invent numbers.**
- Dependencies: ask Ayan before adding any package > ~5 MB (OR-Tools and the prompt-named stack are
  pre-approved). Prefer custom SVG + CSS animation over icon/animation libraries.
- Keep the alertness model and solver pure/deterministic (CP-SAT `num_workers = 1`).

## Design
- Mobile-first, fast, calm, accessible (keyboard, labels, visible focus, `prefers-reduced-motion`).
- Palette: navy `#27304F`, yellow `#F3DFA5`, sage `#D2DE9C`, coral `#FD5E48`, lilac `#E6C2DE`;
  Inter font. Page background is deep night (`--color-abyss` #0A0E1C).
- Cards/panels: `surface-night` utility (dark surface, hairline edge, faint top highlight) +
  a soft glow in the card's palette colour; palette = light, not paint. No black outlines or
  hard offset shadows (sticker style retired 2026-11-23 at Ayan's request). Primary button =
  moon-yellow pill with dark text and soft glow, ≥ 44 px tall.
- Hero = photo-real night sky, NOT cartoon (Ayan's feedback 2026-11-23): `components/sky/*` —
  canvas Milky Way + pinpoint stars, a few glowing DOM stars with faint spikes, layered Rockies,
  and `public/moon.webp` rendered by `frontend/scripts/render-moon.mts` (real maria/crater
  positions, deterministic). No outlines/cartoon strokes in the sky scene.
- Contrast: coral is 4.24:1 on navy (fails AA body text) but 6.0:1 on the card surface; for
  warnings use a coral tint/border with starlight text. Moon/sage/lilac/haze all pass AA on cards.
- Home: 2 lines on what Sleep Smart MRU is, 3 tool cards, link to MRU Wellness Services
  (https://www.mtroyal.ca/CampusServices/WellnessServices/index.htm, Wellness Centre U216,
  wellness@mtroyal.ca). About page: class context + APA reference list.

## Safety rules (non-negotiable)
- Educational estimate, **not a medical tool**: never diagnose, never suggest medication. Label the
  forecaster "educational estimate". Short disclaimer in the footer.
- If someone logs < 5 h on most nights (≥ 4 of last 7), show a gentle note pointing to MRU Health
  Services / Wellness Services.
- The optimizer never plans < 7 h sleep, under any input.
- Poll anonymity: no names, emails, accounts, free text, or raw IP addresses stored. One response per
  device per poll (random localStorage token, stored only as a hash) + server-side rate limiting
  (hashed IP buckets; be generous — a whole class shares MRU Wi-Fi).
- Demo data is fake and always visibly labelled "Demo data".
