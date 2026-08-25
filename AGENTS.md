# Amazon BSR Dashboard Project Guide

This repository owns the production weekly dashboard pipeline.

## Project skills

- `sorftime-bsr-sync`: Sorftime API to Doris for the 12 configured leaf categories.
- `sorftime-weekly-report`: Doris queries and deterministic weekly analysis; the dashboard snapshot entrypoint is the production default.
- `sorftime-dashboard-publish`: validate and atomically publish runtime dashboard JSON.

Do not reintroduce `sorftime-report-base-sync`, Feishu Base/docx publication, or Markdown generation into the scheduled dashboard path.

## Invariants

- Keep API-to-Doris synchronization separate from analysis and publication.
- Scheduled BSR sync must not force-refresh complete data unless explicitly requested.
- A production week must contain five report groups and twelve unique leaf categories.
- Build snapshots in staging and validate them before replacing `data/dashboard-data.json`.
- Same-date reruns replace the existing week; they must not duplicate it.
- Failed generation or validation must leave the previous runtime JSON intact.
- Keep credentials, internal endpoints, logs, staging snapshots, and generated runtime weeks out of Git history unless a sanitized fixture is intentionally added.
- Run the project Runner preflight and tests before production changes.
