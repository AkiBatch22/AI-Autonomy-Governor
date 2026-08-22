import os


os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from backend.app.main import app  # noqa: E402


def test_expected_api_routes_are_registered_once():
    expected = {
        ("GET", "/api/v1/health"),
        ("POST", "/api/v1/agents"),
        ("GET", "/api/v1/agents"),
        ("GET", "/api/v1/agents/{agent_id}"),
        ("GET", "/api/v1/agents/{agent_id}/metrics"),
        ("POST", "/api/v1/agents/{agent_id}/simulate"),
        ("POST", "/api/v1/agents/{agent_id}/recommend"),
        ("GET", "/api/v1/agents/{agent_id}/recommendations/top"),
        ("POST", "/api/v1/agents/{agent_id}/policies"),
        ("GET", "/api/v1/agents/{agent_id}/policies"),
        ("GET", "/api/v1/agents/{agent_id}/simulations"),
    }
    registered = [
        (method.upper(), path)
        for path, operations in app.openapi()["paths"].items()
        for method in operations
        if path.startswith("/api/v1")
    ]
    assert expected.issubset(set(registered))
    assert len(registered) == len(set(registered))
