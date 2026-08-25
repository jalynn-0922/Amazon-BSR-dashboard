#!/usr/bin/env bash
set -uo pipefail

PROJECT_ROOT="${DASHBOARD_PROJECT_ROOT:-/opt/ulanzi/report/Amazon-BSR-dashboard}"
LOCK_FILE="${DASHBOARD_WEEKLY_LOCK_FILE:-/tmp/amazon-bsr-dashboard.lock}"

cd "$PROJECT_ROOT" || exit 1
umask 077
mkdir -p logs/cron
chmod 700 logs logs/cron 2>/dev/null || true
touch logs/cron/cron.log
chmod 600 logs/cron/cron.log 2>/dev/null || true
exec >> logs/cron/cron.log 2>&1

timestamp() { date '+%Y-%m-%d %H:%M:%S %Z'; }
echo "[$(timestamp)] amazon-bsr dashboard cron start"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(timestamp)] [WARN] dashboard cron lock busy, skipped"
  exit 0
fi

python3 .agents/workflows/run_sorftime_weekly_workflow.py
status=$?
if [ "$status" -ne 0 ]; then
  echo "[$(timestamp)] [ERROR] dashboard cron failed exit_code=$status"
else
  echo "[$(timestamp)] amazon-bsr dashboard cron finished"
fi
exit "$status"
