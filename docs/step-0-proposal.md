# Sleep Smart MRU: Step 0 proposal

Status: **waiting for approval**. Nothing gets scaffolded until you approve this proposal.
Written 2026-11-23. Your demo deadline is 2026-11-30, so we have **7 days**. The schedule is in §6.

---

## 1. What I checked first

| Check | Result |
|---|---|
| Vercel Services docs (vercel.com/docs/services, config-reference, routing, read 2026-11-23) | The `services` key in `vercel.json` is the current way to deploy Next.js and FastAPI in one project. It replaces `experimentalServices`. **Services is still in Beta**, but it's available on all plans, including Hobby. |
| Routing rules | First match wins. A service sees the **original path**, so FastAPI routes must include the `/api/py` prefix. Once a request is routed to a service it stays there, with no fallthrough to the other service. |
| Python on Vercel | Python 3.12 is the default (3.13 and 3.14 also work). Dependencies can live in `pyproject.toml` + `uv.lock`. Bundle limit is **500 MB uncompressed**. On Hobby, functions get 300 s max duration and 2 GB / 1 vCPU. |
| `vercel-labs/python-nextjs-starter` | Uses `services` with `frontend/` + `backend/` roots and `"entrypoint": "app.main:app"`. Local dev runs both services with `vercel dev -L`. I'm copying this layout. |
| `vercel/examples/python/nextjs-fastapi` | **Returns 404 now** (moved or removed). That's why I'm using the starter above as the reference. |
| OR-Tools 9.15 (PyPI) | The Linux x86_64 cp312 wheel is 29.8 MB compressed. It also pulls in numpy, pandas, protobuf, absl-py and immutabledict. That should fit under 500 MB. **Phase 1 deploys OR-Tools in the hello-world app** so we measure the real size on day 1. |
| Your machine | Node 26.8, npm 11, Python 3.12.6, uv 0.13, Vercel CLI 63.1, git, gh. The project folder is empty and isn't a git repo yet. |

---

## 2. Folder structure

```
mru sleep app/
├─ CLAUDE.md                    # project brief for Claude (created in Step 0)
├─ README.md                    # Phase 5: setup, env vars, Mermaid architecture, references
├─ vercel.json                  # services: web (frontend/) + solver (backend/)
├─ package.json                 # root scripts: dev (vercel dev -L), lint, test (runs both stacks)
├─ .env.example                 # SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSCODE
├─ .gitignore / .vercelignore
├─ docs/
│  ├─ step-0-proposal.md        # this file
│  ├─ demo-script.md            # Phase 5: 3-minute live demo script
│  └─ sources/                  # PDFs of the papers (gitignored, local reference only)
├─ frontend/                    # Next.js 16 App Router + TypeScript + Tailwind v4 + Recharts
│  ├─ app/
│  │  ├─ layout.tsx, globals.css        # Inter, design tokens, starfield background, footer disclaimer
│  │  ├─ page.tsx                       # Home: 2-line intro, 3 tool cards, Wellness Services link
│  │  ├─ forecast/page.tsx              # Feature A: sleep log → schedule → "Sleep Weather"
│  │  ├─ forecast/how-it-works/page.tsx # plain-language model explainer + references
│  │  ├─ plan/page.tsx                  # Feature B: exam-crunch optimizer
│  │  ├─ poll/page.tsx                  # Feature C: one-screen anonymous poll
│  │  ├─ dashboard/page.tsx             # Feature C: committee dashboard (live/demo toggle, admin reset)
│  │  ├─ present/page.tsx               # Feature C: full-screen QR + live chart
│  │  ├─ about/page.tsx                 # class context + APA reference list
│  │  └─ api/
│  │     ├─ poll/route.ts               # POST a poll response (server-only insert)
│  │     └─ admin/route.ts              # POST reset/reseed (ADMIN_PASSCODE)
│  ├─ components/
│  │  ├─ ui/                            # Card, Button, Chip, Slider, Tabs, Disclaimer…
│  │  ├─ sky/                           # Starfield, Moon, SkyGradient, weather icons (custom SVG)
│  │  ├─ forecast/                      # SleepLogForm, IcsImport, AlertnessChart, WarningCard, WhatIfSlider, CompareView
│  │  ├─ plan/                          # PlanForm, DayList, WeekGrid, CourseTotals, InfeasibleCard
│  │  └─ poll/                          # PollForm, BarrierBars, BreakdownTable, LiveCounter, PresentQR
│  ├─ lib/
│  │  ├─ alertness.ts (+ .test.ts)      # PURE, deterministic model; every parameter cited
│  │  ├─ chronotype.ts (+ .test.ts)     # mid-sleep (weekday vs weekend) → circadian phase
│  │  ├─ ics-import.ts (+ .test.ts)     # ical.js parse, RRULE expansion, Edmonton tz/DST
│  │  ├─ ics-export.ts (+ .test.ts)     # plan → .ics file + Google Calendar "add" links
│  │  ├─ time.ts                        # America/Edmonton helpers (@date-fns/tz)
│  │  ├─ storage.ts                     # versioned localStorage (ssm:v1:*) with validation
│  │  ├─ poll-options.ts                # shared enums for poll answers (frontend + seed + SQL)
│  │  ├─ demo-data.ts                   # seeded PRNG fake responses (labelled "Demo data")
│  │  ├─ rate-limit.ts                  # hashed-IP buckets (no raw IPs)
│  │  └─ supabase/{browser.ts,server.ts}
│  ├─ scripts/seed-demo.ts              # CLI seeder (same generator as admin reseed)
│  └─ tests/fixtures/*.ics              # weekly classes, DST-crossing events, exams
├─ backend/                     # FastAPI + OR-Tools CP-SAT (Python 3.12, uv)
│  ├─ pyproject.toml, uv.lock, .python-version
│  ├─ app/
│  │  ├─ main.py                # FastAPI app; router prefix /api/py
│  │  ├─ schemas.py             # Pydantic request/response models (the API contract)
│  │  ├─ slots.py               # 30-min slot grid in America/Edmonton (zoneinfo), DST-safe
│  │  ├─ solver.py              # CP-SAT model
│  │  └─ diagnose.py            # infeasibility explanations + options (never relaxes sleep)
│  └─ tests/
│     ├─ test_solver.py         # sleep ≥ 7 h, no overlaps, hours met, wake drift respected
│     ├─ test_infeasible.py     # explanation instead of crash
│     └─ test_api.py            # HTTP contract via FastAPI TestClient
└─ supabase/
   └─ migrations/0001_poll.sql  # tables, RLS, aggregate views, realtime tick trigger
```

**Draft `vercel.json`** (I'll check it against the docs again before Phase 1 ships):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "web":    { "root": "frontend/", "framework": "nextjs" },
    "solver": { "root": "backend/",  "framework": "fastapi", "entrypoint": "app.main:app" }
  },
  "rewrites": [
    { "source": "/api/py/(.*)", "destination": { "service": "solver" } },
    { "source": "/(.*)",        "destination": { "service": "web" } }
  ]
}
```

`/api/py/*` goes to Python, and everything else, including the Next.js routes `/api/poll` and `/api/admin`, goes to Next.js.
**Fallback if Services (Beta) misbehaves:** the classic layout, where Python lives at `api/index.py` and `next.config.ts` rewrites `/api/py/*`. Phase 1 settles which one we use.

---

## 3. Data model

### 3a. On the device (localStorage, never uploaded)

All keys are versioned (`ssm:v1:…`) and checked on load. Bad data resets to defaults and never crashes the app.

```ts
// ssm:v1:sleepLog
type SleepNight = {
  nightOf: string;          // "2026-11-22" (the date the night starts, Edmonton)
  bed: string;              // ISO with offset, e.g. "2026-11-22T23:30:00-07:00"
  wake: string;             // ISO
  isFreeDay: boolean;       // next day has no class/work (for weekday vs weekend mid-sleep)
};
type SleepLog = { nights: SleepNight[]; /* last 7 */ plannedBed: string; plannedWake: string };

// ssm:v1:schedule
type EventType = "class" | "exam" | "work" | "other";
type ScheduleEvent = {
  id: string; title: string; type: EventType;
  start: string; end: string;           // ISO, already expanded occurrences
  source: "ics" | "manual";
  optional?: boolean;                   // optimizer may suggest moving it if infeasible
  courseCode?: string;                  // "COMP 2631", parsed from title when possible
};

// ssm:v1:plan        → last PlanResponse + the PlanRequest that produced it
// ssm:v1:poll:<pollId> → { token: uuid, submitted: boolean }
```

### 3b. Supabase Postgres (anonymous poll only)

```sql
polls          (id text pk, title text, is_open bool default true, created_at timestamptz)

poll_responses (
  id uuid pk default gen_random_uuid(),
  poll_id text references polls(id),
  dataset text check (dataset in ('live','demo')),
  device_hash text not null,                 -- sha256(localStorage token); NOT an IP, NOT a name
  barriers text[] not null,                  -- 1–3 items from the Q1 list (CHECK constraint)
  top_barrier text not null,                 -- CHECK: must be one of barriers
  supports text[] not null,                  -- 1–2 items from the Q3 list
  year_of_study text null, faculty text null, sleep_bucket text null,   -- optional, enum CHECKs
  created_hour timestamptz default date_trunc('hour', now()),            -- coarse on purpose
  unique (poll_id, dataset, device_hash)     -- one response per device per poll
)

poll_rate_limits (bucket text, window_start timestamptz, hits int, pk(bucket, window_start))
                 -- bucket = HMAC(ip, daily-rotating key) → no raw IPs stored, auto-expire

poll_tick       (poll_id, dataset, responses int, updated_at)  -- trigger-maintained; realtime-safe
```

**Security:**
- Row Level Security is **on** for every table, and `anon` has **no** access to the base tables.
- Inserts go only through `POST /api/poll`, which uses the service-role key on the server.
- The public reads only **aggregate views**: `v_barrier_share`, `v_top_barrier`, `v_support_share`, `v_totals`, `v_by_year`, `v_by_faculty`. The breakdown views use `HAVING count(*) >= 10`, so smaller groups never leave the database.
- **Realtime:** Supabase realtime can't stream views, and streaming the raw table would expose rows. So the dashboard subscribes to `poll_tick`, which only holds counts, and refetches the views whenever it changes. If the socket drops, it falls back to polling every 10 s.

---

## 4. API contract

### 4a. Next.js routes (Node, same origin)

| Route | Body | Responses |
|---|---|---|
| `POST /api/poll` | `{ pollId, token, barriers[1..3], topBarrier, supports[1..2], yearOfStudy?, faculty?, sleepBucket? }` | `201 {ok:true}` · `409 already_submitted` · `422 invalid` (with field errors) · `429 rate_limited` |
| `POST /api/admin` | header `x-admin-passcode`; `{ action: "reset_live" \| "reseed_demo", pollId }` | `200 {ok, counts}` · `401` · `429` (constant-time compare, rate-limited) |

The dashboard reads the aggregate views straight from Supabase with the anon key, filtered by `dataset`.
**Rate limiting note:** during the talk the whole class votes over MRU Wi-Fi from one public IP. So the IP limit is generous (about 120/min per hashed IP). The real one-per-device guard is the device token.

### 4b. FastAPI (`/api/py/*`, public via the Services rewrite)

`GET /api/py/health` → `{ "status": "ok", "python": "3.12.x", "ortools": "9.15.x", "cpsat_smoke": "OPTIMAL" }`

`POST /api/py/plan`. **Request:**
```jsonc
{
  "timezone": "America/Edmonton",
  "window": { "start_date": "2026-12-01", "days": 10 },          // 1–14
  "slot_minutes": 30,
  "sleep": {
    "min_hours": 7,            // hard floor; the API rejects < 7
    "target_hours": 8,
    "preferred_wake": "07:30",
    "wake_drift_minutes": 30
  },
  "study_rules": {
    "max_block_minutes": 120, "break_minutes": 30,
    "no_study_before_bed_minutes": 60, "daily_cap_hours": 6,
    "commute_buffer_minutes": 0
  },
  "fixed_events": [
    { "id": "e1", "title": "COMP 2631 Lecture", "type": "class",
      "start": "2026-12-02T08:30:00-07:00", "end": "2026-12-02T09:50:00-07:00", "optional": false }
  ],
  "courses": [
    { "id": "comp2631", "name": "COMP 2631", "study_hours": 8, "exam_event_id": "e9" }
  ],
  "alertness": {                                   // optional, from Feature A
    "start": "2026-12-01T00:00:00-07:00", "slot_minutes": 30, "values": [62, 58, ...]   // 0–100
  }
}
```

**Response (always 200 for a valid request, feasible or not):**
```jsonc
{
  "status": "optimal" | "feasible" | "infeasible",
  "sessions": [ { "course_id": "comp2631", "start": "...", "end": "..." } ],
  "sleep":    [ { "night_of": "2026-12-01", "bed": "...", "wake": "...", "hours": 8.0 } ],
  "totals":   [ { "course_id": "comp2631", "planned_hours": 8, "required_hours": 8 } ],
  "stats":    { "wake_spread_minutes": 30, "solve_ms": 2140, "objective": 1234 },
  "infeasibility": null | {
    "summary": "COMP 2631 is 4 h short before its exam on Dec 4.",
    "shortfalls": [ { "course_id": "comp2631", "short_hours": 4, "reason": "only 4 free study hours before Dec 4 after 7 h sleep and your shifts" } ],
    "options": [
      { "kind": "start_earlier",   "label": "Start planning on Nov 28 instead of Dec 1" },
      { "kind": "move_optional",   "label": "Move 'Sat shift' (marked optional)", "event_id": "e5" },
      { "kind": "reduce_hours",    "label": "Plan 4 h for COMP 2631 instead of 8" }
    ]
  }
}
```
`422` is for malformed input, including `min_hours < 7`.

**How infeasibility gets explained without ever touching sleep:**
1. Run a quick capacity pre-check for each course: free slots before its exam, after sleep, events and caps.
2. If CP-SAT returns INFEASIBLE, re-solve a version where study hours are *soft* (maximize hours covered) and sleep stays *hard*.
3. Each course's shortfall is "required minus achieved". That gives the "COMP 2631 is 4 h short" message, and the options come from it.

**Solver sketch:**
- 48 slots/day × ≤14 days = ≤672 slots.
- Each night is a sleep interval variable that's at least 14 slots long, with wake within preferred ± drift.
- `AddNoOverlap` covers sleep, events and study.
- Block length and breaks use sliding-window sums. No study in the 2 slots before bed.
- Soft objective weights, in order: wake variability > spread across days > alertness weight > late-night penalty.
- `max_time_in_seconds = 10`, `num_workers = 1` (keeps it deterministic and fits 1 vCPU).

---

## 5. Alertness model plan (Feature A)

The prompt asks for the two-process model (Borbély 1982; Daan, Beersma & Borbély 1984) plus sleep inertia from Åkerstedt & Folkard's three-process model.

**My recommendation:** implement S, C and W with **the three-process model's own equations and parameters**.
- It *is* the two-process model (S + C) extended with W, calibrated on one alertness scale.
- Mixing Daan's 0–1 S scale with Åkerstedt's W scale would need a scaling factor that no paper gives, and that would mean inventing a number.
- Daan et al.'s time constants are cited in comments and on the "How this works" page as the origin of Process S.

**Parameters I plan to use.** These are recalled from the literature and **not yet verified**. In Phase 2 I'll check each one against the paper. Any I can't confirm becomes a `// TODO(verify)` and I'll tell you.

| Symbol | Meaning | Planned value | Source to verify |
|---|---|---|---|
| La | lower asymptote of S while awake | 2.4 | Åkerstedt & Folkard (1997); Åkerstedt, Folkard & Portin (2004) |
| k_wake | S decay rate while awake | 0.0353 /h | same |
| Ha | upper asymptote of S during sleep | 14.3 | same |
| k_sleep | S recovery rate during sleep | 0.381 /h | same (also check for a breakpoint that slows recovery near the asymptote) |
| M | amplitude of C | 2.5 | same |
| p | acrophase of C | 16.8 h | same |
| Wc | initial sleep inertia | −5.72 | same |
| k_W | inertia decay rate | 1.51 /h | same |
| τr, τd | S rise/decay time constants (two-process origin) | 18.2 h / 4.2 h | Daan, Beersma & Borbély (1984) |

**Circadian phase from mid-sleep:**
- Use mid-sleep on free days, corrected for sleep debt (MSFsc), from the Munich ChronoType approach (Roenneberg et al., 2003; 2004). It's computed from the weekday vs free-day nights in the 7-night log.
- Shift `p` by the user's MSFsc minus the reference mid-sleep.
- **Known gap:** I don't yet know which mid-sleep the published `p = 16.8` corresponds to. If the source doesn't say, that reference value stays a flagged TODO, and the How-it-works page says so.

**Output:**
- 15-minute steps for tomorrow, as `A = S + C + W`.
- The 0–100 index is a fixed linear display rescale of the model scale (a UI choice, documented as one).
- **Bands are personal:** the user's waking min–max across their logged week is split into thirds (low, moderate, high).

**Warnings:**
- An event starts inside a low band, or
- an event starts within 60 min of waking (inertia).
- The card says which cause applies, for example: "COMP 2631 midterm at 8:00 a.m. is 30 min after waking: sleep inertia + low circadian alertness."

**Gentle note:** if at least 4 of the last 7 nights are under 5 h, a calm card points to MRU Health Services and Wellness Services. It never diagnoses.

---

## 6. Phase plan (7 days)

| Date | Phase | Done when |
|---|---|---|
| Nov 23–24 | **Step 0** approval → **Phase 1**: scaffold, `git init`, hello-world Next.js page + `/api/py/health` that imports OR-Tools and solves a tiny CP-SAT model, deployed to Vercel | Prod URL loads on your phone. The health check shows OR-Tools working. We know the bundle size and cold-start time. |
| Nov 24–25 | **Phase 2**: Feature A + Vitest (S rises awake and falls asleep, C period ≈ 24 h, short night lowers tomorrow, inertia lowers the first hour, deterministic) | Log sleep, import .ics, see Sleep Weather, slider, comparison, How-it-works |
| Nov 26–27 | **Phase 3**: Feature C (poll, dashboard, presentation mode, demo seed, admin reset) | The class can vote from the QR and the chart moves live |
| Nov 27–28 | **Phase 4**: Feature B + pytest | Plan from the imported schedule, .ics download, infeasible case explained |
| Nov 29 | **Phase 5**: polish, home, About, README with Mermaid, demo script | Full walkthrough on a phone |
| Nov 30 | Buffer: phone testing, rehearse the demo, fix bugs | **Deployed demo ready** |

After every phase: lint + tests, a commit, and a short "what works / what's left / test it on your phone" note.
**If we fall behind**, I'll cut from Phase 4 first (desktop week grid → list only; fewer soft objectives), so Phases 1–3 keep their quality.

---

## 7. Visual direction ("cool visuals", matching the slides)

**Night-sky theme:**
- Navy `#27304F` canvas with a slow, subtle twinkling starfield. It's CSS-only and switches off under `prefers-reduced-motion`.
- A moon in the hero changes with the time of day.

**Sticker cards:**
- Rounded-3xl cards with 2 px black outlines and a hard 4 px offset black shadow, matching the black outlines in the slides.
- Card colours: yellow, sage, lilac and coral.

**"Sleep Weather" chart:**
- An area chart filled with a navy → warm-yellow gradient.
- Low-alertness windows get coral hatching. Classes and exams appear as labelled pins on the timeline.
- A sky-gradient strip runs under the x-axis (night → dawn → day → dusk).
- Each band gets a weather icon: ☀ high, ⛅ moderate, 🌧 low. These are custom SVGs, not an icon library.

**Other screens:**
- **"What if I sleep at…" slider:** a moon you drag along a night-sky arc. The curve morphs live.
- **Optimizer timeline:** sleep (lilac), classes (sage), study (yellow), exams (coral).
- **Poll:** big tappable chips, and a burst of stars on submit.
- **Presentation mode:** a giant QR code on a yellow card, a live counter that ticks up, and bars that animate in.

**Accessibility (contrast checked against WCAG):**
- Yellow, sage and lilac on navy all pass AA: 9.8, 9.0 and 8.1 to 1.
- **Coral on navy is only 4.24:1, which fails AA for body text.** So coral is used only as a fill behind black text (6.9:1) or for large text and icons.
- Every chart also has a screen-reader table and keyboard-reachable controls.

---

## 8. Dependencies

The prompt names Next.js, TypeScript, Tailwind, Recharts (8.9 MB) and OR-Tools (+ numpy and pandas), so I'm treating those as approved, along with the standard Next.js toolchain (ESLint, Vitest).

**Small additions:**

| Package | Size |
|---|---|
| ical.js | 1.2 MB |
| @supabase/supabase-js | 0.7 MB |
| qrcode.react | 0.1 MB |
| @date-fns/tz | 0.1 MB |

**Avoiding on purpose:**

| Package | Size | Instead |
|---|---|---|
| zod | 6.1 MB | hand-written validators; Pydantic on the Python side |
| date-fns | 10.9 MB | not needed |
| lucide-react | 40 MB | custom SVG icons |
| animation library | n/a | CSS-only animation |

**Needs your OK:** `ruff`, a Python linter at about 11 MB, dev-only. Without it, Python "lint" is just `python -m compileall` plus type-checked Pydantic models.

---

## 9. What I need from you

1. **Approve or change** this proposal. In particular, the §5 choice of three-process model equations for S, C and W.
2. **PDFs of the model papers.** Can you get them through the MRU Library? Daan et al. (1984), Åkerstedt & Folkard (1997) and Åkerstedt, Folkard & Portin (2004). Drop them in `docs/sources/`, which is gitignored. Most are paywalled, so without them some parameters may end up as TODOs.
3. **Accounts.** I can't create these for you:
   - Run `vercel login` in a terminal.
   - Create a free Supabase project and put its keys in `.env.local`.
   - Tell me whether you want a GitHub repo, which gives your groupmates preview links, or just CLI deploys.
4. **A real `.ics` file** from your class schedule (where do MRU students export it from?) so I can test against it. Also confirm the **faculty list** for the optional poll question. My draft: Arts; Business & Communication Studies; Health, Community & Education; Science & Technology; Open Studies / undeclared; prefer not to say.
5. **ruff: yes or no?**
