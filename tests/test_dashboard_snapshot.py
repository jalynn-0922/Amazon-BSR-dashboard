from __future__ import annotations

import importlib.util
import json
import sys
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


def test_preflight_confirms_production_category_mapping():
    result = snapshot.run_preflight()
    assert result == {"status": "ok", "groups": 5, "categories": 12}
