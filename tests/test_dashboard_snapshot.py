from __future__ import annotations

import importlib.util
import json
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / ".agents/skills/sorftime-weekly-report/scripts"
sys.path.insert(0, str(SCRIPTS))


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


snapshot = load_module(SCRIPTS / "generate_dashboard_snapshot.py", "dashboard_snapshot")


def test_first_image_supports_doris_json_and_plain_url():
    assert snapshot.first_image('["https://example.com/a.jpg", "https://example.com/b.jpg"]') == "https://example.com/a.jpg"
    assert snapshot.first_image("https://example.com/a.jpg") == "https://example.com/a.jpg"
    assert snapshot.first_image(json.dumps({"url": "https://example.com/c.jpg"})) == "https://example.com/c.jpg"
    assert snapshot.first_image("not-json") == ""


def test_product_mapping_preserves_price_rank_and_listing_date():
    row = {
        "brand": "ULANZI",
        "asin": "B000TEST",
        "title": "Test product",
        "price": 19.99,
        "ratings": 4.5,
        "photo": '["https://example.com/a.jpg"]',
        "online_days": 30,
        "this_rank": 12,
        "last_rank": 52,
        "rank_change": 40,
        "monthly_sales": 1200,
    }
    item = snapshot.movement_product("灯光类", "Selfie Lights", "上升", row, "2026-08-19")
    assert item["rank"] == 12
    assert item["previousRank"] == 52
    assert item["change"] == 40
    assert item["price"] == 19.99
    assert item["listingDays"] == 30
    assert item["listedAt"] == "2026-07-20"


def test_rank_history_tracks_the_same_asin_and_preserves_missing_weeks(monkeypatch):
    captured = {}

    def fake_query(_conn, sql):
        captured["sql"] = sql
        return [
            {"bsr_date": date(2026, 8, 5), "bsr_rank": 17},
            {"bsr_date": date(2026, 8, 19), "bsr_rank": 1},
        ]

    monkeypatch.setattr(snapshot, "query", fake_query)
    monkeypatch.setattr(snapshot, "doris_table_ref", lambda: "db.products")
    history = snapshot.fetch_rank_history(None, "123456", "B000TEST00", "2026-08-19")

    assert history == [None, 17, None, 1]
    assert "asin = 'B000TEST00'" in captured["sql"]
    assert "bsr_category_node = '123456'" in captured["sql"]


def test_rank_history_rejects_untrusted_identifiers():
    try:
        snapshot.fetch_rank_history(None, "123 OR 1=1", "B000TEST00", "2026-08-19")
    except snapshot.SnapshotError as error:
        assert "invalid category node" in str(error)
    else:
        raise AssertionError("invalid category node must be rejected")


def test_preflight_confirms_production_category_mapping():
    result = snapshot.run_preflight()
    assert result == {"status": "ok", "groups": 5, "categories": 12}
