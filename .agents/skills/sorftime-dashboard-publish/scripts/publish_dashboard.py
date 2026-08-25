#!/usr/bin/env python3
"""Validate and atomically publish one dashboard week."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any


class PublishError(ValueError):
    """Raised when a snapshot or runtime file is invalid."""


PLATFORM_SHAPES = {
    "amazon": (5, 12),
    "taotian": (2, 9),
}


def read_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PublishError(f"JSON file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise PublishError(f"invalid JSON in {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise PublishError(f"JSON root must be an object: {path}")
    return payload


def validate_week(week: dict[str, Any], platform: str = "amazon") -> None:
    if platform not in PLATFORM_SHAPES:
        raise PublishError(f"unsupported platform: {platform!r}")
    expected_groups, expected_categories = PLATFORM_SHAPES[platform]
    for field in ("key", "label", "previous", "highlights", "snapshot"):
        if field not in week:
            raise PublishError(f"week missing field: {field}")
    snapshot = week["snapshot"]
    if not isinstance(snapshot, dict):
        raise PublishError("week.snapshot must be an object")
    groups = snapshot.get("groups") or []
    categories = snapshot.get("categories") or []
    movements = snapshot.get("movements") or []
    if len(groups) != expected_groups:
        raise PublishError(f"expected {expected_groups} groups, got {len(groups)}")
    if len(categories) != expected_categories:
        raise PublishError(f"expected {expected_categories} categories, got {len(categories)}")
    if len({item.get('name') for item in categories}) != expected_categories:
        raise PublishError("category names must be unique")
    if not movements:
        raise PublishError("movement list cannot be empty")
    for collection_name in ("categories", "movements", "ownProducts"):
        for item in snapshot.get(collection_name, []):
            if not item.get("asin") or not item.get("title"):
                raise PublishError(f"{collection_name} product missing asin/title")
    meta = snapshot.get("meta") or {}
    if meta.get("groups") != expected_groups or meta.get("categories") != expected_categories:
        raise PublishError(f"snapshot meta does not match {expected_groups} groups/{expected_categories} categories")


def validate_input(payload: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    if payload.get("schemaVersion") != 1:
        raise PublishError("snapshot schemaVersion must be 1")
    platform = payload.get("platform")
    if platform not in PLATFORM_SHAPES:
        raise PublishError(f"unsupported platform: {platform!r}")
    week = payload.get("week")
    if not isinstance(week, dict):
        raise PublishError("snapshot week must be an object")
    validate_week(week, platform)
    return platform, week


def merge_runtime(
    current: dict[str, Any],
    platform: str,
    week: dict[str, Any],
    generated_at: str,
    keep_weeks: int,
) -> dict[str, Any]:
    if keep_weeks < 1:
        raise PublishError("keep-weeks must be at least 1")
    if current and current.get("schemaVersion") not in (None, 1):
        raise PublishError("runtime schemaVersion is not supported")
    platforms = dict(current.get("platforms") or {})
    platform_payload = dict(platforms.get(platform) or {})
    weeks = list(platform_payload.get("weeks") or [])
    for existing in weeks:
        validate_week(existing, platform)
    weeks = [existing for existing in weeks if existing.get("key") != week["key"]]
    weeks.append(week)
    weeks.sort(key=lambda item: item["key"], reverse=True)
    platform_payload["weeks"] = weeks[:keep_weeks]
    platforms[platform] = platform_payload
    return {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "platforms": platforms,
    }


def atomic_write(path: Path, payload: dict[str, Any], mode: int = 0o644) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        read_json(Path(temp_name))
        os.replace(temp_name, path)
        os.chmod(path, mode)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def preflight(target: Path) -> dict[str, Any]:
    if target.exists():
        current = read_json(target)
        if current.get("schemaVersion") != 1:
            raise PublishError("existing runtime schemaVersion must be 1")
    if not target.parent.exists():
        raise PublishError(f"target parent does not exist: {target.parent}")
    return {"status": "ok", "target": str(target)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path)
    parser.add_argument("--target", type=Path, default=Path("data/dashboard-data.json"))
    parser.add_argument("--keep-weeks", type=int, default=12)
    parser.add_argument("--mode", default=os.environ.get("DASHBOARD_DATA_MODE", "0644"))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--preflight", action="store_true")
    args = parser.parse_args()

    if args.preflight:
        print(json.dumps(preflight(args.target), ensure_ascii=False))
        return 0
    if args.input is None:
        parser.error("--input is required unless --preflight is used")
    incoming = read_json(args.input)
    try:
        file_mode = int(args.mode, 8)
    except ValueError as exc:
        raise PublishError(f"invalid octal file mode: {args.mode!r}") from exc
    if file_mode & 0o002:
        raise PublishError("dashboard data file must not be world-writable")
    platform, week = validate_input(incoming)
    current = read_json(args.target) if args.target.exists() else {"schemaVersion": 1, "platforms": {}}
    generated_at = str(incoming.get("generatedAt") or datetime.now().astimezone().isoformat(timespec="seconds"))
    merged = merge_runtime(current, platform, week, generated_at, args.keep_weeks)
    if not args.dry_run:
        atomic_write(args.target, merged, file_mode)
    print(json.dumps({
        "status": "validated" if args.dry_run else "published",
        "date": week["key"],
        "target": str(args.target),
        "weeks": len(merged["platforms"][platform]["weeks"]),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except PublishError as exc:
        raise SystemExit(f"ERROR: {exc}") from exc
