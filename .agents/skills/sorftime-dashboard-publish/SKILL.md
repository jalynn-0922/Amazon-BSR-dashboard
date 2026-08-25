---
name: sorftime-dashboard-publish
description: 校验并发布 Sorftime 周度结构化快照到 Amazon BSR 看板；用于替代飞书 Base/docx 发布，不负责采集或修改 Doris 数据。
---

# Sorftime 看板发布

将 `sorftime-weekly-report` 生成的单周 JSON 快照合并到看板运行时数据文件。

## 边界

- 输入必须是已落盘的单周快照；本 Skill 不连接 Sorftime、Doris 或飞书。
- 发布前校验 5 个报告组、12 个叶子类目、商品主键及核心集合。
- 同一日期重跑时替换该周，不产生重复周次。
- 只保留配置数量的历史周次，默认 12 周。
- 先在同目录写临时文件并 `fsync`，校验完成后再原子替换正式 JSON；任何失败都保留上一版。
- 正式 JSON 默认权限为 `0644`，确保静态 Web 服务可读；可通过 `DASHBOARD_DATA_MODE` 调整，但拒绝 world-writable 权限。

## 命令

```bash
python3 .agents/skills/sorftime-dashboard-publish/scripts/publish_dashboard.py \
  --input staging/amazon-dashboard-2026-08-19.json \
  --target data/dashboard-data.json \
  --keep-weeks 12
```

只验证、不更新正式数据：

```bash
python3 .agents/skills/sorftime-dashboard-publish/scripts/publish_dashboard.py \
  --input staging/amazon-dashboard-2026-08-19.json \
  --target data/dashboard-data.json \
  --dry-run
```

生产调度应通过项目 Runner 调用本 Skill，不要绕过快照生成与校验步骤直接编辑 `data/dashboard-data.json`。
