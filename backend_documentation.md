# Backend «ДокПоток»: архитектура, развёртывание, API

ДЗ-5 «Развертывание Backend и интеграция с Frontend». Бэкенд для приложения из ДЗ-4.

## 1. Выбор инфраструктуры (Шаг 2)

**Выбран вариант A — Supabase (BaaS).** Обоснование через ограничения проекта (метод из ДЗ-1: сначала жёсткие ограничения, потом сравнение):

| Фактор | Supabase | Self-hosted (Docker+VPS) |
|---|---|---|
| Права администратора на машине разработчика | не нужны ✅ | Docker Desktop требует прав администратора ❌ |
| VPS в наличии | не нужен ✅ | нужен арендованный сервер (+деньги, +настройка) |
| Auth, RLS, REST API | из коробки | писать и сопровождать самим |
| Соответствие ТЗ «ДокПоток» | PostgreSQL — рекомендация ТЗ (раздел 6) ✅ | тоже PostgreSQL, но дороже по времени |
| Риск | вендор-лок BaaS (приемлем для MVP) | — |

Self-hosted отпал на первом же жёстком ограничении — как cloud-агенты в ДЗ-1.

## 2. Архитектура (Шаг 1)

```
Frontend (React, Vite)                 Supabase
┌─────────────────────┐   HTTPS   ┌──────────────────────────────┐
│ AuthGate (сессия)   │ ────────▶ │ Auth (email+пароль, JWT)     │
│ EdoProvider:        │           │ PostgREST (автоматический    │
│  ├ listIncoming ────┼──────────▶│   REST API поверх таблиц)    │
│  ├ markRead ────────┼──────────▶│ PostgreSQL + RLS             │
│  └ sign ────────────┼──────────▶│ RPC sign_document (plpgsql)  │
└─────────────────────┘           └──────────────────────────────┘
```

Ключевое решение ещё из ДЗ-4 — интерфейс `EdoProvider`: фронтенд не знает, откуда данные. Реализации: `mockProvider` (демо/тесты) и `supabaseProvider` (реальный бэкенд); выбор — по наличию переменных окружения (`src/api/index.ts`). Благодаря этому интеграция бэкенда не потребовала менять ни один компонент интерфейса.

### Схема данных

| Таблица | Поля | Связи |
|---|---|---|
| `organizations` | id, name, created_at | — |
| `org_members` | org_id, user_id, **role** (operator / signer / accountant) | organizations ↔ auth.users (M:N) |
| `documents` | id, org_id, counterparty, title, kind, sum, received_at, status, unread | → organizations |
| `sign_attempts` | id, document_id, user_id, attempted_at, success, detail | → documents, auth.users; **append-only** |

Миграция: [supabase/migrations/20260916000000_init.sql](supabase/migrations/20260916000000_init.sql) — одна транзакция: таблицы → права колонок → RLS → RPC → триггер демо-данных.

## 3. Развёртывание (Шаг 3)

1. Создать проект на [supabase.com](https://supabase.com) (Free tier достаточно), регион — любой EU.
2. **SQL Editor → New query** → вставить содержимое `supabase/migrations/20260916000000_init.sql` → Run. (Альтернатива: `supabase db push` через CLI.)
3. **Authentication → Sign In / Up → Email**: для демо удобно выключить «Confirm email» (иначе регистрация потребует перехода по ссылке из письма — тоже работает).
4. **Project Settings → API**: скопировать Project URL и anon (publishable) key.
5. Во фронтенде: `cp .env.example .env.local`, вписать оба значения; `npm run dev`.

Каждый новый зарегистрированный пользователь автоматически получает демо-набор: 3 организации (в «А» и «Б» он Подписант, в «В» — Оператор без права подписи) и 6 документов — проверяющему не нужно ничего наполнять руками.

## 4. API (Шаг 4)

REST API генерируется PostgREST автоматически из схемы. Используемые endpoint'ы (все — под JWT из Supabase Auth):

| Операция | Endpoint | CRUD |
|---|---|---|
| Список документов с организацией | `GET /rest/v1/documents?select=id,counterparty,title,kind,sum,received_at,status,unread,organizations(name)&order=received_at.desc` | Read |
| Пометить прочитанным | `PATCH /rest/v1/documents?id=eq.<uuid>` тело `{"unread": false}` | Update |
| Подписать (только через RPC) | `POST /rest/v1/rpc/sign_document` тело `{"doc_id": "<uuid>"}` | Update + Insert (журнал) |
| Журнал подписаний | `GET /rest/v1/sign_attempts?select=*` | Read |
| Регистрация / вход | `POST /auth/v1/signup`, `POST /auth/v1/token?grant_type=password` | — |

### Примеры запросов (curl)

```bash
SUPA=https://<проект>.supabase.co
ANON=<anon-key>

# вход → получить access_token
curl -s "$SUPA/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"secret123"}'

# документы (JWT из ответа выше)
curl -s "$SUPA/rest/v1/documents?select=title,status,organizations(name)&order=received_at.desc" \
  -H "apikey: $ANON" -H "Authorization: Bearer <access_token>"

# подписание
curl -s "$SUPA/rest/v1/rpc/sign_document" \
  -H "apikey: $ANON" -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" -d '{"doc_id":"<uuid>"}'

# негативный тест: без JWT — пустой список/401, RLS не пускает
curl -s "$SUPA/rest/v1/documents" -H "apikey: $ANON"
```

## 5. Безопасность (Шаг 5)

- **Аутентификация:** Supabase Auth, email+пароль; сессия и refresh — в supabase-js; экран входа/регистрации — `src/components/AuthGate.tsx`.
- **RLS включён на всех таблицах.** Политики: пользователь видит организации/документы/журнал только своих членств (`is_member()`, security definer против рекурсии); анонимам не выдано ни одной политики — без входа данных нет.
- **Права уровня колонок:** у клиента отозваны insert/update/delete; разрешён только `UPDATE (unread)`. Сменить `status` напрямую через REST **невозможно** — подписание только через RPC `sign_document`, который проверяет роль `signer`, статус документа и пишет попытку в append-only журнал (в т.ч. отказы). Это правило 8 из CLAUDE.md, перенесённое на уровень БД: фронтенд физически не может подписать без проверки.
- **Роли:** operator / signer / accountant (ТЗ, F-1). Демо-набор специально делает пользователя оператором в «Компании В» — попытка подписать документ этой организации возвращает «Подписание доступно только роли „Подписант"» и фиксируется в журнале.
- **Секреты:** в коде ключей нет; `.env.local` в gitignore, в репозитории — `.env.example`. Anon key — публичный по дизайну (защита — RLS); service_role key нигде не используется.
- **CORS:** Supabase отдаёт `Access-Control-Allow-Origin` для любых origin по умолчанию — фронтенд с localhost работает без настройки; при продакшен-деплое домен ограничивается в настройках проекта.

## 6. Обработка ошибок и логирование (Шаг 7)

- Сетевые ошибки/500 → error-state с «Повторить» (унаследовано из ДЗ-4, работает и для Supabase — сообщение ошибки провайдера показывается пользователю).
- 401/истёкшая сессия → `onAuthStateChange` сбрасывает сессию, пользователь возвращается на экран входа.
- 403 (роль без права подписи) → ошибка RPC показывается в карточке документа, статус не меняется, попытка — в `sign_attempts`.
- Ошибки валидации входа (неверный пароль, короткий пароль, повторная регистрация) → переведённые сообщения в форме.
- Логи: клиент — `console.error` на каждый отказ; сервер — **Supabase Logs** (Dashboard → Logs: Postgres, PostgREST, Auth) + append-only журнал `sign_attempts` как доменный лог подписаний.

## 7. Процесс разработки с AI (Шаг 8 и требование «Использование AI»)

- **Схема БД** сгенерирована агентом по промпту (шаблон 1 из ДЗ-2): «Спроектируй PostgreSQL-схему для ТЗ „ДокПоток" v1.3: организации, членства с ролями operator/signer/accountant, документы, append-only журнал подписаний; RLS: видимость только своих организаций; подписание только через RPC с проверкой роли». Скорректировано после ревью схемы: `security definer` у `is_member()` (иначе рекурсия RLS на `org_members`), права уровня колонок вместо простой update-политики (иначе клиент мог бы выставить `status='signed'` мимо RPC).
- **Код интеграции** (supabaseProvider, AuthGate) сгенерирован по тем же RTCF-промптам; интерфейс `EdoProvider` из ДЗ-4 позволил не трогать компоненты.
- **Отладка:** тесты (12/12) и сборка прогонялись после каждого изменения; сценарий анализа логов — раздел 6 (Supabase Logs + консоль браузера, методика из ДЗ-4).

## 8. Чек-лист приёмки end-to-end

1. Регистрация нового пользователя → сразу видны 3 организации и 6 документов (триггер сработал).
2. Открытие документа → бейдж «непрочитан» исчезает и **не возвращается после F5** (markRead ушёл на сервер).
3. Подписание УПД «ГетБлоггер» (Компания А) → статус «Подписан», KPI пересчитан, строка в `sign_attempts` с `success=true`.
4. Подписание «Крипто-Тест» (Компания В, роль оператор) → ошибка про роль «Подписант», статус не изменился, строка с `success=false`.
5. `curl` без JWT → данные не возвращаются (RLS).
6. Выход → экран входа; вход под вторым пользователем → виден **свой** набор данных, чужого не видно.
