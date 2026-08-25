#!/usr/bin/env python3
"""Shared Taotian BSR category and query-result protocol helpers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List


CONFIG_PATH = Path(__file__).parent.parent / "config" / "categories.json"
REQUIRED_FIELDS = ("key", "secondary", "tertiary", "display_tertiary", "view_name")


def load_categories(path: str | Path = CONFIG_PATH) -> List[Dict[str, str]]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(payload, dict) and payload.get("schema_version") != 1:
        raise ValueError(f"类目配置 schema_version 不支持: {payload.get('schema_version')!r}")
    categories = payload.get("categories") if isinstance(payload, dict) else payload
    if not isinstance(categories, list) or not categories:
        raise ValueError(f"类目配置为空或格式错误: {path}")

    seen_keys = set()
    seen_pairs = set()
    result: List[Dict[str, str]] = []
    for index, item in enumerate(categories):
        if not isinstance(item, dict):
            raise ValueError(f"类目配置第 {index + 1} 项不是对象")
        missing = [field for field in REQUIRED_FIELDS if field not in item]
        if missing:
            raise ValueError(f"类目配置第 {index + 1} 项缺少字段: {', '.join(missing)}")
        normalized = {field: str(item.get(field, "")) for field in REQUIRED_FIELDS}
        for required_nonempty in ("key", "secondary", "display_tertiary", "view_name"):
            if not normalized[required_nonempty]:
                raise ValueError(f"类目配置第 {index + 1} 项 {required_nonempty} 为空")
        pair = (normalized["secondary"], normalized["tertiary"])
        if normalized["key"] in seen_keys:
            raise ValueError(f"类目配置 key 重复: {normalized['key']}")
        if pair in seen_pairs:
            raise ValueError(f"类目配置二/三级类目重复: {category_key_from_parts(*pair)}")
        seen_keys.add(normalized["key"])
        seen_pairs.add(pair)
        result.append(normalized)
    return result


def category_key_from_parts(secondary: str, tertiary: str) -> str:
    tertiary = tertiary or ""
    return f"{secondary} - {tertiary}" if tertiary else secondary


def category_key(row: Dict) -> str:
    return category_key_from_parts(row.get("secondary_category", ""), row.get("tertiary_category") or "")


def configured_category_keys(categories: List[Dict[str, str]] | None = None) -> List[str]:
    return [
        category_key_from_parts(item["secondary"], item["tertiary"])
        for item in (categories or load_categories())
    ]


def report_categories(categories: List[Dict[str, str]] | None = None) -> List[Dict[str, str]]:
    return [
        {
            "secondary": item["secondary"],
            "tertiary": item["tertiary"],
            "display_tertiary": item["display_tertiary"],
        }
        for item in (categories or load_categories())
    ]


def base_categories(categories: List[Dict[str, str]] | None = None) -> List[Dict[str, str]]:
    return [
        {
            "secondary": item["secondary"],
            "tertiary": item["display_tertiary"],
            "raw_tertiary": item["tertiary"],
            "view_name": item["view_name"],
        }
        for item in (categories or load_categories())
    ]


def view_to_category(categories: List[Dict[str, str]] | None = None) -> Dict[str, tuple[str, str]]:
    return {
        item["view_name"]: (item["secondary"], item["display_tertiary"])
        for item in (categories or load_categories())
    }


def view_to_base_category(categories: List[Dict[str, str]] | None = None) -> Dict[str, tuple[str, str, str]]:
    return {
        item["view_name"]: (item["secondary"], item["display_tertiary"], item["tertiary"])
        for item in (categories or load_categories())
    }


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def build_category_filter(categories: List[Dict[str, str]] | None = None) -> str:
    clauses = []
    for item in (categories or load_categories()):
        secondary = item["secondary"]
        tertiary = item["tertiary"]
        if tertiary:
            clauses.append(
                f"(secondary_category = {sql_quote(secondary)} AND tertiary_category = {sql_quote(tertiary)})"
            )
        else:
            clauses.append(
                f"(secondary_category = {sql_quote(secondary)} "
                f"AND (tertiary_category IS NULL OR tertiary_category = '' OR tertiary_category = {sql_quote(secondary)}))"
            )
    return "(\n    " + "\n    OR ".join(clauses) + "\n)"


def normalize_product_categories(rows: List[Dict], categories: List[Dict[str, str]] | None = None) -> List[Dict]:
    empty_tertiary_secondaries = {
        item["secondary"]
        for item in (categories or load_categories())
        if item["tertiary"] == ""
    }
    normalized = []
    for row in rows:
        item = dict(row)
        secondary = item.get("secondary_category") or ""
        tertiary = item.get("tertiary_category") or ""
        if secondary in empty_tertiary_secondaries and tertiary == secondary:
            item["tertiary_category"] = ""
        normalized.append(item)
    return normalized


def load_query_rows(path: str | Path) -> List[Dict]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(payload, list) and payload and isinstance(payload[0], dict) and "text" in payload[0]:
        legacy_rows = json.loads(payload[0]["text"])
        if not isinstance(legacy_rows, list):
            raise ValueError(f"旧包装查询结果不是数组: {path}")
        return normalize_product_categories(legacy_rows)
    if isinstance(payload, list):
        return normalize_product_categories(payload)
    if isinstance(payload, dict) and isinstance(payload.get("data"), list):
        return normalize_product_categories(payload["data"])
    raise ValueError(f"查询结果格式错误: {path}")


def validate_products_configured(products: List[Dict], label: str, categories: List[Dict[str, str]] | None = None) -> None:
    allowed = set(configured_category_keys(categories))
    unknown = sorted({category_key(item) for item in products if category_key(item) not in allowed})
    if unknown:
        raise ValueError(f"{label} 包含未配置类目: {', '.join(unknown)}")
