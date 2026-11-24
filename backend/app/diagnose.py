"""Explain an infeasible plan and propose options. Sleep is NEVER relaxed here: every re-solve
keeps the >= min_hours sleep blocks hard; only study hours become soft (to measure shortfalls)."""

from __future__ import annotations

import math
import time

from ortools.sat.python import cp_model

from .schemas import Infeasibility, PlanOption, PlanResponse, Shortfall, Stats
from .slots import TZ
from .solver import Prepared, _extract, _solve, _study_allowed, build, local_label, prepare

DIAGNOSE_TIME_LIMIT_S = 4.0  # the shortfall solve
OPTION_TIME_LIMIT_S = 1.5  # each "would this option help?" check


def _fmt_hours(h: float) -> str:
    return f"{h:g} h"


def _relaxed_short(
    prep: Prepared, time_limit: float = DIAGNOSE_TIME_LIMIT_S, **kwargs
) -> tuple[dict[str, int] | None, object]:
    built = build(prep, soft_hours=True, **kwargs)
    solver, status = _solve(built, time_limit)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None, None
    return {cid: int(solver.value(v)) for cid, v in built.short.items()}, (built, solver)


def diagnose(prep: Prepared, started: float) -> PlanResponse:
    req = prep.req
    courses = {c.id: c for c in req.courses}
    ms = lambda: round((time.perf_counter() - started) * 1000)  # noqa: E731

    # 1) Nights where fixed events leave no room for the minimum sleep.
    blocked_nights = [k for k, c in enumerate(prep.night_candidates) if not c]
    if blocked_nights:
        options: list[PlanOption] = []
        for k in blocked_nights[:3]:
            night = req.window.start_date.toordinal() + k
            # The event(s) that sit in that night's sleep window.
            ids = {
                prep.busy[i]
                for i, s in enumerate(prep.grid.slots)
                if prep.busy[i] and (s.day == k and s.local_minute >= 18 * 60 or s.day == k + 1 and s.local_minute < 13 * 60)
            }
            for e in req.fixed_events:
                if e.id in ids:
                    options.append(
                        PlanOption(
                            kind="fix_sleep_conflict",
                            label=f"Move “{e.title}” ({local_label(e.start)}) so you can sleep "
                            f"{_fmt_hours(req.sleep.min_hours)} that night",
                            event_id=e.id,
                        )
                    )
        if req.sleep.wake_drift_minutes < 120:
            options.append(
                PlanOption(
                    kind="fix_sleep_conflict",
                    label="Allow a wider wake-time range",
                    value=min(120, req.sleep.wake_drift_minutes + 60),
                )
            )
        first = req.window.start_date.fromordinal(req.window.start_date.toordinal() + blocked_nights[0])
        return PlanResponse(
            status="infeasible",
            sessions=[],
            sleep=[],
            totals=[],
            stats=Stats(wake_spread_minutes=0, solve_ms=ms()),
            infeasibility=Infeasibility(
                summary=(
                    f"Your schedule leaves no room for {_fmt_hours(req.sleep.min_hours)} of sleep on the night "
                    f"of {first.strftime('%b')} {first.day}. Sleep comes first, so nothing was planned."
                ),
                shortfalls=[],
                options=options,
            ),
        )

    # 2) Study hours soft, sleep hard: how short is each course?
    short, solved = _relaxed_short(prep)
    if short is None:
        return PlanResponse(
            status="infeasible",
            sessions=[],
            sleep=[],
            totals=[],
            stats=Stats(wake_spread_minutes=0, solve_ms=ms()),
            infeasibility=Infeasibility(
                summary="This plan couldn't be solved in time. Try fewer days or fewer courses.",
                shortfalls=[],
                options=[],
            ),
        )
    built, solver = solved  # type: ignore[misc]
    sessions, sleep, totals, spread = _extract(prep, built, solver)

    shortfalls: list[Shortfall] = []
    events = {e.id: e for e in req.fixed_events}
    for cid, s in short.items():
        if s <= 0:
            continue
        c = courses[cid]
        cap_slots = math.floor(2 * req.study_rules.daily_cap_hours)
        per_day: dict[int, int] = {}
        for i in range(min(prep.deadlines[cid], len(prep.grid.slots))):
            if _study_allowed(prep, i):
                d = prep.grid.slots[i].day
                per_day[d] = per_day.get(d, 0) + 1
        ceiling = sum(min(cap_slots, n) for n in per_day.values()) / 2
        exam_t = events[c.exam_event_id].start if c.exam_event_id in events else c.exam_start
        when = f" before its exam on {local_label(exam_t)}" if exam_t else " in this window"
        if prep.deadlines[cid] <= prep.first_study:
            reason = "Its exam is before the plan starts."
        else:
            reason = (
                f"At most {ceiling:g} h of study fits{when} with your "
                f"{req.study_rules.daily_cap_hours:g} h daily limit, and it's shared with your other courses."
            )
        shortfalls.append(Shortfall(course_id=cid, short_hours=s / 2, reason=reason))

    total_short = sum(short.values())
    names = [f"{courses[s.course_id].name} is {_fmt_hours(s.short_hours)} short" for s in shortfalls]
    if len(names) == 1:
        exam_t = None
        c = courses[shortfalls[0].course_id]
        exam_t = events[c.exam_event_id].start if c.exam_event_id in events else c.exam_start
        summary = f"{names[0]}{f' before its exam on {local_label(exam_t)}' if exam_t else ''}."
    else:
        summary = f"{len(names)} courses don't fit: " + ", ".join(names[:-1]) + f" and {names[-1]}."
    summary += " Sleep stays protected, so here's the best plan without cutting it."

    # 3) Options, each checked by re-solving (sleep still hard).
    options: list[PlanOption] = []
    optional = [e for e in req.fixed_events if e.optional]
    if optional:
        s2, _ = _relaxed_short(prepare(req, drop_optional=True), OPTION_TIME_LIMIT_S)
        if s2 is not None and sum(s2.values()) < total_short:
            freed = (total_short - sum(s2.values())) / 2
            for e in optional[:3]:
                options.append(
                    PlanOption(
                        kind="move_optional",
                        label=f"Move or skip “{e.title}” ({local_label(e.start)})"
                        + (f" — moving your optional events frees {freed:g} h" if e is optional[0] else ""),
                        event_id=e.id,
                    )
                )

    cap = req.study_rules.daily_cap_hours
    if cap < 10:
        s3, _ = _relaxed_short(prep, OPTION_TIME_LIMIT_S, daily_cap_hours=min(10, cap + 2))
        if s3 is not None and sum(s3.values()) < total_short:
            options.append(
                PlanOption(
                    kind="raise_daily_cap",
                    label=f"Raise your daily study limit to {min(10, cap + 2):g} h",
                    value=min(10, cap + 2),
                )
            )

    extra_days = math.ceil(total_short / max(1, math.floor(cap * 2)))
    if extra_days:
        options.append(
            PlanOption(
                kind="start_earlier",
                label=f"Start studying {extra_days} day{'s' if extra_days > 1 else ''} earlier",
                value=extra_days,
            )
        )

    for s in shortfalls:
        c = courses[s.course_id]
        achievable = c.study_hours - s.short_hours
        if achievable > 0:
            options.append(
                PlanOption(
                    kind="reduce_hours",
                    label=f"Plan {_fmt_hours(achievable)} for {c.name} instead of {_fmt_hours(c.study_hours)}",
                    course_id=c.id,
                    value=achievable,
                )
            )

    return PlanResponse(
        status="infeasible",
        sessions=sessions,
        sleep=sleep,
        totals=totals,
        stats=Stats(wake_spread_minutes=spread, solve_ms=ms()),
        infeasibility=Infeasibility(summary=summary, shortfalls=shortfalls, options=options),
    )


__all__ = ["diagnose", "TZ"]
