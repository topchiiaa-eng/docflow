# ДокПоток — фронтенд (демо-режим)

Реализация интерфейса веб-приложения **«ДокПоток»** — единой входящей ЭДО-документов для группы юрлиц — по ТЗ v1.3 из ДЗ-3 (репозиторий ai-ui-homework) (UI-концепция «Дашборд» в светлой теме). Данные: **Supabase** (PostgreSQL + Auth + RLS, см. [backend_documentation.md](backend_documentation.md)) или демо-режим на мок-адаптере (ТЗ, F-7), если бэкенд не настроен.

Разработано в паре с AI-агентом **Claude Code** по правилам проекта [CLAUDE.md](CLAUDE.md); процесс — в [development_report.md](development_report.md).

## Стек

Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · Vitest + Testing Library

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173 — демо-режим на мок-данных
```

**С реальным бэкендом (ДЗ-5):** создайте проект Supabase, примените в SQL Editor по порядку обе миграции из `supabase/migrations/`, затем `cp .env.example .env.local`, впишите URL и publishable (anon) key проекта и перезапустите dev-сервер. Появится экран входа; **регистрация любого нового пользователя автоматически выдаёт демо-набор** (3 организации, 6 документов; в «Компании В» — роль без права подписи для проверки политики). Подробно: [backend_documentation.md](backend_documentation.md).

Проверка API без фронтенда: `SUPA=… ANON=… EMAIL=… PASS=… ./scripts/api-tests.sh` (10 запросов, включая негативные; пример вывода — [docs/api-tests-output.md](docs/api-tests-output.md)).

Прочее: `npm test` — тесты (12), `npm run build` — production-сборка, `node scripts/screenshots.mjs` — скриншоты для отчёта (нужен запущенный dev-сервер и установленный Chrome).

**Демо-режимы:** `http://localhost:5173/?fail=1` — отказ провайдера (error-state с «Повторить»); документ «ООО «Крипто-Тест»» — гарантированная ошибка подписания.

## Функции (по ТЗ)

1. **Единая лента** (US-2, US-5, US-6): документы трёх организаций, KPI-плитки, фильтры по организации и статусу, поиск по контрагенту/номеру, empty-state со сбросом фильтров.
2. **Карточка документа** (US-3): master-detail панель с атрибутами и PDF-плейсхолдером; открытие помечает документ прочитанным.
3. **Подписание с явным подтверждением** (US-4): кнопка → диалог с деталями и подписантом → только «Подтвердить» вызывает `provider.sign()`; ошибка провайдера показывается, статус не меняется.

Все экраны обрабатывают 4 состояния: loading / error / empty / success.

## Адаптивность

- ≥1024px — двухколоночный master-detail (лента + панель);
- <1024px — панель документа открывается поверх списка (оверлей с закрытием);
- KPI и фильтры перестраиваются на узких экранах.

Скриншоты: [docs/screenshots](docs/screenshots) — демо-режим (desktop / mobile / loading / error) и живой бэкенд (live-login / live-desktop / live-mobile).

## Структура

```
src/
├── api/index.ts          # выбор провайдера: Supabase (если задан .env.local) или мок
├── api/supabaseProvider.ts # EdoProvider поверх PostgREST + RPC (+ тесты)
├── api/mockProvider.ts   # мок-адаптер EdoProvider (задержка, спецслучаи ошибок)
├── mocks/fixtures.ts     # демо-данные
├── lib/documents.ts      # чистая логика: фильтры, KPI, форматирование (+ юниты)
├── components/           # KpiTiles, FiltersBar, DocumentList, DetailPanel,
│                         # SignDialog, StatusBadge, StateViews, AuthGate (вход/регистрация)
├── App.tsx               # состояние экрана, master-detail, поток подписания
└── App.test.tsx          # компонентные тесты сценариев (6)
```

## Тесты

16 тестов: юниты чистой логики, тесты Supabase-провайдера на фейковом клиенте (маппинг, ok/ok:false/транспортная ошибка) (фильтры-комбинации, пустой результат, форматирование сумм, KPI) + компонентные сценарии (загрузка ленты, error-state с «Повторить», поиск и сброс фильтров, подписание через диалог, отмена, ошибка подписания). Позитивные и негативные ветки у каждой ключевой функции.

```bash
npm test   # Tests 16 passed (16)
```
