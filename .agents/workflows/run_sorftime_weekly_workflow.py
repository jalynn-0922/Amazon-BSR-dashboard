#!/usr/bin/env python3
"""Run the unified Amazon + Taotian weekly dashboard pipeline."""
from __future__ import annotations
import argparse, json, os, subprocess, sys, tempfile
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

PROJECT_ROOT = Path(__file__).resolve().parents[2]
AMAZON_SYNC = PROJECT_ROOT / ".agents/skills/sorftime-bsr-sync/scripts/sorftime_api/category/CategoryRequest/fill_missing.py"
AMAZON_SNAPSHOT = PROJECT_ROOT / ".agents/skills/sorftime-weekly-report/scripts/generate_dashboard_snapshot.py"
TAOTIAN_SYNC = PROJECT_ROOT / ".agents/skills/taotian-bsr-dashboard/scripts/sync_data.py"
TAOTIAN_SNAPSHOT = PROJECT_ROOT / ".agents/skills/taotian-bsr-dashboard/scripts/generate_dashboard_snapshot.py"
PUBLISH_SCRIPT = PROJECT_ROOT / ".agents/skills/sorftime-dashboard-publish/scripts/publish_dashboard.py"

@dataclass
class Step:
    name: str
    status: str
    exit_code: int = 0
    output: str = ""

def load_dotenv() -> None:
    path = PROJECT_ROOT / ".env"
    if not path.exists(): return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        key, value = line.split("=", 1)
        if key.strip() and key.strip() not in os.environ:
            os.environ[key.strip()] = value.strip().strip("'\"")

def recent_finished_weekday(weekday: int, today: date | None = None) -> date:
    today = today or datetime.now(ZoneInfo("Asia/Shanghai")).date()
    candidate = today - timedelta(days=(today.weekday() - weekday) % 7)
    return candidate - timedelta(days=7) if today.weekday() == weekday else candidate

def recent_finished_wednesday(today: date | None = None) -> date:
    return recent_finished_weekday(2, today)

def recent_finished_monday(today: date | None = None) -> date:
    return recent_finished_weekday(0, today)

def parse_report_date(value: str | None) -> date:
    resolved = date.fromisoformat(value) if value else recent_finished_wednesday()
    if resolved.weekday() != 2: raise ValueError(f"report date must be Wednesday, got {resolved.isoformat()}")
    return resolved

def parse_taotian_date(value: str | None) -> date:
    resolved = date.fromisoformat(value) if value else recent_finished_monday()
    if resolved.weekday() != 0: raise ValueError(f"Taotian report date must be Monday, got {resolved.isoformat()}")
    return resolved

def redact(text: str) -> str:
    for key in ("SORFTIME_API_KEY", "DORIS_PASSWORD", "TAOTIAN_DORIS_PASSWORD"):
        if os.environ.get(key): text = text.replace(os.environ[key], "***")
    return text[-12000:]

def run_step(name: str, command: list[str], timeout: int) -> Step:
    result = subprocess.run(command, cwd=PROJECT_ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout, check=False)
    return Step(name, "ok" if result.returncode == 0 else "failed", result.returncode, redact(result.stdout))

def atomic_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2); handle.write("\n"); handle.flush(); os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name): os.unlink(temp_name)

def publish(snapshot: Path, args: argparse.Namespace, name: str) -> Step:
    command = [sys.executable, str(PUBLISH_SCRIPT), "--input", str(snapshot), "--target", str(args.dashboard_data), "--keep-weeks", str(args.keep_weeks)]
    if args.dry_run: command.append("--dry-run")
    return run_step(name, command, args.command_timeout_seconds)

def preflight(args: argparse.Namespace) -> int:
    required = [AMAZON_SYNC, AMAZON_SNAPSHOT, TAOTIAN_SYNC, TAOTIAN_SNAPSHOT, PUBLISH_SCRIPT, PROJECT_ROOT / "data"]
    missing = [str(path) for path in required if not path.exists()]
    steps = [Step("files", "failed" if missing else "ok", 1 if missing else 0, "\n".join(missing))]
    if not missing:
        for name, script in (("amazon-snapshot-preflight", AMAZON_SNAPSHOT), ("taotian-snapshot-preflight", TAOTIAN_SNAPSHOT)):
            steps.append(run_step(name, [sys.executable, str(script), "--preflight"], args.command_timeout_seconds))
        steps.append(run_step("publish-preflight", [sys.executable, str(PUBLISH_SCRIPT), "--preflight", "--target", str(args.dashboard_data)], args.command_timeout_seconds))
    for step in steps: print(json.dumps(asdict(step), ensure_ascii=False))
    return int(any(step.status == "failed" for step in steps))

def platform_pipeline(platform: str, report_date: date, args: argparse.Namespace) -> list[Step]:
    is_amazon = platform == "amazon"
    sync_script = AMAZON_SYNC if is_amazon else TAOTIAN_SYNC
    snapshot_script = AMAZON_SNAPSHOT if is_amazon else TAOTIAN_SNAPSHOT
    skip_sync = args.skip_amazon_sync if is_amazon else args.skip_taotian_sync
    snapshot = args.snapshot_dir / f"{platform}-dashboard-{report_date.isoformat()}.json"
    if skip_sync:
        sync = Step(f"{platform}-sync", "skipped")
    elif is_amazon:
        command = [sys.executable, str(sync_script), "--dates", report_date.isoformat(), "--weekday", "wednesday", "--parallel", "--max-workers", str(args.max_workers)]
        if args.dry_run: command.append("--dry-run")
        sync = run_step("amazon-sync", command, args.command_timeout_seconds)
    else:
        command = [sys.executable, str(sync_script), "--check-only"] if args.dry_run else [sys.executable, str(sync_script), "--date", report_date.isoformat()]
        sync = run_step("taotian-sync", command, args.command_timeout_seconds)
    steps = [sync]
    if sync.status == "failed":
        return steps + [Step(f"{platform}-snapshot", "skipped", output="sync failed"), Step(f"{platform}-publish", "skipped", output="snapshot unavailable")]
    snapshot_step = run_step(f"{platform}-snapshot", [sys.executable, str(snapshot_script), "--date", report_date.isoformat(), "--out", str(snapshot)], args.command_timeout_seconds)
    steps.append(snapshot_step)
    steps.append(Step(f"{platform}-publish", "skipped", output="snapshot failed or --skip-publish") if snapshot_step.status == "failed" or args.skip_publish else publish(snapshot, args, f"{platform}-publish"))
    return steps

def main() -> int:
    load_dotenv(); parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Amazon Wednesday date (backward-compatible alias)")
    parser.add_argument("--amazon-date"); parser.add_argument("--taotian-date")
    parser.add_argument("--preflight", action="store_true"); parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-amazon", action="store_true"); parser.add_argument("--skip-taotian", action="store_true")
    parser.add_argument("--skip-bsr", "--skip-amazon-sync", dest="skip_amazon_sync", action="store_true")
    parser.add_argument("--skip-taotian-sync", action="store_true"); parser.add_argument("--skip-publish", action="store_true")
    parser.add_argument("--max-workers", type=int, default=int(os.environ.get("MAX_WORKERS", "4")))
    parser.add_argument("--keep-weeks", type=int, default=int(os.environ.get("DASHBOARD_KEEP_WEEKS", "12")))
    parser.add_argument("--command-timeout-seconds", type=int, default=1800)
    parser.add_argument("--snapshot-dir", type=Path, default=PROJECT_ROOT / "staging")
    parser.add_argument("--dashboard-data", type=Path, default=PROJECT_ROOT / "data/dashboard-data.json")
    args = parser.parse_args()
    if args.preflight: return preflight(args)
    amazon_date = parse_report_date(args.amazon_date or args.date); taotian_date = parse_taotian_date(args.taotian_date)
    run_id = datetime.now(ZoneInfo("Asia/Shanghai")).strftime("%Y%m%d-%H%M%S-%f")
    log_dir = PROJECT_ROOT / "logs/cross-platform-dashboard-workflow" / run_id; log_dir.mkdir(parents=True, exist_ok=True); os.chmod(log_dir, 0o700)
    steps: list[Step] = []
    if not args.skip_amazon: steps.extend(platform_pipeline("amazon", amazon_date, args))
    if not args.skip_taotian: steps.extend(platform_pipeline("taotian", taotian_date, args))
    summary = {"runId": run_id, "amazonReportDate": amazon_date.isoformat(), "taotianReportDate": taotian_date.isoformat(), "dryRun": args.dry_run, "dashboardData": str(args.dashboard_data), "dashboardUrl": os.environ.get("DASHBOARD_PUBLIC_URL", ""), "steps": [asdict(step) for step in steps], "status": "failed" if any(step.status == "failed" for step in steps) else "ok"}
    atomic_json(log_dir / "summary.json", summary); print(json.dumps(summary, ensure_ascii=False, indent=2))
    return int(summary["status"] == "failed")

if __name__ == "__main__":
    try: raise SystemExit(main())
    except (ValueError, OSError, subprocess.TimeoutExpired) as exc: raise SystemExit(f"ERROR: {exc}") from exc
