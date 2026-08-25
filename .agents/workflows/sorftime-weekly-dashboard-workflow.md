# Sorftime 亚马逊看板每周自动化

## 调度与范围

- 每周五 17:00（Asia/Shanghai）执行，使用最近一个已经结束的周三数据。
- 覆盖 5 个报告组、12 个 Sorftime 叶子类目。
- GitHub 保存代码；生产周数据由服务器写入部署目录的 `data/dashboard-data.json`，不要求每周提交 Git。

## Skill 顺序

1. `sorftime-bsr-sync`：补齐本周三 12 类目 Top 100 到 Doris；已完整的数据默认跳过，不强制刷新。
2. `sorftime-weekly-report`：复用 12 类目 SQL 与分析口径，直接生成单周结构化 JSON，不生成 Markdown。
3. `sorftime-dashboard-publish`：校验快照并原子更新看板运行时 JSON；同日期重跑替换，默认保留 12 周。

飞书 Base、Base 内 docx、Markdown 导入与 publication registry 均不属于本工作流。

## 入口

```bash
python3 .agents/workflows/run_sorftime_weekly_workflow.py --preflight
python3 .agents/workflows/run_sorftime_weekly_workflow.py --date 2026-08-19 --dry-run
python3 .agents/workflows/run_sorftime_weekly_workflow.py --date 2026-08-19
```

生产 cron：

```text
0 17 * * 5 /opt/ulanzi/report/Amazon-BSR-dashboard/.agents/workflows/run_sorftime_weekly_cron.sh
```

## 失败边界

- BSR 同步失败：不生成、不发布新快照。
- Doris 查询或 5组/12类目校验失败：不更新正式 JSON。
- 发布失败：保留上一版 `data/dashboard-data.json`。
- 锁已占用：记录 skipped 后退出，避免并发覆盖。
- 所有运行摘要写入 `logs/sorftime-dashboard-workflow/`，敏感变量不写入仓库。
