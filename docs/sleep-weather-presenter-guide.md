# Sleep Weather: presenter guide

Link: https://sleep-smart-mru.vercel.app/forecast (or tap **Sleep Weather** on the home page)

## The one-sentence pitch

Sleep Weather is a weather forecast for your brain. It predicts how alert you'll be at each point
tomorrow from how you've slept and when your classes are. Then it warns you when an exam lands in a
slump, so you can fix it tonight.

**Why it fits our research:** most students already *know* they need 7–9 hours (CSEP, 2020). Our
gap is knowing vs doing. Information alone rarely changes behaviour (Blunden et al., 2012), but
short, personalized tools do (Hershner & O'Brien, 2018). Sleep Weather makes the advice personal:
"*your* 8 a.m. midterm, *your* bedtime."

## What each part does (top to bottom)

### 1. The outlook
A one-word forecast for tomorrow:
- **Mostly clear:** less than 15% of your waking day is low.
- **Patchy fog:** up to about a third is low.
- **Heavy fog:** more than that.

Below it: when you'll wake, how long you'll have slept, your **peak alertness** time and your
**lowest** point.

### 2. The chart
- **Yellow line:** predicted alertness, 0–100, every 15 minutes for tomorrow.
- **Coral dashed zones:** "low for you." This is the bottom third of *your own* range from the
  past week, not a fixed score.
- **Lilac shading:** when you're asleep.
- **Bars along the bottom:** your events (green = classes, coral = exams).
- **Show as a table:** the same numbers as text, for screen readers.

### 3. Tomorrow's events (warnings)
Each class, exam or shift that starts **within an hour of waking** or **inside a low window** gets a
card that says why. For example:

> "COMP 2631 midterm at 8:00 a.m. is 30 min after waking: sleep inertia + low circadian alertness."

If nothing is at risk, it says so in a green card.

### 4. What if I sleep at…
- A bedtime slider (9 p.m. to 4 a.m.). The whole chart redraws as you drag.
- It tells you how many points higher or lower tomorrow averages compared with your plan.
- **Make … my plan** saves the new bedtime.

### 5. Compare two bedtimes
- Two mini forecasts side by side, e.g. 11:30 p.m. vs 2:00 a.m.
- Each shows hours of sleep, average alertness and number of warnings.

### 6. Your sleep
- **Tonight's plan:** bedtime and alarm.
- **Last 7 nights:** when you went to bed and woke up. Tick **No class or work next day** for
  weekends or days off; the app uses those nights to estimate whether you're a night owl.
- It starts with example times (it says so). **Copy tonight's plan to all 7 nights** is a shortcut.

### 7. Your schedule
- **Import .ics calendar:** load your class calendar file. Weekly classes repeat automatically and
  times stay right across daylight-saving changes. The file is read on the phone; nothing is uploaded.
- **Add an event by hand:** name, date, start, end. Exams and shifts are recognized from the name,
  and you can change the type in the list.

### 8. Support note (only shows when needed)
If 4 or more of the last 7 nights were under 5 hours, a gentle note points to MRU Health Services
and Wellness Services (Wellness Centre, U216). It never diagnoses.

### 9. How this works
A plain-language page explaining the science, what's personal, the limits, and the references.

## The science in 20 seconds (for the class)

Your alertness is three things added together:

1. **Sleep pressure** builds the longer you're awake, and sleep clears it.
2. **Your body clock** dips in the early morning and peaks in the late afternoon, no matter how you
   slept.
3. **Sleep inertia** is the grogginess in roughly the first hour after waking.

This is the published *three-process model of alertness* (Åkerstedt & Folkard), which builds on the
classic two-process model of sleep (Borbély). We use its published values.

## Suggested 90-second live demo

1. **Home → Sleep Weather.** "This is what the QR code on our posters opens."
2. Point at the **outlook and chart**: "Yellow is my predicted alertness tomorrow; coral is when I'm
   low."
3. **Add an event by hand:** "COMP 2631 midterm", tomorrow, 8:00–9:30 → **Add event**.
4. Scroll up: the **coral warning** appears. Read it out loud.
5. **Drag the bedtime slider** to 2 a.m. "Watch the curve drop and the morning get worse." Then
   drag back.
6. **Compare two bedtimes** for the side-by-side.
7. Close: "Same knowledge you already had, 7–9 hours, but now it's *your* exam and *your* bedtime.
   That's the step from knowing to doing."

Tip: rehearse on the phone you'll present with, and add the midterm *before* class as a backup.

## Likely questions

- **Is it medical advice?** No. It's an educational estimate from a published model, and it says so
  on every screen.
- **Where does my data go?** Nowhere. The sleep log and schedule stay in the phone's browser. Only
  the anonymous poll (a separate feature) sends anything.
- **How accurate is it?** It shows general patterns (grogginess after waking, the early-morning dip,
  the effect of short sleep), not exact personal predictions. Caffeine, stress, naps and illness
  aren't included.
- **Why does one late night only drop it a few points?** In the model, one night's sleep pressure
  recovers fast. The bigger effects are *timing*: waking right before an exam, or an early-morning
  exam during your body clock's low.
