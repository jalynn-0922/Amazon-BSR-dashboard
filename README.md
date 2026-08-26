# Amazon BSR Dashboard

Amazon 与淘天跨平台周度市场情报看板。仓库已融合 Amazon 的 Sorftime/Doris 12 类目链路与淘天 Doris 9 类目生产链路，服务器每周一次统一刷新两个平台。

## 每周生产链路

```text
Sorftime API
  → sorftime-bsr-sync（12 类目写入 Doris）
  → sorftime-weekly-report（直接生成结构化周快照）
淘天榜单源表
  → taotian-bsr-dashboard（Top 100 同步、9 类目周快照）
两平台快照
  → sorftime-dashboard-publish（分平台校验并原子发布 JSON）
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
- `.agents/skills/taotian-bsr-dashboard`：淘天 Doris 安全同步与 9 类目结构化快照。
- `.agents/skills/sorftime-dashboard-publish`：双平台快照校验、历史周合并与原子发布。
- `.agents/workflows/run_sorftime_weekly_workflow.py`：双平台生产 Runner（文件名为兼容原服务器入口而保留）。

## 本地预览

```bash
python3 -m http.server 4173
```

访问 <http://127.0.0.1:4173/?platform=amazon>。当某个平台没有正式周次时，该平台使用内置 Demo；正式快照发布后，该平台自动切换为真实数据。

## 安装与配置

需要 Python 3.11+：

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

在本地忽略的 `.env` 中分别配置 Amazon `DORIS_*` 与淘天 `TAOTIAN_DORIS_*`。不要提交真实密钥、内部主机、日志或快照 staging 文件。

## 验证

```bash
python3 .agents/workflows/run_sorftime_weekly_workflow.py --preflight
pytest
```

读取 Doris 但不改 Doris 或正式看板数据：

```bash
python3 .agents/workflows/run_sorftime_weekly_workflow.py \
  --amazon-date 2026-08-19 \
  --taotian-date 2026-08-17 \
  --dry-run
```

生产运行：

```bash
python3 .agents/workflows/run_sorftime_weekly_workflow.py \
  --amazon-date 2026-08-19 \
  --taotian-date 2026-08-17
```

同日期重跑会替换该周，不会增加重复周次；正式 JSON 默认保留最近 12 周。生成或校验失败时，上一版正式数据不变。

## 服务器调度

推荐让服务器直接更新部署目录，不需要每周向 GitHub 提交数据：

```text
0 17 * * 5 /opt/ulanzi/report/Amazon-BSR-dashboard/.agents/workflows/run_sorftime_weekly_cron.sh
```

部署路径不同可在服务器本地设置 `DASHBOARD_PROJECT_ROOT`。详细流程见 [每周看板工作流](.agents/workflows/sorftime-weekly-dashboard-workflow.md)。

本仓库在 `deploy/` 中提供当前 Ulanzi 内网服务器使用的 systemd 单元和周五 cron 条目。systemd 服务仅绑定服务器 Tailscale IP 的 `4173` 端口。

## 数据口径

- 每周五 17:00 统一发布：Amazon 使用最近一个已完成周三；淘天先接收服务商新增数据，再使用目标表最新可用业务日期，兼容服务商延迟推送。
- 价格沿用生产 SQL 的“美分 ÷ 100”美元口径。
- 排名使用 Doris `bsr_rank`。
- 新品机会：上架不超过 90 天。
- 本周待关注：新品、评分低于 4.0 且排名上升，或单周排名变化不少于 30 位。
- 商品图片从 Doris `photo` 字段解析首张 URL，前端不再人工配置图片。
- 淘天商品图片与链接直接来自 `commodity_picture`、`commodity_link`；当前源表未提供价格、评分、销量和上架时间，看板以“—”呈现。
