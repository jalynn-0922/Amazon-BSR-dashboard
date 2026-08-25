from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / ".agents/skills/taotian-bsr-dashboard/scripts"
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("taotian_snapshot", SCRIPTS / "generate_dashboard_snapshot.py")
snapshot = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules["taotian_snapshot"] = snapshot
spec.loader.exec_module(snapshot)


def sample_rows():
    rows = []
    for index, category in enumerate(snapshot.load_categories()):
        for rank, change in ((1, 5), (20, -8), (35, 9999)):
            rows.append({
                "business_date": "2026-08-17",
                "commodity_id": f"TT-{index}-{rank}",
                "secondary_category": category["secondary"],
                "tertiary_category": category["tertiary"],
                "shop_name": "ULANZI 官方旗舰店" if index == 0 and rank == 1 else f"店铺 {index}",
                "commodity_name": f"商品 {index}-{rank}",
                "commodity_picture": f"https://example.invalid/{index}-{rank}.jpg",
                "commodity_link": f"https://example.invalid/item/{index}-{rank}",
                "search_rank": rank,
                "ranking_change_value": change,
            })
    return rows


def test_preflight_has_two_groups_and_nine_categories():
    assert snapshot.run_preflight() == {"status": "ok", "groups": 2, "categories": 9}


def test_build_week_maps_real_fields_without_inventing_metrics():
    week = snapshot.build_week(sample_rows(), "2026-08-17")
    data = week["snapshot"]
    assert len(data["groups"]) == 2
    assert len(data["categories"]) == 9
    assert len(data["movements"]) == 27
    head = data["categories"][0]
    assert head["productUrl"].startswith("https://example.invalid/item/")
    assert head["price"] is None and head["rating"] is None and head["listingDays"] is None
    rising = next(item for item in data["movements"] if item["type"] == "上升")
    assert rising["previousRank"] == rising["rank"] + rising["change"]
    assert len(data["ownProducts"]) == 1
