#!/bin/bash
# Проверка API Supabase (ДЗ-5, Шаг 8). Требует: SUPA, ANON, EMAIL, PASS в окружении.
set -u
export PYTHONIOENCODING=utf-8 LANG=ru_RU.UTF-8
H=(-H "apikey: $ANON" -H "Content-Type: application/json")
step() { printf '\n### %s\n```\n' "$1"; }

step "1. Вход (POST /auth/v1/token) → access_token"
TOKEN=$(curl -s "$SUPA/auth/v1/token?grant_type=password" "${H[@]}" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
echo "access_token: ${TOKEN:0:24}… (JWT получен)"; echo '```'
A=(-H "Authorization: Bearer $TOKEN")

step "2. GET /rest/v1/documents с JWT — документы своих организаций (RLS)"
curl -s "$SUPA/rest/v1/documents?select=id,title,status,organizations(name)&order=received_at.desc" "${H[@]}" "${A[@]}" | python3 -m json.tool --no-ensure-ascii; echo '```'

step "3. НЕГАТИВ: GET /rest/v1/documents без JWT — RLS не пускает"
curl -s "$SUPA/rest/v1/documents?select=id" "${H[@]}" -w "\nHTTP %{http_code}\n"; echo '```'

# ID выбираем на стороне Python: кириллица в URL-фильтре PostgREST требует percent-encoding
ALL=$(curl -s "$SUPA/rest/v1/documents?select=id,counterparty" "${H[@]}" "${A[@]}")
DOC_OK=$(echo "$ALL"   | python3 -c "import json,sys; print(next(d['id'] for d in json.load(sys.stdin) if 'ГетБлоггер' in d['counterparty']))")
DOC_DENY=$(echo "$ALL" | python3 -c "import json,sys; print(next(d['id'] for d in json.load(sys.stdin) if 'Крипто' in d['counterparty']))")

step "4. НЕГАТИВ: PATCH status=signed напрямую — запрещено правами колонок"
curl -s -X PATCH "$SUPA/rest/v1/documents?id=eq.$DOC_OK" "${H[@]}" "${A[@]}" -d '{"status":"signed"}' -w "\nHTTP %{http_code}\n"; echo '```'

step "5. PATCH unread=false (пометить прочитанным) — разрешено"
curl -s -X PATCH "$SUPA/rest/v1/documents?id=eq.$DOC_OK" "${H[@]}" "${A[@]}" -H "Prefer: return=representation" -d '{"unread":false}' | python3 -c "import json,sys; d=json.load(sys.stdin)[0]; print({'title':d['title'],'unread':d['unread']})"; echo '```'

step "6. POST /rest/v1/rpc/sign_document — роль signer (Компания А) → подписан"
curl -s "$SUPA/rest/v1/rpc/sign_document" "${H[@]}" "${A[@]}" -d "{\"doc_id\":\"$DOC_OK\"}" | python3 -c "import json,sys; d=json.load(sys.stdin); print({'ok':d['ok'],'title':d['document']['title'],'status':d['document']['status']})"; echo '```'

step "7. НЕГАТИВ: sign_document для Компании В — роль operator → отказ"
curl -s "$SUPA/rest/v1/rpc/sign_document" "${H[@]}" "${A[@]}" -d "{\"doc_id\":\"$DOC_DENY\"}" -w "\nHTTP %{http_code}\n"; echo '```'

step "8. НЕГАТИВ: повторное подписание уже подписанного"
curl -s "$SUPA/rest/v1/rpc/sign_document" "${H[@]}" "${A[@]}" -d "{\"doc_id\":\"$DOC_OK\"}" -w "\nHTTP %{http_code}\n"; echo '```'

step "9. GET /rest/v1/sign_attempts — append-only журнал (успех + отказ)"
curl -s "$SUPA/rest/v1/sign_attempts?select=success,detail,attempted_at&order=id" "${H[@]}" "${A[@]}" | python3 -m json.tool --no-ensure-ascii; echo '```'

step "10. НЕГАТИВ: DELETE документа — прав нет"
curl -s -X DELETE "$SUPA/rest/v1/documents?id=eq.$DOC_OK" "${H[@]}" "${A[@]}" -w "\nHTTP %{http_code}\n"; echo '```'
