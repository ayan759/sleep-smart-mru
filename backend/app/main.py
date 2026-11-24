"""Sleep Smart MRU solver service (FastAPI on Vercel Services).

Vercel Services forwards the ORIGINAL request path to this service, so every route
lives under the /api/py prefix (see vercel.json rewrites).
"""

import platform
import time

_import_started = time.perf_counter()
import ortools  # noqa: E402  (timed on purpose: OR-Tools import dominates cold start)
from ortools.sat.python import cp_model  # noqa: E402

ORTOOLS_IMPORT_MS = round((time.perf_counter() - _import_started) * 1000)

from fastapi import APIRouter, FastAPI  # noqa: E402

app = FastAPI(
    title="Sleep Smart MRU solver",
    docs_url="/api/py/docs",
    openapi_url="/api/py/openapi.json",
    redoc_url=None,
)
router = APIRouter(prefix="/api/py")


def cpsat_smoke_test() -> tuple[str, int]:
    """Schedule two 2-slot tasks in a 6-slot day without overlap; minimize the end time.

    Returns the CP-SAT status name and solve time in ms. Proves the native solver loads
    and runs inside the serverless bundle.
    """
    model = cp_model.CpModel()
    horizon = 6
    starts = [model.new_int_var(0, horizon - 2, f"s{i}") for i in range(2)]
    intervals = [model.new_fixed_size_interval_var(s, 2, f"t{i}") for i, s in enumerate(starts)]
    model.add_no_overlap(intervals)
    end = model.new_int_var(0, horizon, "end")
    for s in starts:
        model.add(end >= s + 2)
    model.minimize(end)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.0
    solver.parameters.num_workers = 1  # deterministic, fits 1 vCPU
    started = time.perf_counter()
    status = solver.solve(model)
    elapsed_ms = round((time.perf_counter() - started) * 1000)
    return solver.status_name(status), elapsed_ms


@router.get("/health")
def health() -> dict[str, object]:
    status, solve_ms = cpsat_smoke_test()
    return {
        "status": "ok",
        "python": platform.python_version(),
        "ortools": ortools.__version__,
        "cpsat_smoke": status,
        "cpsat_solve_ms": solve_ms,
        "ortools_import_ms": ORTOOLS_IMPORT_MS,
    }


app.include_router(router)
