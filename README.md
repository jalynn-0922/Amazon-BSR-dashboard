# Amazon BSR Dashboard

Amazon 与淘天跨平台周度市场情报看板。仓库已融合生产 Sorftime/Doris 基线和 12 类目分析逻辑；Amazon 每周数据可由服务器自动刷新，淘天目前继续使用演示数据，待正式采集链路接入。

## 每周生产链路

```text
Sorftime API
  → sorftime-bsr-sync（12 类目写入 Doris）
  → sorftime-weekly-report（直接生成结构化周快照）
  → sorftime-dashboard-publish（校验并原子发布 JSON）
  → 看板出现新周次
```

旧 `sorftime-report-base-sync`、飞书 Base、Base 内 docx 和 Markdown 周报发布均未迁入本仓库。

## 目录

- `index.html`、`app.js`、`styles.css`：看板前端。
- `data.js`：无正式运行数据时使用的 Demo 兜底。
- `data/dashboard-data.json`：服务器每周生成的正式运行数据（gitignored）。
- `data/dashboard-data.example.json`：空数据结构示例。
- `.agents/skills/sorftime-bsr-sync`：Sorftime API → Doris。
- `.agents/skills/sorftime-weekly-report`：12 类目 Doris 查询与周度结构化快照。
- `.agents/skills/sorftime-dashboard-publish`：快照校验、历史周合并与原子发布。
- `.agents/workflows/run_sorftime_weekly_workflow.py`：生产 Runner。

## 本地预览

```bash
python3 -m http.server 4173
```

访问 <http://127.0.0.1:4173/?platform=amazon>。当 `data/dashboard-data.json` 不存在或没有正式周次时，页面使用内置 Demo；存在正式 Amazon 周次后，页面只展示真实周快照。

## 安装与配置

需要 Python 3.11+：

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

在本地忽略的 `.env` 中配置 Sorftime 与 Doris。不要提交真实密钥、内部主机、日志或快照 staging 文件。

## 验证

```bash
python3 .agents/workflows/run_sorftime_weekly_workflow.py --preflight
pytest
```

读取 Doris 但不改 Doris 或正式看板数据：

```bash
python3 .agents/workflows/run_sorftime_weekly_workflow.py \
  --date 2026-08-19 \
  --dry-run
```

生产运行：

```bash
python3 .agents/workflows/run_sorftime_weekly_workflow.py --date 2026-08-19
```

同日期重跑会替换该周，不会增加重复周次；正式 JSON 默认保留最近 12 周。生成或校验失败时，上一版正式数据不变。

## 服务器调度

推荐让服务器直接更新部署目录，不需要每周向 GitHub 提交数据：

```text
0 17 * * 5 /opt/ulanzi/report/Amazon-BSR-dashboard/.agents/workflows/run_sorftime_weekly_cron.sh
```

部署路径不同可在服务器本地设置 `DASHBOARD_PROJECT_ROOT`。详细流程见 [每周看板工作流](.agents/workflows/sorftime-weekly-dashboard-workflow.md)。

## 数据口径

- 报告日期为周三；周五 17:00 发布最近一个已完成周三。
- 价格沿用生产 SQL 的“美分 ÷ 100”美元口径。
- 排名使用 Doris `bsr_rank`。
- 新品机会：上架不超过 90 天。
- 本周待关注：新品、评分低于 4.0 且排名上升，或单周排名变化不少于 30 位。
- 商品图片从 Doris `photo` 字段解析首张 URL，前端不再人工配置图片。
