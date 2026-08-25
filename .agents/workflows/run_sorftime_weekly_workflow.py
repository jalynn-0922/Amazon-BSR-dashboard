#!/usr/bin/env python3
"""Run the weekly Sorftime -> Doris -> dashboard pipeline."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BSR_SCRIPT = PROJECT_ROOT / ".agents/skills/sorftime-bsr-sync/scripts/sorftime_api/category/CategoryRequest/fill_missing.py"
SNAPSHOT_SCRIPT = PROJECT_ROOT / ".agents/skills/sorftime-weekly-report/scripts/generate_dashboard_snapshot.py"
PUBLISH_SCRIPT = PROJECT_ROOT / ".agents/skills/sorftime-dashboard-publish/scripts/publish_dashboard.py"


@dataclass
class Step:
    name: str
    status: str
    exit_code: int = 0
    output: str = ""


def load_dotenv() -> None:
    path = PROJECT_ROOT / ".env"
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() and key.strip() not in os.environ:
            os.environ[key.strip()] = value.strip().strip("'\"")


def recent_finished_wednesday(today: date | None = None) -> date:
    today = today or datetime.now(ZoneInfo("Asia/Shanghai")).date()
    days_since_wednesday = (today.weekday() - 2) % 7
    candidate = today - timedelta(days=days_since_wednesday)
    if today.weekday() == 2:
        candidate -= timedelta(days=7)
    return candidate


def parse_report_date(value: str | None) -> date:
    resolved = date.fromisoformat(value) if value else recent_finished_wednesday()
    if resolved.weekday() != 2:
        raise ValueError(f"report date must be Wednesday, got {resolved.isoformat()}")
    return resolved


def redact(text: str) -> str:
    output = text
    for key in ("SORFTIME_API_KEY", "DORIS_PASSWORD"):
        value = os.environ.get(key)
        if value:
            output = output.replace(value, "***")
    return output[-12000:]


def run_step(name: str, command: list[str], timeout: int) -> Step:
    completed = subprocess.run(
        command,
        cwd=PROJECT_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
        check=False,
    )
    return Step(name, "ok" if completed.returncode == 0 else "failed", completed.returncode, redact(completed.stdout))


def atomic_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def required_files() -> list[Path]:
    return [BSR_SCRIPT, SNAPSHOT_SCRIPT, PUBLISH_SCRIPT, PROJECT_ROOT / "data"]


def preflight(args: argparse.Namespace) -> int:
    steps: list[Step] = []
    missing = [str(path) for path in required_files() if not path.exists()]
    steps.append(Step("files", "failed" if missing else "ok", 1 if missing else 0, "\n".join(missing)))
    if not missing:
        steps.append(run_step("snapshot-preflight", [sys.executable, str(SNAPSHOT_SCRIPT), "--preflight"], args.command_timeout_seconds))
        steps.append(run_step(
            "publish-preflight",
            [sys.executable, str(PUBLISH_SCRIPT), "--preflight", "--target", str(args.dashboard_data)],
            args.command_timeout_seconds,
        ))
    for step in steps:
        print(json.dumps(asdict(step), ensure_ascii=False))
    return 1 if any(step.status == "failed" for step in steps) else 0


def main() -> int:
    load_dotenv()
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Wednesday report date; defaults to the most recent finished Wednesday")
    parser.add_argument("--preflight", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Read and validate data but do not update Doris or dashboard runtime JSON")
    parser.add_argument("--skip-bsr", action="store_true")
    parser.add_argument("--skip-publish", action="store_true")
    parser.add_argument("--max-workers", type=int, default=int(os.environ.get("MAX_WORKERS", "4")))
    parser.add_argument("--keep-weeks", type=int, default=int(os.environ.get("DASHBOARD_KEEP_WEEKS", "12")))
    parser.add_argument("--command-timeout-seconds", type=int, default=1800)
    parser.add_argument("--snapshot-dir", type=Path, default=PROJECT_ROOT / "staging")
    parser.add_argument("--dashboard-data", type=Path, default=PROJECT_ROOT / "data/dashboard-data.json")
    args = parser.parse_args()

    if args.preflight:
        return preflight(args)

    report_date = parse_report_date(args.date)
    run_id = datetime.now(ZoneInfo("Asia/Shanghai")).strftime("%Y%m%d-%H%M%S-%f")
    log_dir = PROJECT_ROOT / "logs" / "sorftime-dashboard-workflow" / run_id
    log_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(log_dir, 0o700)
    snapshot = args.snapshot_dir / f"amazon-dashboard-{report_date.isoformat()}.json"
    steps: list[Step] = []

    if args.skip_bsr:
        steps.append(Step("bsr-sync", "skipped"))
    else:
        command = [
            sys.executable,
            str(BSR_SCRIPT),
            "--dates", report_date.isoformat(),
            "--weekday", "wednesday",
            "--parallel",
            "--max-workers", str(args.max_workers),
        ]
        if args.dry_run:
            command.append("--dry-run")
        steps.append(run_step("bsr-sync", command, args.command_timeout_seconds))

    if steps[-1].status == "failed":
        snapshot_step = Step("dashboard-snapshot", "skipped", output="previous step failed")
    else:
        snapshot_step = run_step(
            "dashboard-snapshot",
            [sys.executable, str(SNAPSHOT_SCRIPT), "--date", report_date.isoformat(), "--out", str(snapshot)],
            args.command_timeout_seconds,
        )
    steps.append(snapshot_step)

    if snapshot_step.status == "failed" or args.skip_publish:
        reason = "snapshot failed" if snapshot_step.status == "failed" else "--skip-publish"
        publish_step = Step("dashboard-publish", "skipped", output=reason)
    else:
        command = [
            sys.executable,
            str(PUBLISH_SCRIPT),
            "--input", str(snapshot),
            "--target", str(args.dashboard_data),
            "--keep-weeks", str(args.keep_weeks),
        ]
        if args.dry_run:
            command.append("--dry-run")
        publish_step = run_step("dashboard-publish", command, args.command_timeout_seconds)
    steps.append(publish_step)

    summary = {
        "runId": run_id,
        "reportDate": report_date.isoformat(),
        "dryRun": args.dry_run,
        "dashboardData": str(args.dashboard_data),
        "dashboardUrl": os.environ.get("DASHBOARD_PUBLIC_URL", ""),
        "steps": [asdict(step) for step in steps],
        "status": "failed" if any(step.status == "failed" for step in steps) else "ok",
    }
    summary_path = log_dir / "summary.json"
    atomic_json(summary_path, summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if summary["status"] == "failed" else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.TimeoutExpired) as exc:
        raise SystemExit(f"ERROR: {exc}") from exc
