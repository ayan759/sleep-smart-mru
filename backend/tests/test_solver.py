"""Solver guarantees: sleep >= 7 h, no overlaps, hours met, limits respected, explanations
instead of crashes. Uses small instances so the suite stays fast."""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from app import solver as S
from app.main import app
from app.schemas import PlanRequest, PlanResponse
from app.slots import build_grid

TZ = ZoneInfo("America/Edmonton")
client = TestClient(app)


@pytest.fixture(autouse=True)
def fast_solver(monkeypatch):
    monkeypatch.setattr(S, "SOLVER_TIME_LIMIT_S", 2.0)


def at(d: date, hm: str) -> str:
    h, m = map(int, hm.split(":"))
    return datetime(d.year, d.month, d.day, h, m, tzinfo=TZ).isoformat()


START = date(2026, 12, 1)  # Tuesday


def request(days=4, courses=None, events=None, **overrides) -> PlanRequest:
    body = {
        "window": {"start_date": START.isoformat(), "days": days},
        "fixed_events": events
        if events is not None
        else [
            {"id": f"lec{d}", "title": "COMP 2631 Lecture", "type": "class",
             "start": at(START + timedelta(days=d), "08:30"), "end": at(START + timedelta(days=d), "09:50")}
            for d in range(days)
        ]
        + [{"id": "exam", "title": "COMP 2631 Final", "type": "exam",
            "start": at(START + timedelta(days=days - 1), "13:00"), "end": at(START + timedelta(days=days - 1), "15:00")}],
        "courses": courses or [{"id": "comp", "name": "COMP 2631", "study_hours": 8, "exam_event_id": "exam"}],
    }
    body.update(overrides)
    return PlanRequest.model_validate(body)


def overlaps(a0, a1, b0, b1) -> bool:
    return a0 < b1 and b0 < a1


@pytest.fixture(scope="module")
def solved() -> tuple[PlanRequest, PlanResponse]:
    req = request()
    return req, S.plan(req)


def test_plan_is_found(solved):
    _, r = solved
    assert r.status in ("optimal", "feasible")
    assert r.infeasibility is None


def test_sleep_never_under_7_hours_and_one_block_per_night(solved):
    req, r = solved
    assert len(r.sleep) == req.window.days
    for b in r.sleep:
        assert b.hours >= 7
        assert (b.wake - b.bed) >= timedelta(hours=7)


def test_required_hours_are_met_before_the_exam(solved):
    req, r = solved
    exam_start = datetime.fromisoformat(next(e for e in req.fixed_events if e.id == "exam").start.isoformat())
    planned = sum((s.end - s.start).total_seconds() / 3600 for s in r.sessions if s.course_id == "comp")
    assert planned == 8
    assert all(s.end <= exam_start for s in r.sessions)
    assert r.totals[0].planned_hours == r.totals[0].required_hours == 8


def test_nothing_overlaps(solved):
    req, r = solved
    blocks = [(s.start, s.end) for s in r.sessions]
    blocks += [(e.start, e.end) for e in req.fixed_events]
    blocks += [(b.bed, b.wake) for b in r.sleep]
    for i, (a0, a1) in enumerate(blocks):
        for b0, b1 in blocks[i + 1 :]:
            assert not overlaps(a0, a1, b0, b1), (a0, a1, b0, b1)


def test_wake_time_stays_within_drift(solved):
    req, r = solved
    pref = 7 * 60 + 30
    for b in r.sleep:
        w = b.wake.astimezone(TZ)
        assert abs(w.hour * 60 + w.minute - pref) <= req.sleep.wake_drift_minutes


def test_no_study_in_the_hour_before_bed(solved):
    _, r = solved
    for b in r.sleep:
        for s in r.sessions:
            assert not overlaps(s.start, s.end, b.bed - timedelta(minutes=60), b.bed)


def test_block_length_and_daily_cap(solved):
    req, r = solved
    for s in r.sessions:
        assert s.end - s.start <= timedelta(minutes=req.study_rules.max_block_minutes)
    per_day: dict[date, float] = {}
    for s in r.sessions:
        d = s.start.astimezone(TZ).date()
        per_day[d] = per_day.get(d, 0) + (s.end - s.start).total_seconds() / 3600
    assert max(per_day.values()) <= req.study_rules.daily_cap_hours


def test_impossible_load_returns_explanation_and_keeps_sleep():
    req = request(courses=[{"id": "comp", "name": "COMP 2631", "study_hours": 40, "exam_event_id": "exam"}])
    r = S.plan(req)
    assert r.status == "infeasible"
    assert r.infeasibility is not None
    assert "COMP 2631" in r.infeasibility.summary and "short" in r.infeasibility.summary
    assert r.infeasibility.shortfalls[0].short_hours > 0
    assert {o.kind for o in r.infeasibility.options} >= {"reduce_hours"}
    # Best-effort plan still never cuts sleep.
    assert r.sleep and all(b.hours >= 7 for b in r.sleep)


def test_overnight_event_that_blocks_sleep_is_explained_not_squeezed():
    events = [
        {"id": "night", "title": "Night shift", "type": "work",
         "start": at(START, "21:00"), "end": at(START + timedelta(days=1), "05:00")},
        {"id": "exam", "title": "Final", "type": "exam",
         "start": at(START + timedelta(days=2), "13:00"), "end": at(START + timedelta(days=2), "15:00")},
    ]
    r = S.plan(request(days=3, events=events))
    assert r.status == "infeasible"
    assert r.sleep == [] and r.sessions == []
    assert "no room for 7 h of sleep" in r.infeasibility.summary
    assert any(o.kind == "fix_sleep_conflict" and o.event_id == "night" for o in r.infeasibility.options)


def test_deterministic():
    a = S.plan(request(days=3, courses=[{"id": "comp", "name": "COMP", "study_hours": 4, "exam_event_id": "exam"}]))
    b = S.plan(request(days=3, courses=[{"id": "comp", "name": "COMP", "study_hours": 4, "exam_event_id": "exam"}]))
    assert [(s.start, s.end) for s in a.sessions] == [(s.start, s.end) for s in b.sessions]


def test_device_day_starts_drive_the_grid_including_a_25_hour_day():
    # The phone's view of Calgary midnights wins over the server's tz database. Simulate a
    # fall-back day (25 h) between day 1 and day 2.
    base = datetime(2026, 12, 1, 6, 0, tzinfo=ZoneInfo("UTC"))  # midnight at UTC-6
    starts = [base, base + timedelta(hours=24), base + timedelta(hours=49), base + timedelta(hours=73)]
    grid = build_grid(date(2026, 12, 1), 3, day_starts=starts)
    assert [sum(1 for s in grid.slots if s.day == d) for d in range(3)] == [48, 50, 48]
    events = [{"id": "exam", "title": "Final", "type": "exam",
               "start": (starts[2] + timedelta(hours=13)).isoformat(), "end": (starts[2] + timedelta(hours=15)).isoformat()}]
    r = S.plan(PlanRequest.model_validate({
        "window": {"start_date": "2026-12-01", "days": 3},
        "day_starts": [t.isoformat() for t in starts],
        "fixed_events": events,
        "courses": [{"id": "c", "name": "Course", "study_hours": 4, "exam_event_id": "exam"}],
    }))
    assert r.status in ("optimal", "feasible")
    for k, b in enumerate(r.sleep):
        assert (b.wake - b.bed) >= timedelta(hours=7)
        # Wake is 07:00–08:00 measured from the device's own midnight for that morning.
        minutes = (b.wake - starts[k + 1]).total_seconds() / 60
        assert 7 * 60 <= minutes <= 8 * 60


def test_day_starts_must_match_the_window():
    body = request(days=2).model_dump(mode="json")
    body["day_starts"] = ["2026-12-01T06:00:00Z"]
    assert client.post("/api/py/plan", json=body).status_code == 422


# ------------------------------------------------------------------ HTTP contract


def test_api_rejects_sleep_minimum_under_7_hours():
    body = request().model_dump(mode="json")
    body["sleep"]["min_hours"] = 6
    res = client.post("/api/py/plan", json=body)
    assert res.status_code == 422


def test_api_rejects_more_than_14_days():
    body = request().model_dump(mode="json")
    body["window"]["days"] = 15
    assert client.post("/api/py/plan", json=body).status_code == 422


def test_api_plan_round_trip():
    body = request(days=3, courses=[{"id": "comp", "name": "COMP", "study_hours": 3, "exam_event_id": "exam"}])
    res = client.post("/api/py/plan", json=body.model_dump(mode="json"))
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("optimal", "feasible")
    assert all(b["hours"] >= 7 for b in data["sleep"])
