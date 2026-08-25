from __future__ import annotations

import importlib.util
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / ".agents/workflows/run_sorftime_weekly_workflow.py"


spec = importlib.util.spec_from_file_location("dashboard_runner", RUNNER)
runner = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules["dashboard_runner"] = runner
spec.loader.exec_module(runner)


def test_recent_finished_wednesday_from_friday():
    assert runner.recent_finished_wednesday(date(2026, 8, 21)) == date(2026, 8, 19)


def test_wednesday_uses_previous_completed_week():
    assert runner.recent_finished_wednesday(date(2026, 8, 19)) == date(2026, 8, 12)


def test_non_wednesday_report_date_is_rejected():
    try:
        runner.parse_report_date("2026-08-20")
    except ValueError as exc:
        assert "must be Wednesday" in str(exc)
    else:
        raise AssertionError("expected non-Wednesday date to fail")
