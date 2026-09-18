# Отчёт по аудиту безопасности «ДокПоток»

ДЗ-6, Шаг 2. Дата аудита: 18.09.2026. Объект: репозиторий `docflow` (фронтенд React/Vite + бэкенд Supabase: миграции, RLS, RPC).

## Методика

1. **Зависимости:** `npm audit` (production и dev) — автоматическая проверка по базе уязвимостей npm; повторяется в CI на каждом push (`npm audit --omit=dev --audit-level=high`, см. `.github/workflows/ci.yml`).
2. **Код и схема БД — AI-аудит:** независимый агент Claude в роли аудитора безопасности (OWASP Top 10 + специфика Supabase/PostgREST/RLS) получил доступ на чтение к `src/`, миграциям, конфигам и документации. Промпт: «проведи аудит по OWASP Top 10; для каждой находки — категория, серьёзность, файл:строка, суть, эксплуатация, исправление кодом/SQL; отдельно перечисли, что сделано хорошо; не выдумывай». Полный отчёт агента — ниже в приложении.
3. **Верификация человеком/основным агентом:** каждая находка перепроверена по коду, приоритизирована и исправлена либо осознанно отклонена с обоснованием.

## Результаты `npm audit`

```
found 0 vulnerabilities   (production)
found 0 vulnerabilities   (production + dev)
```

Зависимости актуальны: `@supabase/supabase-js` 2.116, `vite` 8.2, `react` 19.2. Обновлять было нечего; проверка закреплена в CI.

## Найденные уязвимости и исправления

| ID | Находка | OWASP | Серьёзность | Статус | Исправление |
|---|---|---|---|---|---|
| F-01 | `seed_demo_data(uuid)` вызываема любым клиентом через `POST /rest/v1/rpc/…` — DoS квоты Free-tier циклом вызовов, засорение данных | A01 Broken Access Control | **Высоко** | ✅ исправлено | Миграция 3: `revoke execute … from public, anon, authenticated` для всех служебных функций (`seed_demo_data`, `handle_new_user`, `is_member`) |
| F-02 | Триггер сидинга не идемпотентен и без обработки ошибок: сбой = HTTP 500 на `/auth/v1/signup`; открытая регистрация без CAPTCHA | A04 Insecure Design | Средне | ✅ исправлено (код) / ⚙️ настройка | Миграция 3: проверка «уже засеяно» + `exception when others → raise warning`; в Supabase рекомендовано включить Confirm email и Captcha (Attack Protection) — настройка дашборда |
| F-03 | Тестовые пароли живых аккаунтов в README и backend_documentation (и в истории git) | A07 Auth Failures | Средне | ✅ исправлено | Пароли ротированы через `PUT /auth/v1/user`; из документов удалены; учётки передаются проверяющему вне репозитория; введён `.env.test.local` (gitignored) + `.env.test.example` |
| F-04 | TOCTOU в `sign_document`: `select` без `for update`, `update` без условия по статусу — два параллельных вызова = две «успешные» записи в журнале | A04 | Низко | ✅ исправлено | Миграция 3: `select … for update` + `update … where status = 'requires_signature'` с проверкой `not found` |
| F-05 | Сообщения PostgREST/GoTrue показывались пользователю как есть (`permission denied for table documents` + HINT) | A05 Misconfiguration | Низко | ✅ исправлено | `supabaseProvider.userMessage()`: код ошибки → общий русский текст, оригинал — только в структурированный лог; `translateAuthError` больше не возвращает сырое сообщение; тест «не раскрывает имена таблиц» |
| F-06 | Перечисление пользователей через «Такой пользователь уже зарегистрирован» | A07 | Низко | ⚠️ принято с оговоркой | Сообщение оставлено ради UX демо; закрывается включением Confirm email в Supabase (GoTrue тогда обфусцирует ответ) — задокументировано в инструкции развёртывания |
| F-07 | Нет Content-Security-Policy и Referrer-Policy | A05 | Низко | ✅ исправлено | `index.html`: meta-CSP (`script-src 'self' + mc.yandex.ru`, `connect-src` только Supabase и Метрика, `object-src 'none'`, `base-uri 'none'`), `referrer strict-origin-when-cross-origin`. Meta — единственный механизм на GitHub Pages (HTTP-заголовки задать нельзя) |
| F-08 | У `anon` оставался SELECT на всех таблицах: пустой 200 вместо 401 и OpenAPI-описание схемы | A05 | Низко | ✅ исправлено | Миграция 3: `revoke all on all tables in schema public from anon` |
| F-09 | `sign_attempts.user_id` виден другим членам организации | A01 | Инфо | ✅ исправлено | Миграция 3: `revoke select` + `grant select (id, document_id, attempted_at, success, detail)` — колонка `user_id` клиенту не отдаётся |
| F-10 | FK `sign_attempts.user_id` без `on delete` — удаление пользователя падает | A04 | Инфо | ✅ исправлено | Миграция 3: `user_id` nullable, `on delete set null` — журнал сохраняется, персональная привязка снимается |
| F-11 | Пароль в аргументах командной строки → `~/.zsh_history` | A02/A05 | Низко | ✅ исправлено | README и скрипты: `set -a; source .env.test.local; set +a` вместо `PASS=… ./script` |
| F-12 | Ложное утверждение о настройке CORS в документации | A05 | Инфо | ✅ исправлено | Абзац переписан: у PostgREST `Access-Control-Allow-Origin: *` без настройки; контроль — RLS и Auth URL Configuration |

Итого: 12 находок, 11 исправлены, 1 принята с оговоркой и документированным способом закрытия.

## Защита от распространённых атак (сводка)

| Атака | Как защищено |
|---|---|
| **XSS** | Только JSX-рендер, ни одного `dangerouslySetInnerHTML`/`innerHTML`/`eval` (проверено аудитом); meta-CSP как вторая линия (`script-src 'self'`); тег Метрики загружается с фиксированного домена, без inline-кода |
| **CSRF** | Токен сессии передаётся в заголовке `Authorization: Bearer` (не в cookie) — браузер не отправляет его автоматически; PostgREST не принимает form-encoded мутации |
| **SQL injection** | Нет ручной сборки SQL: PostgREST параметризует запросы; RPC принимает типизированный `uuid`; в plpgsql — только параметры |
| **Open redirect (OAuth)** | `redirectTo` — константа `origin + BASE_URL`, не читается из query/hash; allowlist Redirect URLs на стороне Supabase |
| **Broken access control** | RLS на всех таблицах, права уровня колонок, `security definer` только с фиксированным `search_path` и проверкой `auth.uid()`, служебные функции недоступны через RPC |
| **Утечка секретов** | `.env.local`/`.env.test.local` в gitignore; в git-истории ключей нет (проверено `git log -p`); в CI — только GitHub Secrets; service_role key нигде не используется |
| **Утечка деталей реализации** | Пользователю — общие тексты; оригинальные ошибки — в структурированный лог |

## Рекомендации по безопасности (следующие шаги)

1. **В Supabase Auth включить:** Confirm email (закрывает F-06), Captcha (hCaptcha/Turnstile — закрывает массовую регистрацию из F-02), Leaked password protection (HIBP), JWT expiry ≈ 1 час + refresh token rotation.
2. **Перенести служебные функции в схему `private`**, не публикуемую PostgREST, и принять правило «каждая новая функция в `public` начинается с `revoke execute … from public`».
3. **SQL-тесты политик RLS** (pgTAP или скрипт с двумя пользователями) в CI — сейчас изоляция проверяется скриптом `scripts/api-tests.sh` вручную.
4. **Мониторинг `client_logs`** (миграция 3): всплеск `auth.failed` с одного user-agent — сигнал brute force; см. промпты анализа логов в `integration_documentation.md`.
5. При переходе с GitHub Pages на хостинг с HTTP-заголовками — перенести CSP в заголовки и добавить `frame-ancestors 'none'` (в meta игнорируется — кликджекинг на Pages не закрыть).

## Приложение: полный отчёт AI-аудитора (без правок)

> Ниже — дословный вывод агента-аудитора, на основе которого составлена таблица выше. Нумерация находок совпадает.

### Находки

**[F-01] Функция `seed_demo_data(uid)` доступна для вызова через RPC любому клиенту** — A01 — высоко — `supabase/migrations/20260916000000_init.sql:153-177` — функция `security definer` в схеме `public`, `revoke execute` нет; EXECUTE по умолчанию у `PUBLIC`, PostgREST публикует функции как `POST /rest/v1/rpc/<name>`. Эксплуатация: любой залогиненный вызывает `seed_demo_data {"uid": …}` в цикле → квота Free-tier исчерпывается (DoS), данные засоряются; зная uuid другого пользователя (виден в `sign_attempts.user_id`), можно насыпать данные ему.

**[F-02] Триггер сидинга на `auth.users` + открытая регистрация без ограничений** — A04 — средне — каждая регистрация безусловно создаёт 12 строк; нет проверки «уже засеяно», нет CAPTCHA, в документации рекомендовано выключить подтверждение email; ошибка в `seed_demo_data` превращается в HTTP 500 на `/auth/v1/signup`.

**[F-03] Тестовые учётные данные с паролями в репозитории** — A07 — средне — `README.md:20`, `backend_documentation.md:136` — реальные аккаунты живой базы; после публикации репозитория кто угодно входит и портит журнал; пароли остаются в истории git.

**[F-04] Гонка (TOCTOU) в `sign_document`** — A04 — низко — `select … into d` без `for update`, `update` без условия по статусу — два параллельных вызова дают две «успешные» записи.

**[F-05] Необработанные сообщения сервера показываются пользователю** — A05 — низко — `supabaseProvider.ts:32, 51`, `AuthGate.tsx:135` — тексты PostgREST/GoTrue выводятся как есть, с именами таблиц и HINT.

**[F-06] Перечисление пользователей через форму регистрации** — A07 — низко — «Такой пользователь уже зарегистрирован» позволяет проверить наличие email.

**[F-07] Нет Content-Security-Policy и других защитных заголовков** — A05 — низко — `index.html` — XSS-векторов в коде нет, но CSP — вторая линия обороны для токенов в `localStorage`; на GitHub Pages meta-CSP — единственный механизм.

**[F-08] Роли `anon` оставлен SELECT на всех таблицах и OpenAPI-описание схемы** — A05 — низко — отозваны только insert/update/delete; анонимный `GET /rest/v1/` возвращает OpenAPI со всеми таблицами.

**[F-09] `sign_attempts` раскрывает `user_id` других членов организации** — A01 — информационно.

**[F-10] FK `sign_attempts.user_id → auth.users` без `on delete`** — A04 — информационно — удаление пользователя упадёт с нарушением FK.

**[F-11] Учётные данные в аргументах командной строки → история shell** — A02/A05 — низко — `README.md:22` рекомендует `PASS=… ./scripts/api-tests.sh`.

**[F-12] Неточное утверждение о CORS в документации** — A05 — информационно — у Supabase нет настройки ограничения origin для PostgREST.

**Проверено и не найдено:** `dangerouslySetInnerHTML`/`innerHTML`/`eval` отсутствуют; `redirectTo`/open redirect не используется; секретов в коде и истории git нет; `npm audit` — 0; `search_path` задан во всех `security definer`; подписание невозможно мимо RPC (подтверждено API-тестами).

### Что сделано хорошо

- Многослойная защита подписания: RLS + отзыв insert/update/delete + column-level `grant update (unread)` + `security definer` RPC с проверкой роли, статуса и журналированием отказов.
- `is_member()` в `security definer` с фиксированным `search_path` — решает рекурсию RLS без открытия `org_members`.
- Фронтенд без опасных примитивов; `?fail=1` работает только в мок-режиме.
- Секреты не в репозитории; `.env.example` предупреждает про service_role; в git-истории ключей нет.
- Скрипты берут учётные данные из окружения; токен в выводе обрезан.
- Зависимости актуальны; TypeScript strict, `any` запрещён.

### Рекомендации по усилению

1. Перед Google OAuth: Site URL = адрес GitHub Pages и точный allowlist Redirect URLs; `redirectTo` — константой; PKCE (по умолчанию в supabase-js v2).
2. Включить Confirm email, Captcha, Leaked password protection, минимальную длину пароля ≥ 8.
3. Служебные функции — в схему `private`.
4. SQL-тесты политик (pgTAP) в CI.
5. JWT expiry ≈ 1 час + refresh token rotation.
