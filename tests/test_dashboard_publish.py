from __future__ import annotations

import importlib.util
import json
import stat
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLISH_PATH = ROOT / ".agents/skills/sorftime-dashboard-publish/scripts/publish_dashboard.py"


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


publish = load_module(PUBLISH_PATH, "dashboard_publish")


def sample_week(key: str = "2026-08-19", marker: str = "first") -> dict:
    groups = [
        {"name": name, "categories": count, "records": count * 100, "images": count * 90}
        for name, count in [("灯光类", 3), ("支架类", 4), ("脚架类", 3), ("音视频类", 1), ("智能工作室类", 1)]
    ]
    categories = [
        {
            "group": groups[index % 5]["name"],
            "name": f"category-{index}",
            "asin": f"ASIN{index:02d}",
            "title": f"{marker}-{index}",
            "rank": 1,
        }
        for index in range(12)
    ]
    return {
        "key": key,
        "label": key,
        "previous": "2026-08-12",
        "highlights": [["总体", marker]],
        "snapshot": {
            "meta": {"groups": 5, "categories": 12, "records": 1200, "images": 1080},
            "groups": groups,
            "categories": categories,
            "movements": [{"asin": "MOVE1", "title": marker, "type": "上升"}],
            "ownProducts": [],
        },
    }


def sample_taotian_week() -> dict:
    week = sample_week("2026-08-17", "taotian")
    week["snapshot"]["groups"] = [
        {"name": "灯光类", "categories": 4, "records": 400, "images": 300},
        {"name": "支架与脚架类", "categories": 5, "records": 500, "images": 400},
    ]
    week["snapshot"]["categories"] = [
        {"group": "灯光类" if index < 4 else "支架与脚架类", "name": f"tt-{index}", "asin": f"TT{index}", "title": f"taotian-{index}", "rank": 1}
        for index in range(9)
    ]
    week["snapshot"]["meta"] = {"groups": 2, "categories": 9, "records": 900, "images": 700}
    return week


def test_merge_replaces_same_week_and_keeps_newest():
    current = {"schemaVersion": 1, "platforms": {"amazon": {"weeks": [sample_week(marker="old")]}}}
    merged = publish.merge_runtime(current, "amazon", sample_week(marker="new"), "now", 12)
    weeks = merged["platforms"]["amazon"]["weeks"]
    assert len(weeks) == 1
    assert weeks[0]["highlights"][0][1] == "new"

    older = sample_week("2026-08-12", "older")
    merged = publish.merge_runtime(merged, "amazon", older, "later", 1)
    assert [item["key"] for item in merged["platforms"]["amazon"]["weeks"]] == ["2026-08-19"]


def test_invalid_snapshot_does_not_replace_target(tmp_path: Path):
    target = tmp_path / "dashboard-data.json"
    original = {"schemaVersion": 1, "generatedAt": None, "platforms": {}}
    target.write_text(json.dumps(original), encoding="utf-8")
    invalid = tmp_path / "invalid.json"
    invalid.write_text(json.dumps({"schemaVersion": 1, "platform": "amazon", "week": {}}), encoding="utf-8")

    completed = subprocess.run(
        [sys.executable, str(PUBLISH_PATH), "--input", str(invalid), "--target", str(target)],
        text=True,
        capture_output=True,
        check=False,
    )
    assert completed.returncode != 0
    assert json.loads(target.read_text(encoding="utf-8")) == original


def test_atomic_publish_outputs_valid_runtime(tmp_path: Path):
    target = tmp_path / "dashboard-data.json"
    target.write_text(json.dumps({"schemaVersion": 1, "platforms": {}}), encoding="utf-8")
    incoming = tmp_path / "snapshot.json"
    incoming.write_text(json.dumps({
        "schemaVersion": 1,
        "generatedAt": "2026-08-21T17:00:00+08:00",
        "platform": "amazon",
        "week": sample_week(),
    }), encoding="utf-8")

    completed = subprocess.run(
        [sys.executable, str(PUBLISH_PATH), "--input", str(incoming), "--target", str(target)],
        text=True,
        capture_output=True,
        check=False,
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr
    runtime = json.loads(target.read_text(encoding="utf-8"))
    assert runtime["platforms"]["amazon"]["weeks"][0]["key"] == "2026-08-19"
    assert stat.S_IMODE(target.stat().st_mode) == 0o644


def test_taotian_snapshot_merges_without_touching_amazon():
    current = {"schemaVersion": 1, "platforms": {"amazon": {"weeks": [sample_week()]}}}
    merged = publish.merge_runtime(current, "taotian", sample_taotian_week(), "now", 12)
    assert merged["platforms"]["amazon"]["weeks"][0]["key"] == "2026-08-19"
    assert merged["platforms"]["taotian"]["weeks"][0]["key"] == "2026-08-17"
