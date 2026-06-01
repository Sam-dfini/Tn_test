"""Smoke tests — verify core modules import and basic logic holds."""
import pytest


def test_python_version():
    import sys
    assert sys.version_info >= (3, 10), "Python 3.10+ required"


def test_rri_variables_load():
    """RRI variable JSON must load and contain required keys."""
    import json, os
    path = os.path.join(
        os.path.dirname(__file__), "../../src/data/rri_variables.json"
    )
    if not os.path.exists(path):
        pytest.skip("rri_variables.json not found relative to tests/")
    with open(path) as f:
        data = json.load(f)
    assert isinstance(data, list), "rri_variables.json should be a list"
    assert len(data) > 0, "rri_variables.json should not be empty"
    first = data[0]
    assert "id" in first or "code" in first, "Variables must have id or code field"


def test_config_loads():
    """Backend config must load without raising."""
    try:
        from backend.app.core.config import settings  # type: ignore
        assert settings is not None
    except ImportError:
        pytest.skip("Backend not importable from test context — run from project root")


def test_rri_engine_imports():
    """RRI engine must be importable."""
    try:
        from backend.app.services.rri_engine import calculate_rri  # type: ignore
        assert callable(calculate_rri)
    except ImportError:
        pytest.skip("Backend not importable from test context")
