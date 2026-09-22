# CI/CD, интеграции, мониторинг и логирование «ДокПоток»

ДЗ-6 «Настройка CI/CD и интеграция сервисов». Продолжение проекта из ДЗ-4/ДЗ-5. Отчёт по безопасности — отдельный файл [security_audit.md](security_audit.md).

## 1. CI/CD (Шаг 1)

**Платформа:** GitHub Actions. **Хостинг:** GitHub Pages — выбран потому, что не требует отдельного аккаунта и токенов: деплой идёт через OIDC (`id-token: write`) прямо из workflow. Vercel/Netlify — альтернатива в разделе 1.4.

### 1.1. Пайплайн `.github/workflows/ci.yml`

Сгенерирован AI-агентом по промпту: «Сделай GitHub Actions для Vite+React+TS: job quality на push/PR (npm ci, npm audit prod, oxlint с 0 предупреждений, prettier --check, tsc, vitest, vite build с base под Pages, артефакт), job deploy на GitHub Pages только для main после quality, smoke-check URL после деплоя; секреты Supabase из GitHub Secrets, счётчик Метрики из Variables; concurrency, чтобы параллельные пуши не гонялись».

| Этап | Команда | Что ловит |
|---|---|---|
| Зависимости | `npm ci` | несоответствие lock-файла |
| Аудит | `npm audit --omit=dev --audit-level=high` | известные уязвимости production-зависимостей |
| Линтер | `oxlint --max-warnings 0` | ошибки хуков React, неиспользуемый код (на первом прогоне нашёл 3 реальных предупреждения в `App.tsx` — исправлены, см. раздел 6) |
| Форматирование | `prettier --check .` | единый стиль (`.prettierrc`) |
| Типы | `tsc -b --noEmit` | строгая типизация |
| Тесты | `vitest run` | 26 тестов |
| Сборка | `vite build` c `VITE_BASE_PATH=/<repo>/` | production-бандл; размер печатается в лог |
| Деплой | `actions/deploy-pages@v4` + `curl` smoke-check | публикация и проверка HTTP 200 |

Локально тот же набор: `npm run ci`.

### 1.2. Настройка репозитория (один раз)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions:**
   - Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable key — публичный, но держим в Secrets, чтобы не хардкодить в workflow).
   - Variables: `VITE_YM_ID` (счётчик Метрики), `HEALTH_URL`, `SITE_URL` (для мониторинга, раздел 4).
3. Push в `main` → workflow «CI/CD» → приложение по адресу `https://<owner>.github.io/docflow/`.

Без секретов пайплайн тоже зелёный — приложение собирается в демо-режиме на мок-данных (это проверено локально: `npm run ci` без `.env.local`).

### 1.3. Проверка на тестовых коммитах (факт)

- **Репозиторий:** https://github.com/topchiiaa-eng/docflow · **Приложение:** https://topchiiaa-eng.github.io/docflow/
- **Прогон 1** (первый push, [run 35698452896](https://github.com/topchiiaa-eng/docflow/actions/runs/35698452896)): job `quality` ✅ (линт, prettier, типы, 26 тестов, аудит, сборка), job `deploy` ✗ — GitHub Pages ещё не был включён в настройках репозитория. Ожидаемая и полезная ошибка: показала, что деплой действительно зависит от настройки Pages, а не молча «проходит».
- **Прогон 2** (коммит с правкой README, [run 35700624692](https://github.com/topchiiaa-eng/docflow/actions/runs/35700624692)): `quality` ✅ → `deploy` ✅ → smoke-check `GET https://topchiiaa-eng.github.io/docflow/ → 200`. Скриншот: `docs/screenshots/ci-run.png`.
- **Проверка после деплоя:** пути ассетов `/docflow/assets/…` корректны (base из `VITE_BASE_PATH`), meta-CSP на месте; вход тестовым пользователем на опубликованном сайте → лента с реальными данными Supabase (`docs/screenshots/live-desktop.png`, `live-mobile.png` сняты с production-адреса).

### 1.4. Альтернатива: Vercel

`npx vercel --prod` из job `deploy` с секретами `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; `base` тогда `/`. Не выбран, чтобы не заводить ещё один аккаунт и токен ради учебного деплоя.

## 2. OAuth2 — Google через Supabase Auth (Шаг 3)

**Почему Google, а не Яндекс ID:** Supabase Auth поддерживает Google «из коробки» (PKCE-flow, обмен кода на токен на стороне Supabase — backend-часть flow реализована провайдером); Яндекс ID потребовал бы собственного бэкенда для обмена кода, которого в архитектуре нет.

### 2.1. Как это устроено

```
[Войти через Google] → supabase.auth.signInWithOAuth({provider:'google', redirectTo})
      → accounts.google.com (согласие) → https://<ref>.supabase.co/auth/v1/callback (обмен code→token, PKCE)
      → redirectTo (наш сайт) #access_token=…  → supabase-js сохраняет сессию → onAuthStateChange → App
      ошибка: → redirectTo #error=access_denied… → parseOAuthError() → русское сообщение в форме входа
```

Код: `src/components/AuthGate.tsx` (кнопка, `signInWithGoogle`, показ ошибки возврата), `src/lib/auth.ts` (`parseOAuthError` — чистая функция, 3 теста). Данные пользователя: `session.user.email`, `user_metadata.full_name` → показываются в шапке. Регистрация через Google проходит тот же триггер `handle_new_user` → пользователь получает демо-набор данных.

**Безопасность:** `redirectTo` — константа `origin + BASE_URL` (не из URL → нет open redirect); Supabase принимает только адреса из allowlist.

### 2.2. Настройка (консоль провайдера + Supabase)

1. [console.cloud.google.com](https://console.cloud.google.com) → проект → **APIs & Services → OAuth consent screen** (External, название «ДокПоток», тестовые пользователи — ваш email) → **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origins: `https://<owner>.github.io`, `http://localhost:5173`
   - Authorized redirect URIs: `https://sfxjsknijnluvgymqizp.supabase.co/auth/v1/callback`
   - Скопировать **Client ID** и **Client Secret**.
2. Supabase → **Authentication → Sign In / Providers → Google** → включить, вставить Client ID и Secret → Save.
3. Supabase → **Authentication → URL Configuration**: Site URL = `https://<owner>.github.io/docflow/`; Redirect URLs: тот же адрес + `http://localhost:5173/`.

### 2.3. Тестирование

| Сценарий | Ожидание |
|---|---|
| Успешный вход | после согласия Google — лента, в шапке имя из Google-профиля и email |
| Отмена на экране Google | возврат на форму входа с текстом «Вход через Google отменён» (`#error=access_denied`) |
| Redirect URI не в allowlist | Supabase не возвращает на сайт — типичная ошибка настройки, лечится шагом 2.2.3 |
| Получение данных пользователя | `session.user.user_metadata` содержит `full_name`, `avatar_url`, `email_verified` |

## 3. Аналитика — Яндекс.Метрика (Шаг 4)

**Код:** `src/lib/analytics.ts` — тег Метрики вставляется динамически (без `document.write`, совместимо с CSP), счётчик из `VITE_YM_ID`; без счётчика все вызовы no-op (тесты, демо). API: `track(event, params)` → `ym(id, 'reachGoal', event, params)`.

**События** (спроектированы с AI по промпту «какие события нужны, чтобы понимать воронку “вход → просмотр → подписание” и болевые точки»; список — тип `AnalyticsEvent`, единая точка правды для целей в Метрике):

| Событие | Где | Зачем |
|---|---|---|
| `login_password`, `login_google`, `signup`, `logout` | AuthGate | доля OAuth vs пароль, конверсия регистрации |
| `document_open` | открытие карточки | глубина просмотра |
| `filter_change`, `search` | FiltersBar | востребованность фильтров |
| `sign_dialog_open` → `sign_confirm` → `sign_success` / `sign_denied` | поток подписания | воронка подписания и доля отказов (по ролям/ошибкам) |
| `load_error` | загрузка ленты | частота проблем бэкенда глазами пользователя |

Персональные данные в параметры не передаются (проверяется code review — параметры только `string|number|boolean` без email/имён).

**Настройка:** metrika.yandex.ru → Добавить счётчик (адрес `https://<owner>.github.io/docflow/`) → номер счётчика → Variables `VITE_YM_ID` в GitHub и `VITE_YM_ID=…` в `.env.local`. Цели: Метрика → Цели → «JavaScript-событие» с идентификаторами из таблицы выше.

**Проверка отправки:** DevTools → Network → фильтр `mc.yandex.ru` → при клике по документу уходит запрос `…/watch/<id>?…goal://…/document_open`; в Метрике — Отчёты → Конверсии (данные появляются с задержкой до нескольких минут).

## 4. Мониторинг и Health Check (Шаг 6)

### 4.1. Health-check endpoint

Миграция 3 создаёт RPC `health()` (`stable security definer`, разрешена `anon`) — доступна GET-запросом без входа:

```
GET https://sfxjsknijnluvgymqizp.supabase.co/rest/v1/rpc/health?apikey=<publishable-key>
→ HTTP 200 {"status":"ok","service":"docflow-db","time":"2026-09-22T06:43:04Z",
            "checks":{"database":"ok","documents_total":12,"auth_users_reachable":true}}   ← реальный ответ после миграции 3
```

Проверки безопасности после миграции 3 (факт): анонимный `GET /rest/v1/documents` → **401** (было 200 с пустым списком); `POST /rpc/seed_demo_data` под пользователем → **403 permission denied for function**.

Проверяет: доступность PostgreSQL (сам факт ответа), таблицу `documents` (RLS/права), схему `auth`. Не отдаёт ничего чувствительного — только счётчик.

### 4.2. Мониторинг: GitHub Actions по расписанию

`.github/workflows/uptime.yml` каждые 30 минут дёргает `HEALTH_URL` (ожидает 200 и `"status":"ok"`) и `SITE_URL` (200). Падение job → GitHub отправляет владельцу письмо о failed workflow — это и есть алерт, без внешнего сервиса и аккаунта. Ручной запуск — `workflow_dispatch`.

**Внешний вариант:** UptimeRobot (бесплатно, 5-минутный интервал) — HTTP-монитор на тот же `HEALTH_URL` с keyword `"status":"ok"` и алертами в Telegram/email; добавляется за 2 минуты, если нужен интервал чаще 30 минут.

**Встроенное:** Supabase Dashboard → Reports (API requests, DB CPU/RAM, ошибки Auth) и Logs.

## 5. Логирование (Шаг 7)

**Структура:** `src/lib/logger.ts` — каждая запись одна JSON-строка `{ts, level, event, ...context}`; уровни `debug` (только dev) / `info` / `warn` / `error`; события именуются `область.действие` (`document.signed`, `auth.oauth_failed`, `supabase.list_failed`).

**Централизованное хранение:** записи `warn`/`error` уходят sink'ом в таблицу `client_logs` Supabase (миграция 3): RLS — пользователь пишет только от своего имени и читает только свои; серверные логи — Supabase Logs (Postgres/PostgREST/Auth); доменный журнал подписаний — `sign_attempts`. Выгрузка для анализа: `scripts/logs-export.sh` (JSON Lines).

**Пример записей** (реальные, из прогона тестов негативных сценариев):

```json
{"ts":"2026-09-18T07:58:56.730Z","level":"error","event":"supabase.sign_failed","code":"PGRST301","message":"JWT expired"}
{"ts":"2026-09-18T07:58:56.731Z","level":"error","event":"supabase.list_failed","code":"42501","message":"permission denied for table documents"}
{"ts":"2026-09-18T07:58:56.836Z","level":"error","event":"documents.load_failed","message":"провайдер недоступен"}
```

### 5.1. Анализ логов с помощью AI — промпты

Промпт-шаблон (RTCF из ДЗ-2):

> **Role:** SRE-инженер. **Task:** проанализируй выгрузку JSON-логов фронтенда за период и найди: (1) повторяющиеся ошибки — сгруппируй по `event` и `code`, (2) аномалии по времени (всплески), (3) признаки атак — много `auth.failed` с одного `ua`, (4) для каждой группы — вероятная причина и что проверить первым. **Context:** приложение React + Supabase; коды `PGRST301` = истёкший JWT, `42501` = нет прав (RLS/grant), `PGRST202` = функция не найдена в schema cache (обычно не применена миграция). **Format:** таблица «группа → количество → причина → действие», затем 3 приоритетных действия.

Проверено на записях выше — вывод агента: `PGRST301` в `sign_failed` → сессия истекла во время работы, действие: обновлять токен перед RPC или показывать «войдите заново» (реализовано в `userMessage`); `42501` в `list_failed` → у роли нет grant на таблицу — проверить, применены ли `grant select` миграции; `documents.load_failed` без кода → сеть/провайдер недоступен, смотреть корреляцию с health-check.

Ещё два готовых промпта: «объясни цепочку событий одного пользователя за 5 минут до `sign_denied`» (разбор инцидента) и «сравни частоту `load_error` за неделю до и после деплоя <sha>» (регрессии после релиза).

## 6. Тестирование и оптимизация (Шаг 8)

**Проверки:** локальный `npm run ci` — линт 0 предупреждений, prettier, tsc, **26/26 тестов** (включая новые: логгер, аналитика, `parseOAuthError`, маскирование ошибок провайдера), сборка. API и RLS — `scripts/api-tests.sh` (ДЗ-5); OAuth и Метрика — ручные сценарии из разделов 2.3 и 3 после настройки аккаунтов.

**Оптимизация по рекомендациям AI** (промпт: «посмотри vite build output и предложи оптимизации без смены архитектуры»):

1. **Разделение чанков:** `@supabase/supabase-js` вынесен в отдельный чанк `supabase-*.js` (`manualChunks` в `vite.config.ts`) — библиотека кэшируется браузером отдельно от кода приложения, при каждом релизе пользователь докачивает только небольшой чанк приложения.
2. **Стабильные ссылки для `useMemo`:** `NO_DOCS` вместо `[]` в рендере — фильтрация и список организаций не пересчитываются на каждый рендер (найдено линтером `react-hooks/exhaustive-deps`).
3. **Загрузка без синхронного `setState` в эффекте** + отмена устаревших ответов (`cancelled` flag) — убрана лишняя перерисовка и гонка при быстром «Повторить».
4. Тег Метрики — `async`, вставляется после инициализации приложения, не блокирует первый рендер.

Размер production-бандла после оптимизации (gzip): приложение ≈ 66 КБ + supabase ≈ 50 КБ + CSS ≈ 5 КБ; чанк приложения меняется при релизах, supabase — нет.

## 7. Использование AI в этом ДЗ (сводка)

| Шаг | Как использован AI-агент |
|---|---|
| CI/CD | генерация обоих workflow по текстовому описанию этапов; исправление предупреждений линтера |
| Аудит | независимый агент-аудитор (OWASP) → 12 находок → верификация и исправления основным агентом; отчёт в `security_audit.md` |
| OAuth / аналитика | генерация кода интеграций, проектирование списка событий, разбор ошибок OAuth |
| Логи | структура логгера, sink в Supabase, промпты и проверка анализа на реальных записях |
| Оптимизация | рекомендации по чанкам и хукам, применены и измерены |
