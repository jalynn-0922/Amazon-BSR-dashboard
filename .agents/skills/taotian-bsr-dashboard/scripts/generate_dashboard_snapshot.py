#!/usr/bin/env python3
"""Build one Taotian dashboard week from the verified Doris target table."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from taotian_category_config import build_category_filter, category_key_from_parts, load_categories, normalize_product_categories
from taotian_config import DatabaseConfig, load_env_safe


PROJECT_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "staging"


class SnapshotError(ValueError):
    """Raised when a Taotian snapshot cannot be trusted."""


def as_int(value: Any, default: int = 0) -> int:
    if value is None or value == "":
        return default
    return int(float(value))


def group_name(category: dict[str, str]) -> str:
    return "灯光类" if category["key"] in {
        "live_photo_flash", "studio_light", "outdoor_light", "phone_live_fill_light"
    } else "支架与脚架类"


def category_name(category: dict[str, str]) -> str:
    return category["view_name"]


def row_key(row: dict[str, Any]) -> str:
    return category_key_from_parts(
        str(row.get("secondary_category") or ""),
        str(row.get("tertiary_category") or ""),
    )


def product_base(row: dict[str, Any]) -> dict[str, Any]:
    commodity_id = str(row.get("commodity_id") or "").strip()
    title = str(row.get("commodity_name") or "").strip()
    if not commodity_id or not title:
        raise SnapshotError("every Taotian product requires commodity_id and commodity_name")
    shop = str(row.get("shop_name") or "未知店铺")
    return {
        "brand": shop,
        "shop": shop,
        "asin": commodity_id,
        "title": title,
        "image": str(row.get("commodity_picture") or ""),
        "productUrl": str(row.get("commodity_link") or ""),
        "price": None,
        "rating": None,
        "listingDays": None,
        "listedAt": None,
    }


def category_product(group: str, name: str, row: dict[str, Any]) -> dict[str, Any]:
    item = product_base(row)
    change = as_int(row.get("ranking_change_value"))
    item.update({
        "group": group,
        "name": name,
        "rank": as_int(row.get("search_rank"), 100),
        "previousRank": None if change == 9999 else as_int(row.get("search_rank"), 100) + change,
        "rankChange": None if change == 9999 else change,
        "topSales": None,
    })
    return item


def movement_product(group: str, name: str, row: dict[str, Any]) -> dict[str, Any]:
    item = product_base(row)
    rank = as_int(row.get("search_rank"), 100)
    change_value = as_int(row.get("ranking_change_value"))
    is_new = change_value == 9999
    item.update({
        "group": group,
        "category": name,
        "type": "新上榜" if is_new else ("上升" if change_value > 0 else "下降"),
        "rank": rank,
        "previousRank": None if is_new else rank + change_value,
        "change": None if is_new else change_value,
        "sales": None,
    })
    return item


def own_product(group: str, name: str, row: dict[str, Any]) -> dict[str, Any]:
    item = movement_product(group, name, row)
    item.pop("type", None)
    return item


def limit_movements(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rising = sorted((r for r in rows if 0 < as_int(r.get("ranking_change_value")) < 9999), key=lambda r: as_int(r.get("ranking_change_value")), reverse=True)[:10]
    falling = sorted((r for r in rows if as_int(r.get("ranking_change_value")) < 0), key=lambda r: as_int(r.get("ranking_change_value")))[:3]
    new = sorted((r for r in rows if as_int(r.get("ranking_change_value")) == 9999), key=lambda r: as_int(r.get("search_rank"), 100))[:10]
    return rising + falling + new


def build_highlights(movements: list[dict[str, Any]], own_products: list[dict[str, Any]]) -> list[list[str]]:
    counts = {kind: sum(item["type"] == kind for item in movements) for kind in ("上升", "下降", "新上榜")}
    highlights = [["总体", f"9 个细分类目共识别 {counts['上升']} 个上升、{counts['下降']} 个下降和 {counts['新上榜']} 个新上榜信号。"]]
    for group in ("灯光类", "支架与脚架类"):
        scoped = [item for item in movements if item["group"] == group and item["change"] is not None]
        strongest = max(scoped, key=lambda item: abs(item["change"]), default=None)
        text = (f"{strongest['category']} 的 {strongest['shop']} 单周排名变化 {strongest['change']:+d} 位。" if strongest else "本周暂无显著排名异动。")
        highlights.append([group, text])
    highlights.append(["ULANZI", f"本周共有 {len(own_products)} 个本品进入目标类目 Top 100。" if own_products else "本周暂无本品进入目标类目 Top 100，建议持续观察头部产品形态。"])
    return highlights


def build_week(rows: list[dict[str, Any]], report_date: str, configured: list[dict[str, str]] | None = None) -> dict[str, Any]:
    report_day = date.fromisoformat(report_date)
    if report_day.weekday() != 0:
        raise SnapshotError(f"report date must be Monday, got {report_date}")
    configured = configured or load_categories()
    rows = normalize_product_categories(rows, configured)
    allowed = {category_key_from_parts(item["secondary"], item["tertiary"]): item for item in configured}
    scoped = [row for row in rows if row_key(row) in allowed and 1 <= as_int(row.get("search_rank"), 999) <= 100]
    by_category: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in scoped:
        by_category[row_key(row)].append(row)

    categories: list[dict[str, Any]] = []
    movements: list[dict[str, Any]] = []
    own_products: list[dict[str, Any]] = []
    group_metrics = {"灯光类": {"categories": 0, "records": 0, "images": 0}, "支架与脚架类": {"categories": 0, "records": 0, "images": 0}}
    for category in configured:
        key = category_key_from_parts(category["secondary"], category["tertiary"])
        category_rows = by_category.get(key, [])
        if not category_rows:
            raise SnapshotError(f"configured category has no rows for {report_date}: {category_name(category)}")
        group = group_name(category)
        name = category_name(category)
        head = min(category_rows, key=lambda row: as_int(row.get("search_rank"), 999))
        categories.append(category_product(group, name, head))
        movements.extend(movement_product(group, name, row) for row in limit_movements(category_rows))
        for row in category_rows:
            haystack = f"{row.get('shop_name', '')} {row.get('commodity_name', '')}".lower()
            if "ulanzi" in haystack or "优篮子" in haystack:
                own_products.append(own_product(group, name, row))
        metrics = group_metrics[group]
        metrics["categories"] += 1
        metrics["records"] += len(category_rows)
        metrics["images"] += sum(bool(row.get("commodity_picture")) for row in category_rows)

    if not movements:
        raise SnapshotError("movement list cannot be empty")
    previous = (report_day - timedelta(days=7)).isoformat()
    week_start = (report_day - timedelta(days=6)).strftime("%Y.%m.%d")
    groups = [{"name": name, **metrics} for name, metrics in group_metrics.items()]
    week = {
        "key": report_date,
        "label": f"{week_start} — {report_day.strftime('%m.%d')}",
        "previous": previous,
        "highlights": build_highlights(movements, own_products),
        "snapshot": {
            "meta": {"reportDate": report_date, "previousDate": previous, "marketplace": "淘天", "groups": 2, "categories": 9, "records": len(scoped), "images": sum(bool(row.get("commodity_picture")) for row in scoped)},
            "groups": groups,
            "categories": categories,
            "movements": movements,
            "ownProducts": own_products,
        },
    }
    return week


def db_connect():
    import pymysql
    cfg = DatabaseConfig.from_env()
    return pymysql.connect(host=cfg.host, port=cfg.port, user=cfg.user, password=cfg.password, database=cfg.database, charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor, connect_timeout=15, read_timeout=180)


def fetch_rows(conn: Any, report_date: str) -> list[dict[str, Any]]:
    cfg = DatabaseConfig.from_env()
    columns = "business_date, commodity_id, secondary_category, tertiary_category, shop_name, commodity_name, commodity_picture, commodity_link, search_rank, ranking_change_value"
    sql = f"SELECT {columns} FROM {cfg.target_table} WHERE DATE(business_date) = %s AND search_rank <= 100 AND {build_category_filter()} ORDER BY secondary_category, tertiary_category, search_rank"
    with conn.cursor() as cursor:
        cursor.execute(sql, (report_date,))
        return list(cursor.fetchall())


def latest_date(conn: Any) -> str:
    cfg = DatabaseConfig.from_env()
    with conn.cursor() as cursor:
        cursor.execute(f"SELECT MAX(DATE(business_date)) AS report_date FROM {cfg.target_table}")
        value = cursor.fetchone()["report_date"]
    if not value:
        raise SnapshotError("Taotian target table has no report date")
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def atomic_json_write(path: Path, payload: dict[str, Any]) -> None:
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


def run_preflight() -> dict[str, Any]:
    categories = load_categories()
    groups = {group_name(item) for item in categories}
    if len(groups) != 2 or len(categories) != 9:
        raise SnapshotError(f"category mapping expected 2 groups/9 categories, got {len(groups)}/{len(categories)}")
    return {"status": "ok", "groups": 2, "categories": 9}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Monday report date; defaults to latest target date")
    parser.add_argument("--out", type=Path)
    parser.add_argument("--preflight", action="store_true")
    args = parser.parse_args()
    if args.preflight:
        print(json.dumps(run_preflight(), ensure_ascii=False))
        return 0
    load_env_safe()
    conn = db_connect()
    try:
        report_date = args.date or latest_date(conn)
        rows = fetch_rows(conn, report_date)
    finally:
        conn.close()
    output = args.out or DEFAULT_OUTPUT_DIR / f"taotian-dashboard-{report_date}.json"
    week = build_week(rows, report_date)
    payload = {"schemaVersion": 1, "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"), "platform": "taotian", "week": week}
    atomic_json_write(output, payload)
    print(json.dumps({"status": "ok", "output": str(output), "date": report_date, "records": len(rows), "movements": len(week["snapshot"]["movements"])}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SnapshotError as exc:
        raise SystemExit(f"ERROR: {exc}") from exc
