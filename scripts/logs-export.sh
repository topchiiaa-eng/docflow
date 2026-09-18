#!/bin/bash
# Выгрузка централизованных клиентских логов (таблица client_logs, миграция 3) для анализа AI.
# Загрузка учётных данных: set -a; source .env.test.local; set +a; ./scripts/logs-export.sh [N]
# Печатает последние N (по умолчанию 50) записей уровня warn/error текущего пользователя в JSON Lines.
set -u
export PYTHONIOENCODING=utf-8
N=${1:-50}
TOKEN=$(curl -s "$SUPA/auth/v1/token?grant_type=password" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
curl -s "$SUPA/rest/v1/client_logs?select=ts,level,event,context,ua&order=ts.desc&limit=$N" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import json,sys; [print(json.dumps(r, ensure_ascii=False)) for r in json.load(sys.stdin)]"
