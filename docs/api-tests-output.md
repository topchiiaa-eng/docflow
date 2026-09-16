
### 1. Вход (POST /auth/v1/token) → access_token
```
access_token: eyJhbGciOiJFUzI1NiIsImtp… (JWT получен)
```

### 2. GET /rest/v1/documents с JWT — документы своих организаций (RLS)
```
[
    {
        "id": "e076006d-2dcb-4980-b800-f4eea65aed39",
        "title": "УПД № 260810/54",
        "status": "signed",
        "organizations": {
            "name": "Компания А"
        }
    },
    {
        "id": "34502361-fa6b-485f-9dfd-15d1e95935e1",
        "title": "Акт сверки № 809",
        "status": "requires_signature",
        "organizations": {
            "name": "Компания Б"
        }
    },
    {
        "id": "74e7edbe-ce38-4ef0-a714-030d7b0a324f",
        "title": "УПД № 4451/2",
        "status": "requires_signature",
        "organizations": {
            "name": "Компания В"
        }
    },
    {
        "id": "1f86ad10-fe93-4709-8d4f-bf8e12b5ccf6",
        "title": "Счёт № 31958300",
        "status": "info",
        "organizations": {
            "name": "Компания В"
        }
    },
    {
        "id": "af0dd5b0-19b4-423d-9f08-94a0ae8f5ee1",
        "title": "Акт № 31 от 31.07",
        "status": "signed",
        "organizations": {
            "name": "Компания А"
        }
    },
    {
        "id": "5177d689-6f33-4d71-8450-f0a59c6c9d19",
        "title": "УПД № 8807/2",
        "status": "signed",
        "organizations": {
            "name": "Компания Б"
        }
    }
]
```

### 3. НЕГАТИВ: GET /rest/v1/documents без JWT — RLS не пускает
```
[]
HTTP 200
```

### 4. НЕГАТИВ: PATCH status=signed напрямую — запрещено правами колонок
```
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT UPDATE ON public.documents TO authenticated;","message":"permission denied for table documents"}
HTTP 403
```

### 5. PATCH unread=false (пометить прочитанным) — разрешено
```
{'title': 'Акт сверки № 809', 'unread': False}
```

### 6. POST /rest/v1/rpc/sign_document — роль signer (Компания А/Б) → подписан
```
{'ok': True, 'title': 'Акт сверки № 809', 'status': 'signed'}
```

### 7. НЕГАТИВ: sign_document для Компании В — роль operator → отказ
```
{"ok": false, "error": "Подписание доступно только роли «Подписант»"}
HTTP 200
```

### 8. НЕГАТИВ: повторное подписание уже подписанного
```
{"ok": false, "error": "Документ не требует подписи"}
HTTP 200
```

### 9. GET /rest/v1/sign_attempts — append-only журнал (успех + отказ)
```
[
    {
        "success": true,
        "detail": null,
        "attempted_at": "2026-09-16T07:37:57.817152+00:00"
    },
    {
        "success": false,
        "detail": "отказ: документ не требует подписи",
        "attempted_at": "2026-09-16T08:10:44.073303+00:00"
    },
    {
        "success": false,
        "detail": "отказ: роль без права подписи",
        "attempted_at": "2026-09-16T08:10:44.431868+00:00"
    },
    {
        "success": false,
        "detail": "отказ: документ не требует подписи",
        "attempted_at": "2026-09-16T08:10:44.790199+00:00"
    },
    {
        "success": true,
        "detail": null,
        "attempted_at": "2026-09-16T08:11:24.842517+00:00"
    },
    {
        "success": false,
        "detail": "отказ: роль без права подписи",
        "attempted_at": "2026-09-16T08:11:25.212661+00:00"
    },
    {
        "success": false,
        "detail": "отказ: документ не требует подписи",
        "attempted_at": "2026-09-16T08:11:25.581703+00:00"
    }
]
```

### 10. НЕГАТИВ: DELETE документа — прав нет
```
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT DELETE ON public.documents TO authenticated;","message":"permission denied for table documents"}
HTTP 403
```
