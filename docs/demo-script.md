# Sleep Smart MRU: 3-minute live demo

Live app: https://sleep-smart-mru.vercel.app

**Bold** = what to tap or show. Quotes = what to say. Timings are cumulative; the whole thing is
3:00. If you're running long, cut the optional sleep guide step (2:00–2:15).

## Before the talk

### The day before

- [ ] Rehearse the full script on the **same laptop and phone** you'll present with, and time it.
- [ ] Record a backup screen recording of the whole demo (Mac: Cmd+Shift+5; iPhone: Control
      Centre → Screen Recording) in case the Wi-Fi fails.
- [ ] Decide who talks and who taps. One person drives the screen; the speaker doesn't need to
      touch anything.

### The morning of

- [ ] Open https://sleep-smart-mru.vercel.app/status. Both checks (website and study planner)
      should pass.
- [ ] Open the Supabase dashboard and make sure the project isn't paused. If it is, restore it; it
      takes a few minutes.
- [ ] **Clear the test votes:** /dashboard → open **Organizer tools** at the bottom → type the
      admin passcode → **Reset live responses** → confirm. This deletes every live response and
      can't be undone, so do it before the talk, never while projecting (and never type the
      passcode on the projector).
- [ ] **Load the backup data:** in the same **Organizer tools** → **Reload demo data**. It's fake,
      labelled "Demo data", and only for the fallback below.
- [ ] **Set up Sleep Weather on the demo device** (it saves on that device only):
  - [ ] Your sleep: keep or edit the 7 example nights and tonight's plan (e.g. bed 11:30 p.m.,
        alarm 7:30 a.m.).
  - [ ] Your schedule → add an event by hand: "COMP 2631 midterm", **tomorrow**, 8:00–9:30 a.m.
        Do this the same morning, since "tomorrow" has to be the day after the talk.
  - [ ] Check that a coral warning appears for the midterm.
- [ ] **Set up the planner:** /plan → under **Your exams**, Course "COMP 2631", Study hours 6,
      Exam: pick the midterm (exams from Sleep Weather are listed there) → **Build my plan** once,
      so the plan is ready on screen.

### Ten minutes before

- [ ] Open these tabs, in order: `/present`, `/forecast`, `/plan`, `/learn#caffeine`, `/about`.
- [ ] Do Not Disturb on, charger plugged in, brightness up. Zoom the browser to about 125% so the
      back row can read it.
- [ ] Test the projector and the Wi-Fi. Have a phone hotspot ready as a backup connection.

## The script

### 0:00–0:15 · Get the poll going

**Show:** the `/present` tab, with its big QR code.

> "Before we start, scan this. It's our sleep barrier poll: three questions, anonymous, under a
> minute. We'll look at your answers at the end."

Leave it up for a few seconds while people scan.

### 0:15–0:35 · The problem

> "At MRU, 33% of students said sleep hurt their academic performance, right beside stress and
> anxiety. Most of us already know we should get 7 to 9 hours. The problem isn't knowing, it's
> doing. Research shows that information alone usually doesn't change sleep habits, but short,
> personal tools can. So instead of another poster full of tips, we built the tools."

### 0:35–1:15 · Sleep Weather

**Show:** the `/forecast` tab.

> "This is what the QR code on our posters opens. Sleep Weather is a weather forecast for your
> brain: it predicts how alert you'll be tomorrow from how you've slept and when your classes are."

- **Point at the outlook and the chart:** "Yellow is my predicted alertness tomorrow. The coral
  zones are when I'm low, compared with my own week."
- **Point at the coral warning card** for the 8 a.m. midterm and read it out.
- **Drag the "What if I sleep at…" slider** to 2 a.m.: "Watch the morning get worse." Drag it back.

> "Same advice you already knew, but now it's your exam and your bedtime. That's the step from
> knowing to doing. It's an educational estimate from a published sleep model, not a medical tool."

### 1:15–2:00 · Exam-crunch planner

**Show:** the `/plan` tab, with the plan already built.

> "Exam season is when sleep goes first. Tell the planner your exams and how many hours each
> needs, and it builds a study plan around your classes and shifts."

- **Point at "Your plan is ready"** and the per-course totals.
- **Point at the week view:** the study blocks and the sleep blocks.

> "The one rule it never breaks: sleep never drops below 7 hours. If your plan doesn't fit, it
> tells you why and gives you options, like starting earlier, instead of cutting sleep."

- **Point at "Download calendar (.ics)":** "And it goes straight into your phone's calendar."

### 2:00–2:15 · Sleep guide (optional, cut if long)

**Show:** the `/learn#caffeine` tab.

> "There's also a sleep guide, where every tip links to the study behind it. This calculator shows
> how much caffeine is still in your body at bedtime."

### 2:15–2:40 · The poll, live

**Show:** the `/present` tab again. The bars have filled in while we talked.

> "Here's what you said cuts into your sleep. These are your answers, live. A committee at MRU
> would see this on our dashboard and know which barriers to fix first. No names, no emails, and
> breakdowns only appear for groups of 10 or more."

### 2:40–3:00 · The pitch and close

**Show:** the `/about` tab, scrolled to **Our pitch to MRU** (the QR code).

> "Our pitch to MRU: posters and table tents around campus with this QR code, plus reminders in
> the MRU app, for about $1,000 a term. Your sleep data never leaves your phone. Sleep Smart MRU:
> turning what we know about sleep into what we do tonight. Thank you."

## If something goes wrong

- **Few or no poll answers yet:** on `/dashboard`, switch the view to **Demo data** and say: "This is
  practice data from our rehearsal, and it's labelled that way."
- **Poll says the database isn't connected:** Supabase is probably paused. Use the demo data view,
  or play the backup recording.
- **The planner is slow or errors:** the plan you built in the morning is saved on the device, so
  reload `/plan` and it's still there.
- **No Wi-Fi:** switch to the hotspot. If that fails too, play the backup recording and talk over it.

## Likely questions

- **Is this medical advice?** No. It gives educational estimates from published research and says
  so on every screen. For real concerns it points to MRU Health Services and Wellness Services
  (Wellness Centre, U216).
- **Where does my data go?** Sleep logs, schedules and plans stay in your phone's browser. Only
  the anonymous poll is sent to us, with no names, emails or IP addresses.
- **How accurate is Sleep Weather?** It shows general patterns from the three-process model of
  alertness (grogginess after waking, the early-morning dip, short sleep), not exact personal
  predictions. Caffeine, stress, naps and illness aren't included.
- **Why would students use it when they ignore posters?** Information alone rarely changes
  behaviour (Blunden et al., 2012). A short, personalized online program did: 50.3% of students
  improved their sleep behaviours versus 39.5% in the comparison group (Hershner & O'Brien, 2018).
- **What does the money pay for?** Posters and table tents with the QR code, plus reminders in the
  MRU app, at about $1,000 a term.
- **Where do your facts come from?** Every source is on the About page in APA format, with links.
