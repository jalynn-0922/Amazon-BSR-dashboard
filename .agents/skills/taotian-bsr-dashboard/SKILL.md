---
name: taotian-bsr-dashboard
description: 同步淘天 BSR Top 100 数据到 Doris，并把 9 个配置类目生成看板结构化周快照；用于淘天周报刷新、Doris 数据校验和看板接入，不写飞书或 Markdown 周报。
---

# 淘天 BSR 看板

负责淘天生产数据进入统一周报看板前的两步处理：安全同步 Doris，以及生成一个可校验、可发布的周快照。

## 边界

- 类目唯一来源是 `config/categories.json`，当前为 2 个类目组、9 个细分类目。
- `sync_data.py` 只同步 Top 100，并在成功后做源表与目标表双向差异校验。
- `generate_dashboard_snapshot.py` 只读取目标表，不修改 Doris。
- 淘天源表当前没有价格、销量、评分和上架时间；输出 `null`，禁止虚构。
- 商品图片和商品链接直接取生产字段 `commodity_picture`、`commodity_link`。
- 不调用飞书 Base、飞书文档、Markdown 渲染或机器人通知。

## 命令

仅检查是否存在待同步日期：

```bash
python3 .agents/skills/taotian-bsr-dashboard/scripts/sync_data.py --check-only
```

同步并核验指定周一：

```bash
python3 .agents/skills/taotian-bsr-dashboard/scripts/sync_data.py --date 2026-08-17
```

生成淘天看板快照：

```bash
python3 .agents/skills/taotian-bsr-dashboard/scripts/generate_dashboard_snapshot.py \
  --date 2026-08-17 \
  --out staging/taotian-dashboard-2026-08-17.json
```

生产调度通过项目统一 Runner 执行，不要直接编辑 `data/dashboard-data.json`。字段协议见 `references/schema.md`。
