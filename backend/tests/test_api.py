from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_working_solver() -> None:
    response = client.get("/api/py/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["python"].startswith("3.12")
    assert body["cpsat_smoke"] == "OPTIMAL"


def test_routes_live_under_api_py_prefix() -> None:
    # Vercel Services passes the original path through, so un-prefixed routes must 404.
    assert client.get("/health").status_code == 404
