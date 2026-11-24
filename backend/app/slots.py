"""30-minute slot grid in America/Edmonton, DST-safe (days can have 46, 48 or 50 slots)."""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

TZ = ZoneInfo("America/Edmonton")
SLOT = timedelta(minutes=30)


@dataclass(frozen=True)
class Slot:
    index: int
    start: datetime  # aware, UTC
    day: int  # 0-based planning day (local date - window start); the extra morning is day == days
    local_minute: int  # minutes after local midnight (0–1439)


@dataclass(frozen=True)
class Grid:
    slots: list[Slot]
    day_start: list[int]  # first slot index of each local day 0..days (inclusive of the extra morning)
    window_start: datetime
    window_end: datetime  # end of the last planning day (local midnight)
    grid_end: datetime  # includes the extra morning so the last night's sleep is complete

    def index_at(self, t: datetime) -> int:
        """Index of the slot containing instant t (clamped to the grid)."""
        i = int((t - self.slots[0].start) / SLOT)
        return max(0, min(len(self.slots), i))

    def ceil_index(self, t: datetime) -> int:
        """First slot index starting at or after t."""
        delta = (t - self.slots[0].start) / SLOT
        i = int(delta) if delta == int(delta) else int(delta) + 1
        return max(0, min(len(self.slots), i))


def local_midnight(d: date) -> datetime:
    return datetime.combine(d, time(0, 0), tzinfo=TZ).astimezone(ZoneInfo("UTC"))


def build_grid(
    start_date: date,
    days: int,
    extra_morning_hours: int = 13,
    day_starts: list[datetime] | None = None,
) -> Grid:
    """Slots from local midnight of start_date to local midnight after `days` days, plus a
    morning (until 13:00 local) so the final night's sleep fits entirely in the grid.

    With `day_starts` (local midnights from the student's device) the grid follows the device's
    notion of Calgary time; otherwise it uses the server's zoneinfo database."""
    utc = ZoneInfo("UTC")
    if day_starts is not None:
        starts = [t.astimezone(utc) for t in day_starts]
        boundaries = starts + [starts[-1] + timedelta(hours=extra_morning_hours)]
        slots: list[Slot] = []
        for d in range(days + 1):
            t = boundaries[d]
            while t < boundaries[d + 1]:
                slots.append(Slot(len(slots), t, d, int((t - boundaries[d]).total_seconds() // 60)))
                t += SLOT
        day_start = [next(s.index for s in slots if s.day == d) for d in range(days + 1)]
        return Grid(slots, day_start, starts[0], starts[-1], boundaries[-1])

    window_start = local_midnight(start_date)
    window_end = local_midnight(start_date + timedelta(days=days))
    grid_end = window_end + timedelta(hours=extra_morning_hours)
    slots = []
    t = window_start
    while t < grid_end:
        local = t.astimezone(TZ)
        slots.append(
            Slot(
                index=len(slots),
                start=t,
                day=(local.date() - start_date).days,
                local_minute=local.hour * 60 + local.minute,
            )
        )
        t += SLOT
    day_start = [next(s.index for s in slots if s.day == d) for d in range(days + 1)]
    return Grid(slots, day_start, window_start, window_end, grid_end)
