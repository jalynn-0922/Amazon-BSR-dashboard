#!/usr/bin/env python3
"""Build one validated Amazon dashboard week directly from Doris."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from category_config import load_category_mapping
from generate_weekly_report import (
    PROJECT_ROOT,
    db_connect,
    doris_table_ref,
    load_dotenv,
    qfile,
    query,
)


SKILL_DIR = Path(__file__).resolve().parents[1]
OVERVIEW_QUERIES = SKILL_DIR / "agents" / "01-overview" / "queries"
CATEGORY_QUERIES = SKILL_DIR / "agents" / "02-categories" / "queries"
ULANZI_QUERIES = SKILL_DIR / "agents" / "03-ulanzi" / "queries"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "staging"


class SnapshotError(ValueError):
    """Raised when a dashboard snapshot cannot be trusted."""


def as_int(value: Any, default: int = 0) -> int:
    if value is None or value == "":
        return default
    return int(float(value))


def as_float(value: Any, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    return round(float(value), 2)


def first_image(value: Any) -> str:
    if not value:
        return ""
    if isinstance(value, list):
        return str(value[0]) if value else ""
    if isinstance(value, dict):
        for key in ("url", "src", "image"):
            if value.get(key):
                return str(value[key])
        return ""
    text = str(value).strip()
    if text.startswith("http://") or text.startswith("https://"):
        return text
    try:
        parsed = json.loads(text)
    except (TypeError, json.JSONDecodeError):
        return ""
    return first_image(parsed)


def listed_at(report_date: str, online_days: Any) -> str:
    return (date.fromisoformat(report_date) - timedelta(days=max(0, as_int(online_days)))).isoformat()


def product_base(row: dict[str, Any], report_date: str) -> dict[str, Any]:
    online_days = as_int(row.get("online_days"))
    return {
        "brand": str(row.get("brand") or "Unknown"),
        "asin": str(row.get("asin") or ""),
        "title": str(row.get("title") or ""),
        "price": as_float(row.get("price")),
        "rating": as_float(row.get("ratings")),
        "image": first_image(row.get("photo")),
        "listingDays": online_days,
        "listedAt": listed_at(report_date, online_days),
    }


def category_product(group: str, category: str, row: dict[str, Any], report_date: str) -> dict[str, Any]:
    item = product_base(row, report_date)
    item.update({
        "group": group,
        "name": category,
        "rank": as_int(row.get("bsr_rank"), 100),
        "previousRank": as_int(row.get("last_rank"), 0) or None,
        "rankChange": as_int(row.get("rank_change")),
        "topSales": as_int(row.get("monthly_sales")),
    })
    return item


def movement_product(
    group: str,
    category: str,
    signal: str,
    row: dict[str, Any],
    report_date: str,
) -> dict[str, Any]:
    item = product_base(row, report_date)
    is_new = signal == "新上榜"
    rank = row.get("this_rank") if "this_rank" in row else row.get("bsr_rank")
    item.update({
        "group": group,
        "category": category,
        "type": signal,
        "rank": as_int(rank, 100),
        "previousRank": None if is_new else (as_int(row.get("last_rank"), 0) or None),
        "change": None if is_new else as_int(row.get("rank_change")),
        "sales": as_int(row.get("monthly_sales")),
    })
    return item


def own_product(group: str, category: str, row: dict[str, Any], report_date: str) -> dict[str, Any]:
    item = product_base(row, report_date)
    item.update({
        "group": group,
        "category": category,
        "rank": as_int(row.get("this_rank"), 100),
        "previousRank": as_int(row.get("last_rank"), 0) or None,
        "change": as_int(row.get("rank_change")),
        "sales": as_int(row.get("monthly_sales")),
    })
    return item


def category_size(conn: Any, node_id: str, report_date: str) -> tuple[int, int]:
    sql = f"""
        SELECT
            COUNT(*) AS record_count,
            SUM(CASE WHEN photo IS NOT NULL AND photo <> '' AND photo <> '[]' THEN 1 ELSE 0 END) AS image_count
        FROM {doris_table_ref()}
        WHERE bsr_date = '{report_date}' AND bsr_category_node = '{node_id}'
    """
    row = query(conn, sql)[0]
    return as_int(row.get("record_count")), as_int(row.get("image_count"))


def metric_pair(conn: Any, node_id: str, previous_date: str, report_date: str) -> tuple[dict[str, Any], dict[str, Any]]:
    rows = qfile(
        conn,
        OVERVIEW_QUERIES / "core-metrics.sql",
        node_id=node_id,
        start_date=previous_date,
        end_date=report_date,
    )
    by_date = {str(row["bsr_date"]): row for row in rows}
    if previous_date not in by_date or report_date not in by_date:
        raise SnapshotError(f"node {node_id} core metrics must contain {previous_date} and {report_date}")
    return by_date[previous_date], by_date[report_date]


def fetch_dashboard_category(
    conn: Any,
    leaf: dict[str, str],
    previous_date: str,
    report_date: str,
) -> dict[str, list[dict[str, Any]]]:
    values = {"node_id": leaf["node"], "start_date": previous_date, "end_date": report_date}
    data = {
        "top10": qfile(conn, CATEGORY_QUERIES / "top10.sql", **values),
        "rising": qfile(conn, CATEGORY_QUERIES / "rising.sql", **values),
        "falling": qfile(conn, CATEGORY_QUERIES / "falling.sql", **values),
        "new": qfile(conn, CATEGORY_QUERIES / "new-entries.sql", **values),
    }
    if len(data["top10"]) != 10:
        raise SnapshotError(f"{leaf['name']} TOP10 expected 10 rows, got {len(data['top10'])}")
    if len(data["rising"]) > 10 or len(data["falling"]) > 3:
        raise SnapshotError(f"{leaf['name']} movement row limit exceeded")
    return data


def fetch_dashboard_ulanzi(
    conn: Any,
    leaf: dict[str, str],
    previous_date: str,
    report_date: str,
) -> list[dict[str, Any]]:
    return qfile(
        conn,
        ULANZI_QUERIES / "ulanzi-products.sql",
        node_id=leaf["node"],
        start_date=previous_date,
        end_date=report_date,
    )


def build_highlights(
    categories: list[dict[str, Any]],
    movements: list[dict[str, Any]],
    own_products: list[dict[str, Any]],
    metric_changes: dict[str, int],
) -> list[list[str]]:
    top_sales = sum(item["topSales"] for item in categories)
    new_count = sum(1 for item in movements if item["type"] == "新上榜")
    rising_count = sum(1 for item in movements if item["type"] == "上升")
    highlights: list[list[str]] = [[
        "总体",
        f"12 个细分类目共识别 {rising_count} 个强势上升和 {new_count} 个新上榜信号；各类目 Top 1 月销合计 {top_sales:,} 件。",
    ]]

    group_names = list(dict.fromkeys(item["group"] for item in categories))
    ranked_groups = sorted(group_names, key=lambda name: abs(metric_changes.get(name, 0)), reverse=True)
    for group in ranked_groups[:2]:
        group_moves = [item for item in movements if item["group"] == group and item["change"] is not None]
        strongest = max(group_moves, key=lambda item: abs(item["change"]), default=None)
        delta = metric_changes.get(group, 0)
        move_text = (
            f"{strongest['category']} 的 {strongest['brand']} 单周变化 {strongest['change']:+d} 位"
            if strongest else "本周未出现超过阈值的排名异动"
        )
        highlights.append([group, f"类目月销较上周变化 {delta:+,} 件；{move_text}。"])

    if own_products:
        best = max(own_products, key=lambda item: item.get("change") or -999)
        best_change = as_int(best.get("change"))
        trend = f"排名变化 {best_change:+d} 位" if best.get("change") is not None else "本周新进入榜单"
        own_text = f"ULANZI 共 {len(own_products)} 个 SKU 进入监测榜单，{best['title']} {trend}。"
    else:
        own_text = "ULANZI 本周暂无 SKU 进入目标类目 Top 100，建议继续观察产品形态与价格带差距。"
    highlights.append(["ULANZI", own_text])
    return highlights


def validate_snapshot(week: dict[str, Any]) -> None:
    snapshot = week.get("snapshot") or {}
    groups = snapshot.get("groups") or []
    categories = snapshot.get("categories") or []
    if len(groups) != 5:
        raise SnapshotError(f"expected 5 report groups, got {len(groups)}")
    if len(categories) != 12:
        raise SnapshotError(f"expected 12 leaf categories, got {len(categories)}")
    names = [item.get("name") for item in categories]
    if len(set(names)) != 12:
        raise SnapshotError("leaf category names must be unique")
    if not snapshot.get("movements"):
        raise SnapshotError("movement list cannot be empty")
    for collection in (categories, snapshot["movements"], snapshot.get("ownProducts", [])):
        for item in collection:
            if not item.get("asin") or not item.get("title"):
                raise SnapshotError("every product requires asin and title")


def build_week(conn: Any, report_date: str) -> dict[str, Any]:
    report_day = date.fromisoformat(report_date)
    previous_date = (report_day - timedelta(days=7)).isoformat()
    mapping = load_category_mapping()
    categories: list[dict[str, Any]] = []
    movements: list[dict[str, Any]] = []
    own_products: list[dict[str, Any]] = []
    groups: list[dict[str, Any]] = []
    metric_changes: dict[str, int] = {}

    for group, leaves in mapping.items():
        group_records = 0
        group_images = 0
        group_sales_delta = 0
        for leaf in leaves:
            data = fetch_dashboard_category(conn, leaf, previous_date, report_date)
            ulanzi_products = fetch_dashboard_ulanzi(conn, leaf, previous_date, report_date)
            categories.append(category_product(group, leaf["name"], data["top10"][0], report_date))
            movements.extend(movement_product(group, leaf["name"], "上升", row, report_date) for row in data["rising"])
            movements.extend(movement_product(group, leaf["name"], "下降", row, report_date) for row in data["falling"])
            movements.extend(movement_product(group, leaf["name"], "新上榜", row, report_date) for row in data["new"])
            own_products.extend(own_product(group, leaf["name"], row, report_date) for row in ulanzi_products)
            record_count, image_count = category_size(conn, leaf["node"], report_date)
            group_records += record_count
            group_images += image_count
            previous_metrics, current_metrics = metric_pair(conn, leaf["node"], previous_date, report_date)
            group_sales_delta += as_int(current_metrics["total_monthly_sales"]) - as_int(previous_metrics["total_monthly_sales"])
        groups.append({
            "name": group,
            "categories": len(leaves),
            "records": group_records,
            "images": group_images,
        })
        metric_changes[group] = group_sales_delta

    week_start = (date.fromisoformat(previous_date) + timedelta(days=1)).strftime("%Y.%m.%d")
    week_end = report_day.strftime("%m.%d")
    week = {
        "key": report_date,
        "label": f"{week_start} — {week_end}",
        "previous": previous_date,
        "highlights": build_highlights(categories, movements, own_products, metric_changes),
        "snapshot": {
            "meta": {
                "reportDate": report_date,
                "previousDate": previous_date,
                "marketplace": "Amazon US",
                "groups": len(groups),
                "categories": len(categories),
                "records": sum(item["records"] for item in groups),
                "images": sum(item["images"] for item in groups),
            },
            "groups": groups,
            "categories": categories,
            "movements": movements,
            "ownProducts": own_products,
        },
    }
    validate_snapshot(week)
    return week


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
    mapping = load_category_mapping()
    leaf_count = sum(len(items) for items in mapping.values())
    if len(mapping) != 5 or leaf_count != 12:
        raise SnapshotError(f"category mapping expected 5 groups/12 leaves, got {len(mapping)}/{leaf_count}")
    required = [
        OVERVIEW_QUERIES / "core-metrics.sql",
        SKILL_DIR / "agents" / "02-categories" / "queries" / "top10.sql",
        SKILL_DIR / "agents" / "03-ulanzi" / "queries" / "ulanzi-products.sql",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise SnapshotError(f"missing dashboard query resources: {missing}")
    return {"status": "ok", "groups": len(mapping), "categories": leaf_count}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Wednesday report date, YYYY-MM-DD")
    parser.add_argument("--out", type=Path, help="Staging JSON path")
    parser.add_argument("--preflight", action="store_true")
    args = parser.parse_args()

    if args.preflight:
        print(json.dumps(run_preflight(), ensure_ascii=False))
        return 0
    if not args.date:
        parser.error("--date is required unless --preflight is used")
    report_day = date.fromisoformat(args.date)
    if report_day.weekday() != 2:
        raise SnapshotError(f"report date must be Wednesday, got {args.date}")
    output = args.out or (DEFAULT_OUTPUT_DIR / f"amazon-dashboard-{args.date}.json")
    load_dotenv()
    conn = db_connect()
    try:
        week = build_week(conn, args.date)
    finally:
        conn.close()
    payload = {
        "schemaVersion": 1,
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "platform": "amazon",
        "week": week,
    }
    atomic_json_write(output, payload)
    print(json.dumps({
        "status": "ok",
        "output": str(output),
        "date": args.date,
        "records": week["snapshot"]["meta"]["records"],
        "movements": len(week["snapshot"]["movements"]),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
