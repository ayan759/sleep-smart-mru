"""Exam-crunch study planner: OR-Tools CP-SAT over 30-minute slots in America/Edmonton.

Hard rules (never traded away):
  * every night has exactly one contiguous sleep block of at least `min_hours` (>= 7 h), chosen
    from candidates whose wake time is within ±drift of the preferred wake time;
  * nothing overlaps fixed events (with optional commute buffer), sleep, or other study;
  * each course's study hours are completed before its exam;
  * study blocks are at most `max_block_minutes`, followed by a break;
  * no study within `no_study_before_bed_minutes` of bedtime; a daily study cap.
Soft objective (in priority order): steady wake time, spread study across days, study in
higher-alertness slots, avoid late-night study.

If the hard rules can't all hold, `diagnose` re-solves with study hours made *soft* (sleep stays
hard) to report each course's shortfall and concrete options. Sleep is never relaxed.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from ortools.sat.python import cp_model

from .schemas import (
    CourseTotal,
    Infeasibility,
    PlanOption,
    PlanRequest,
    PlanResponse,
    Session,
    Shortfall,
    SleepBlock,
    Stats,
)
from .slots import SLOT, TZ, Grid, build_grid

SOLVER_TIME_LIMIT_S = 5.0  # stays well inside a serverless request
STUDY_EARLIEST_MINUTE = 6 * 60  # no study before 06:00 local …
STUDY_LATEST_MINUTE = 60  # … or after 01:00 local
LATE_NIGHT_FROM_MINUTE = 22 * 60  # soft penalty for study 22:00–01:00

# Objective weights (larger = more important). Display/tuning choices, not physiology.
W_WAKE_SPREAD = 1000  # per 30 min between earliest and latest wake time
W_WAKE_OFF_PREFERRED = 60  # per 30 min away from the preferred wake time
W_SLEEP_SHORT_OF_TARGET = 200  # per 30 min below the target sleep length
W_SLEEP_OVER_TARGET = 15  # per 30 min above target (don't oversleep the plan)
W_CRAM = 100  # per 30 min of a course's busiest study day (spaced practice)
W_LATE = 30  # per 30 min of late-night study
W_ALERTNESS = 1  # × alertness/10 (0–10) per study slot, subtracted
W_FRAGMENT = 80  # per study block started (prefer real blocks over scattered 30-min pieces)


@dataclass
class Prepared:
    req: PlanRequest
    grid: Grid
    busy: list[str | None]  # event id occupying each slot (incl. commute buffer), or None
    deadlines: dict[str, int]  # course id → first slot index NOT allowed (exam start)
    alert: list[int]  # 0–10 per slot
    first_study: int  # no study before the first morning's wake-up
    study_end: int  # study only inside the planning window
    night_candidates: list[list[tuple[int, int, int]]] = field(default_factory=list)  # (bed, wake, delta)


def _hhmm(s: str) -> int:
    h, m = s.split(":")
    return int(h) * 60 + int(m)


def _slot_of(grid: Grid, day: int, minute: int) -> int | None:
    for idx in range(grid.day_start[day], len(grid.slots)):
        s = grid.slots[idx]
        if s.day != day:
            return None
        if s.local_minute == minute:
            return idx
    return None


def prepare(req: PlanRequest, *, drop_optional: bool = False) -> Prepared:
    grid = build_grid(req.window.start_date, req.window.days, day_starts=req.day_starts)
    n = len(grid.slots)
    buffer = timedelta(minutes=req.study_rules.commute_buffer_minutes)

    busy: list[str | None] = [None] * n
    for e in req.fixed_events:
        if drop_optional and e.optional:
            continue
        a = grid.index_at(e.start - buffer)
        b = grid.ceil_index(e.end + buffer)
        for i in range(a, b):
            if busy[i] is None:
                busy[i] = e.id

    events = {e.id: e for e in req.fixed_events}
    deadlines: dict[str, int] = {}
    for c in req.courses:
        exam_start: datetime | None = c.exam_start
        if c.exam_event_id and c.exam_event_id in events:
            exam_start = events[c.exam_event_id].start
        deadlines[c.id] = grid.index_at(exam_start) if exam_start else grid.index_at(grid.window_end)

    alert = [5] * n
    if req.alertness and req.alertness.values:
        a0 = req.alertness.start
        for i, s in enumerate(grid.slots):
            k = int((s.start - a0) / SLOT)
            if 0 <= k < len(req.alertness.values):
                alert[i] = max(0, min(10, round(req.alertness.values[k] / 10)))

    pref = _hhmm(req.sleep.preferred_wake)
    pref_slot_minute = pref - pref % 30
    first = _slot_of(grid, 0, pref_slot_minute) or 0

    prep = Prepared(
        req=req,
        grid=grid,
        busy=busy,
        deadlines=deadlines,
        alert=alert,
        first_study=first,
        study_end=grid.index_at(grid.window_end),
    )

    drift = req.sleep.wake_drift_minutes // 30
    min_len = math.ceil(req.sleep.min_hours * 2)
    target_len = max(min_len, round(req.sleep.target_hours * 2))
    max_len = target_len + 2
    for k in range(req.window.days):
        cands: list[tuple[int, int, int]] = []
        for delta in range(-drift, drift + 1):
            w = _slot_of(grid, k + 1, pref_slot_minute + 30 * delta) if 0 <= pref_slot_minute + 30 * delta < 1440 else None
            if w is None:
                continue
            for length in range(min_len, max_len + 1):
                b = w - length
                if b < 0:
                    continue
                if any(busy[i] is not None for i in range(b, w)):
                    continue
                cands.append((b, w, delta))
        prep.night_candidates.append(cands)
    return prep


def _study_allowed(prep: Prepared, i: int) -> bool:
    s = prep.grid.slots[i]
    if prep.busy[i] is not None or i < prep.first_study or i >= prep.study_end:
        return False
    m = s.local_minute
    return m >= STUDY_EARLIEST_MINUTE or m < STUDY_LATEST_MINUTE


@dataclass
class Built:
    model: cp_model.CpModel
    x: dict[tuple[str, int], cp_model.IntVar]
    y: list[list[cp_model.IntVar]]
    covered: dict[str, cp_model.LinearExpr]
    short: dict[str, cp_model.IntVar]
    required: dict[str, int]


def build(prep: Prepared, *, soft_hours: bool = False, daily_cap_hours: float | None = None) -> Built:
    req = prep.req
    grid = prep.grid
    n = len(grid.slots)
    m = cp_model.CpModel()

    # Sleep: exactly one candidate block per night (hard; guarantees >= min_hours).
    y: list[list[cp_model.IntVar]] = []
    cover: list[list[cp_model.IntVar]] = [[] for _ in range(n)]
    for k, cands in enumerate(prep.night_candidates):
        ys = [m.new_bool_var(f"sleep_{k}_{j}") for j in range(len(cands))]
        m.add_exactly_one(ys)  # an empty list makes the model infeasible, as it should
        for (b, w, _), yv in zip(cands, ys):
            for i in range(b, w):
                cover[i].append(yv)
        y.append(ys)

    # Study variables only where study is possible.
    x: dict[tuple[str, int], cp_model.IntVar] = {}
    per_slot: list[list[cp_model.IntVar]] = [[] for _ in range(n)]
    for c in req.courses:
        for i in range(min(prep.deadlines[c.id], n)):
            if _study_allowed(prep, i):
                v = m.new_bool_var(f"x_{c.id}_{i}")
                x[(c.id, i)] = v
                per_slot[i].append(v)

    # One activity per slot.
    for i in range(n):
        if per_slot[i] or len(cover[i]) > 1:
            m.add(sum(per_slot[i]) + sum(cover[i]) <= 1)

    # No study shortly before bed.
    pre = req.study_rules.no_study_before_bed_minutes // 30
    if pre:
        for k, cands in enumerate(prep.night_candidates):
            for (b, _, _), yv in zip(cands, y[k]):
                for i in range(max(0, b - pre), b):
                    if per_slot[i]:
                        m.add(sum(per_slot[i]) + yv <= 1)

    # Block length + break: any (block + break) window holds at most `block` study slots.
    block = max(1, req.study_rules.max_block_minutes // 30)
    brk = max(1, req.study_rules.break_minutes // 30)
    span = block + brk
    for start in range(0, n - span + 1):
        window = [v for i in range(start, start + span) for v in per_slot[i]]
        if len(window) > block:
            m.add(sum(window) <= block)

    # Daily cap.
    cap = math.floor(2 * (daily_cap_hours if daily_cap_hours is not None else req.study_rules.daily_cap_hours))
    for d in range(req.window.days):
        day_vars = [v for i in range(n) if grid.slots[i].day == d for v in per_slot[i]]
        if len(day_vars) > cap:
            m.add(sum(day_vars) <= cap)

    # Required hours (hard, or soft with explicit shortfall when diagnosing).
    required: dict[str, int] = {}
    covered: dict[str, cp_model.LinearExpr] = {}
    short: dict[str, cp_model.IntVar] = {}
    for c in req.courses:
        need = math.ceil(c.study_hours * 2)
        required[c.id] = need
        cv = [x[(c.id, i)] for i in range(n) if (c.id, i) in x]
        expr = sum(cv) if cv else 0
        covered[c.id] = expr
        if soft_hours:
            s = m.new_int_var(0, need, f"short_{c.id}")
            m.add(expr + s == need)
            short[c.id] = s
        else:
            m.add(expr == need)

    # ---------------- objective
    terms = []
    drift = req.sleep.wake_drift_minutes // 30
    min_len = math.ceil(req.sleep.min_hours * 2)
    target_len = max(min_len, round(req.sleep.target_hours * 2))
    offsets = []
    for k, cands in enumerate(prep.night_candidates):
        if not cands:
            continue
        o = m.new_int_var(-drift, drift, f"wake_off_{k}")
        m.add(o == sum(yv * delta for (_, _, delta), yv in zip(cands, y[k])))
        offsets.append(o)
        for (b, w, delta), yv in zip(cands, y[k]):
            length = w - b
            cost = (
                W_SLEEP_SHORT_OF_TARGET * max(0, target_len - length)
                + W_SLEEP_OVER_TARGET * max(0, length - target_len)
                + W_WAKE_OFF_PREFERRED * abs(delta)
            )
            if cost:
                terms.append(cost * yv)
    if len(offsets) > 1:
        hi = m.new_int_var(-drift, drift, "wake_hi")
        lo = m.new_int_var(-drift, drift, "wake_lo")
        m.add_max_equality(hi, offsets)
        m.add_min_equality(lo, offsets)
        terms.append(W_WAKE_SPREAD * (hi - lo))

    for c in req.courses:
        busiest = m.new_int_var(0, cap, f"busiest_{c.id}")
        for d in range(req.window.days):
            dv = [x[(c.id, i)] for i in range(n) if grid.slots[i].day == d and (c.id, i) in x]
            if dv:
                m.add(busiest >= sum(dv))
        terms.append(W_CRAM * busiest)

    for (cid, i), v in x.items():
        minute = grid.slots[i].local_minute
        late = minute >= LATE_NIGHT_FROM_MINUTE or minute < STUDY_LATEST_MINUTE
        weight = (W_LATE if late else 0) - W_ALERTNESS * prep.alert[i]
        if weight:
            terms.append(weight * v)

    # Prefer fewer, longer blocks: pay for each block start.
    for (cid, i), v in x.items():
        prev = x.get((cid, i - 1))
        if prev is None:
            terms.append(W_FRAGMENT * v)
        else:
            started_here = m.new_bool_var(f"start_{cid}_{i}")
            m.add(started_here >= v - prev)
            terms.append(W_FRAGMENT * started_here)

    if soft_hours:
        # Covering as much as possible dominates everything else; sleep stays hard.
        terms.append(100_000 * sum(short.values()))

    m.minimize(sum(terms))
    return Built(m, x, y, covered, short, required)


def _solve(built: Built, time_limit: float = SOLVER_TIME_LIMIT_S) -> tuple[cp_model.CpSolver, int]:
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    # Several search strategies interleaved on ONE thread: deterministic and suited to 1 vCPU,
    # and much better plans within the time limit than a single strategy.
    solver.parameters.num_workers = 8
    solver.parameters.interleave_search = True
    solver.parameters.random_seed = 7
    status = solver.solve(built.model)
    return solver, status


def _extract(prep: Prepared, built: Built, solver: cp_model.CpSolver):
    grid = prep.grid
    sessions: list[Session] = []
    for c in prep.req.courses:
        chosen = sorted(i for (cid, i) in built.x if cid == c.id and solver.value(built.x[(cid, i)]))
        run: list[int] = []
        for i in chosen + [None]:  # type: ignore[list-item]
            if run and (i is None or i != run[-1] + 1):
                sessions.append(
                    Session(course_id=c.id, start=grid.slots[run[0]].start, end=grid.slots[run[-1]].start + SLOT)
                )
                run = []
            if i is not None:
                run.append(i)
    sessions.sort(key=lambda s: s.start)

    sleep: list[SleepBlock] = []
    offs: list[int] = []
    for k, cands in enumerate(prep.night_candidates):
        for (b, w, delta), yv in zip(cands, built.y[k]):
            if solver.value(yv):
                bed = grid.slots[b].start
                sleep.append(
                    SleepBlock(
                        night_of=prep.req.window.start_date + timedelta(days=k),
                        bed=bed,
                        wake=grid.slots[w].start,
                        hours=(w - b) / 2,
                    )
                )
                offs.append(delta)
    totals = [
        CourseTotal(
            course_id=c.id,
            planned_hours=sum(1 for (cid, i) in built.x if cid == c.id and solver.value(built.x[(cid, i)])) / 2,
            required_hours=c.study_hours,
        )
        for c in prep.req.courses
    ]
    spread = (max(offs) - min(offs)) * 30 if offs else 0
    return sessions, sleep, totals, spread


def capacity_ok(prep: Prepared) -> bool:
    """Fast necessary check before the full solve: sleep is possible every night, and for every
    exam deadline the hours due by then fit in the free (non-sleep-core) study time before it."""
    if any(not c for c in prep.night_candidates):
        return False
    req = prep.req
    cap_slots = math.floor(2 * req.study_rules.daily_cap_hours)
    # Study capacity per day, ignoring sleep placement (optimistic) but honouring the daily cap.
    by_day: dict[int, list[int]] = {}
    for i in range(len(prep.grid.slots)):
        if _study_allowed(prep, i):
            by_day.setdefault(prep.grid.slots[i].day, []).append(i)
    for c in sorted(req.courses, key=lambda c: prep.deadlines[c.id]):
        deadline = prep.deadlines[c.id]
        due = sum(math.ceil(o.study_hours * 2) for o in req.courses if prep.deadlines[o.id] <= deadline)
        cap = sum(min(cap_slots, sum(1 for i in idx if i < deadline)) for idx in by_day.values())
        if due > cap:
            return False
    return True


def plan(req: PlanRequest) -> PlanResponse:
    started = time.perf_counter()
    prep = prepare(req)
    ms = lambda: round((time.perf_counter() - started) * 1000)  # noqa: E731

    status = cp_model.INFEASIBLE
    if capacity_ok(prep):
        built = build(prep)
        solver, status = _solve(built)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        sessions, sleep, totals, spread = _extract(prep, built, solver)
        return PlanResponse(
            status="optimal" if status == cp_model.OPTIMAL else "feasible",
            sessions=sessions,
            sleep=sleep,
            totals=totals,
            stats=Stats(wake_spread_minutes=spread, solve_ms=ms(), objective=solver.objective_value),
        )

    from .diagnose import diagnose  # local import keeps the happy path lean

    return diagnose(prep, started)


def local_label(t: datetime) -> str:
    """e.g. 'Dec 4' in Edmonton time."""
    lt = t.astimezone(TZ)
    return f"{lt.strftime('%b')} {lt.day}"
