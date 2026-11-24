"""API contract for POST /api/py/plan (mirrors docs/step-0-proposal.md §4b)."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

EventType = Literal["class", "exam", "work", "other"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Window(Strict):
    start_date: date
    days: int = Field(ge=1, le=14)


class SleepRules(Strict):
    # Hard floor: the API rejects anything under 7 h (CSEP 2020: adults 18–64 need 7–9 h).
    min_hours: float = Field(default=7, ge=7, le=10)
    target_hours: float = Field(default=8, ge=7, le=10)
    preferred_wake: str = Field(default="07:30", pattern=r"^\d{2}:\d{2}$")
    wake_drift_minutes: int = Field(default=30, ge=0, le=120)

    @model_validator(mode="after")
    def target_not_below_min(self) -> "SleepRules":
        if self.target_hours < self.min_hours:
            raise ValueError("target_hours must be at least min_hours")
        return self


class StudyRules(Strict):
    max_block_minutes: int = Field(default=120, ge=30, le=240)
    break_minutes: int = Field(default=30, ge=0, le=120)
    no_study_before_bed_minutes: int = Field(default=60, ge=0, le=180)
    daily_cap_hours: float = Field(default=6, ge=0.5, le=14)
    commute_buffer_minutes: int = Field(default=0, ge=0, le=120)


class FixedEvent(Strict):
    id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    type: EventType
    start: datetime
    end: datetime
    optional: bool = False

    @field_validator("start", "end")
    @classmethod
    def aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("times must include a UTC offset")
        return v

    @model_validator(mode="after")
    def ordered(self) -> "FixedEvent":
        if self.end <= self.start:
            raise ValueError("event must end after it starts")
        return self


class Course(Strict):
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=120)
    study_hours: float = Field(gt=0, le=80)
    exam_event_id: str | None = None
    exam_start: datetime | None = None


class Alertness(Strict):
    start: datetime
    slot_minutes: Literal[30] = 30
    values: list[float] = Field(max_length=14 * 48 + 48)


class PlanRequest(Strict):
    timezone: Literal["America/Edmonton"] = "America/Edmonton"
    window: Window
    slot_minutes: Literal[30] = 30
    sleep: SleepRules = SleepRules()
    study_rules: StudyRules = StudyRules()
    fixed_events: list[FixedEvent] = Field(default_factory=list, max_length=600)
    courses: list[Course] = Field(min_length=1, max_length=8)
    alertness: Alertness | None = None
    # Local midnights for days 0..days (days + 1 instants), as the student's own device sees
    # Calgary time. Keeps server and phone in agreement even if their time zone databases differ
    # (e.g. Alberta's Nov 2026 change). Falls back to the server's zoneinfo when omitted.
    day_starts: list[datetime] | None = Field(default=None, max_length=15)

    @model_validator(mode="after")
    def day_starts_match_window(self) -> "PlanRequest":
        ds = self.day_starts
        if ds is not None:
            if len(ds) != self.window.days + 1:
                raise ValueError("day_starts must have window.days + 1 entries")
            if any(t.tzinfo is None for t in ds) or any(b <= a for a, b in zip(ds, ds[1:])):
                raise ValueError("day_starts must be increasing, offset-aware instants")
            if any(not (22 * 3600 <= (b - a).total_seconds() <= 26 * 3600) for a, b in zip(ds, ds[1:])):
                raise ValueError("each day must be 22–26 hours long")
        return self


# ------------------------------------------------------------------ response


class Session(BaseModel):
    course_id: str
    start: datetime
    end: datetime


class SleepBlock(BaseModel):
    night_of: date
    bed: datetime
    wake: datetime
    hours: float


class CourseTotal(BaseModel):
    course_id: str
    planned_hours: float
    required_hours: float


class Stats(BaseModel):
    wake_spread_minutes: int
    solve_ms: int
    objective: float | None = None


class Shortfall(BaseModel):
    course_id: str
    short_hours: float
    reason: str


class PlanOption(BaseModel):
    kind: Literal["start_earlier", "move_optional", "reduce_hours", "raise_daily_cap", "fix_sleep_conflict"]
    label: str
    course_id: str | None = None
    event_id: str | None = None
    value: float | str | None = None


class Infeasibility(BaseModel):
    summary: str
    shortfalls: list[Shortfall]
    options: list[PlanOption]


class PlanResponse(BaseModel):
    status: Literal["optimal", "feasible", "infeasible"]
    sessions: list[Session]
    sleep: list[SleepBlock]
    totals: list[CourseTotal]
    stats: Stats
    infeasibility: Infeasibility | None = None
