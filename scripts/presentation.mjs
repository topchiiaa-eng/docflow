// Презентация защиты проекта «ДокПоток» (17 слайдов, 16:9). Оформление — по DESIGN.md проекта.
// Запуск: node scripts/presentation.mjs → docs/presentation.pptx
import pptxgen from 'pptxgenjs'

// Палитра и шрифт — из DESIGN.md проекта (система Broadsheet): чёрный, серый, белый, один красный акцент.
// Georgia — серифная альтернатива PT Serif, установленная на любой macOS/Windows (не требует встраивания шрифта).
const C = {
  ink: '0A0A0A',
  emerald: '0A0A0A', // акцент = primary (имя сохранено для обратной совместимости слайдов)
  mint: 'F3F4F6',
  orange: 'DC2626', // «требуется подпись», срочное
  slate: '4B5563',
  light: 'F9FAFB',
  white: 'FFFFFF',
  line: 'E5E7EB',
}
const FONT = 'Georgia'
const W = 13.33
const SHOT = (f) => `docs/screenshots/${f}`

const pres = new pptxgen()
const TOTAL = 17
let slideNo = 0
const newSlide = () => {
  slideNo++
  return pres.addSlide()
}
pres.layout = 'LAYOUT_WIDE'
pres.title = 'ДокПоток — защита проекта'

const title = (slide, text, opts = {}) => {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.6,
    y: 1.3,
    w: W - 1.2,
    h: 0.03,
    fill: { color: opts.color ?? C.ink },
    line: { color: opts.color ?? C.ink },
  })
  return slide.addText(text, {
    x: 0.6,
    y: 0.4,
    w: W - 1.2,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: opts.color ?? C.ink,
    isTextBox: true,
    margin: 0,
    ...opts,
  })
}
const body = (slide, items, o) =>
  slide.addText(
    items.map((t, i) => ({
      text: t,
      options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8 },
    })),
    { fontFace: FONT, fontSize: 15, color: C.ink, isTextBox: true, valign: 'top', margin: 0, ...o },
  )
const card = (slide, x, y, w, h, head, text, accent = C.emerald) => {
  slide.addShape(pres.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: C.white },
    line: { color: C.line, width: 1 },
  })
  slide.addShape(pres.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.04,
    fill: { color: accent },
    line: { color: accent },
  })
  slide.addText(head, {
    x: x + 0.25,
    y: y + 0.2,
    w: w - 1.0,
    h: 0.5,
    fontFace: FONT,
    fontSize: 15,
    bold: true,
    color: C.ink,
    isTextBox: true,
    margin: 0,
    valign: 'middle',
  })
  slide.addText(text, {
    x: x + 0.25,
    y: y + 0.8,
    w: w - 0.5,
    h: h - 1.0,
    fontFace: FONT,
    fontSize: 12.5,
    color: C.slate,
    isTextBox: true,
    margin: 0,
    valign: 'top',
  })
}
const foot = (slide) =>
  slide.addText(`ДокПоток · защита проекта · ${slideNo}/${TOTAL}`, {
    x: 0.6,
    y: 7.0,
    w: 6,
    h: 0.3,
    fontFace: FONT,
    fontSize: 10,
    color: '9CA3AF',
    isTextBox: true,
    margin: 0,
  })

// 1. Титул
{
  const s = newSlide()
  s.background = { color: C.ink }
  s.addText(
    [
      { text: 'Док', options: { color: C.white } },
      { text: 'Поток', options: { color: 'E5E7EB' } },
    ],
    { x: 0.8, y: 1.6, w: 8, h: 1.2, fontFace: FONT, fontSize: 60, bold: true, isTextBox: true, margin: 0 },
  )
  s.addText('Единая входящая ЭДО для группы компаний', {
    x: 0.8,
    y: 2.8,
    w: 9,
    h: 0.7,
    fontFace: FONT,
    fontSize: 26,
    color: 'D1D5DB',
    isTextBox: true,
    margin: 0,
  })
  s.addText('Проектная работа курса «Разработка с AI-агентами»\nАнастасия Топчий · октябрь 2026', {
    x: 0.8,
    y: 4.3,
    w: 9,
    h: 1.0,
    fontFace: FONT,
    fontSize: 16,
    color: '9CA3AF',
    isTextBox: true,
    margin: 0,
  })
  s.addText('topchiiaa-eng.github.io/docflow · github.com/topchiiaa-eng/docflow', {
    x: 0.8,
    y: 6.4,
    w: 11,
    h: 0.4,
    fontFace: FONT,
    fontSize: 13,
    color: 'E5E7EB',
    isTextBox: true,
    margin: 0,
  })
  s.addImage({ path: SHOT('live-mobile.png'), x: 10.3, y: 0.9, w: 2.4, h: 5.2 })
  s.addNotes(
    'Здравствуйте. Проект — веб-приложение для операционных менеджеров групп компаний, которое собирает входящие ЭДО-документы нескольких юрлиц в одну ленту. Идея из моей практики: три юрлица в Диадоке.',
  )
}

// 2. Проблема
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'Проблема: один менеджер — N ящиков ЭДО')
  s.addText('20–30', {
    x: 0.6,
    y: 1.6,
    w: 4,
    h: 1.4,
    fontFace: FONT,
    fontSize: 72,
    bold: true,
    color: C.emerald,
    isTextBox: true,
    margin: 0,
  })
  s.addText(
    'минут в день уходит на обход ящиков трёх юрлиц в Контур.Диадоке (замер на собственной практике)',
    {
      x: 0.6,
      y: 3.0,
      w: 4.2,
      h: 1.2,
      fontFace: FONT,
      fontSize: 14,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    },
  )
  s.addText('дни', {
    x: 0.6,
    y: 4.3,
    w: 4,
    h: 1.0,
    fontFace: FONT,
    fontSize: 56,
    bold: true,
    color: C.orange,
    isTextBox: true,
    margin: 0,
  })
  s.addText('задержка, с которой замечают документ «требуется подпись» — и срыв сроков документооборота', {
    x: 0.6,
    y: 5.3,
    w: 4.2,
    h: 1.0,
    fontFace: FONT,
    fontSize: 14,
    color: C.slate,
    isTextBox: true,
    margin: 0,
  })
  card(
    s,
    5.4,
    1.6,
    3.5,
    2.2,
    'Кто страдает',
    'Операционные менеджеры и бухгалтеры малых групп компаний (2–10 юрлиц): один человек ведёт документооборот нескольких ООО',
  )
  card(
    s,
    9.2,
    1.6,
    3.5,
    2.2,
    'Почему так',
    'Интерфейсы ЭДО рассчитаны на «одна организация — один ящик»; несколько юрлиц = переключение контекста',
    C.orange,
  )
  card(
    s,
    5.4,
    4.1,
    3.5,
    2.2,
    'Что было до проекта',
    'Telegram-бот (ДЗ-2): уведомления есть, рабочего места нет — ни фильтров, ни истории, ни очереди на подпись',
  )
  card(
    s,
    9.2,
    4.1,
    3.5,
    2.2,
    'Цель',
    'Один экран на все организации: лента, очередь «на подпись» с явным подтверждением, журнал, роли',
    C.ink,
  )
  foot(s)
  s.addNotes(
    'Боль измерена на себе: три юрлица, каждое утро — обход трёх ящиков. Документы «требуется подпись» терялись между ящиками.',
  )
}

// 3. Конкуренты
{
  const s = newSlide()
  s.background = { color: C.light }
  title(s, 'Конкуренты: «несколько юрлиц» = переключатель, а не лента')
  const rows = [
    [
      { text: 'Продукт', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Несколько организаций', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Роли и подписание', options: { bold: true, color: C.white, fill: { color: C.ink } } },
    ],
    [
      'Контур.Диадок',
      'Одна учётка → список организаций → переключение контекста. Единой ленты нет',
      'Админ / редактор / читатель; маршруты согласования и «доп. подпись» — платные модули (10–230 тыс. ₽/год)',
    ],
    [
      'СБИС / Saby',
      'Несколько компаний в аккаунте, тариф — на каждую; при отправке выбирается организация',
      'Простое согласование в тарифе, маршруты — отдельная лицензия',
    ],
    [
      '1С-ЭДО (многофирменный учёт)',
      '«Текущие дела ЭДО» — общий список по базе 1С; нужна 1С у каждого пользователя',
      'Маршруты подписания несколькими сертификатами',
    ],
    [
      'DocuSign / PandaDoc',
      'Switch Account / Workspaces (Enterprise) — изоляция, без общей входящей',
      'Роли по аккаунту / workspace',
    ],
    [
      'Dext / Hubdoc (бухфирмы)',
      'Ближайший паттерн: панель фирмы, очередь документов по каждому клиенту',
      'Без юридически значимой подписи',
    ],
  ]
  s.addTable(rows, {
    x: 0.6,
    y: 1.45,
    w: W - 1.2,
    colW: [2.6, 5.2, 4.33],
    fontFace: FONT,
    fontSize: 11.5,
    color: C.ink,
    border: { type: 'solid', color: C.line, pt: 0.75 },
    fill: { color: C.white },
    rowH: 0.62,
    valign: 'middle',
    margin: 0.08,
  })
  s.addText(
    'Ниша: единая кросс-организационная лента + очередь «на подпись» по ролям + журнал. Главный риск — зависимость от API одного провайдера → абстракция EdoProvider в архитектуре. Анализ выполнен AI-агентом с веб-поиском (docs/competitors.md).',
    {
      x: 0.6,
      y: 5.75,
      w: W - 1.2,
      h: 1.0,
      fontFace: FONT,
      fontSize: 13,
      color: C.slate,
      isTextBox: true,
      margin: 0,
      italic: true,
    },
  )
  foot(s)
  s.addNotes(
    'Анализ сделал субагент с веб-поиском. Главный вывод: у провайдеров мультиорганизационность — это переключатель, единой ленты нет. Ниша подтверждена.',
  )
}

// 4. Решение и экраны
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'Решение: четыре экрана + вход')
  s.addImage({ path: SHOT('live-desktop.png'), x: 0.6, y: 1.45, w: 7.4, h: 4.16 })
  const items = [
    ['Входящие', 'Лента всех организаций, KPI, фильтры, поиск, карточка документа, добавление с PDF'],
    ['На подпись', 'Очередь «требуется подпись» → диалог подтверждения → подписание по роли'],
    ['Журнал', 'Append-only журнал: успехи и отказы с причиной'],
    ['Организации', 'Создание, переименование, удаление; участники по email, роли'],
  ]
  items.forEach(([h, t], i) => {
    const y = 1.45 + i * 1.17
    s.addShape(pres.ShapeType.rect, {
      x: 8.4,
      y: y + 0.05,
      w: 0.5,
      h: 0.5,
      fill: { color: i === 1 ? C.orange : C.emerald },
      line: { color: C.white },
    })
    s.addText(String(i + 1), {
      x: 8.4,
      y: y + 0.05,
      w: 0.5,
      h: 0.5,
      fontFace: FONT,
      fontSize: 14,
      bold: true,
      color: C.white,
      align: 'center',
      valign: 'middle',
      isTextBox: true,
      margin: 0,
    })
    s.addText(h, {
      x: 9.05,
      y,
      w: 3.7,
      h: 0.4,
      fontFace: FONT,
      fontSize: 16,
      bold: true,
      color: C.ink,
      isTextBox: true,
      margin: 0,
    })
    s.addText(t, {
      x: 9.05,
      y: y + 0.4,
      w: 3.7,
      h: 0.7,
      fontFace: FONT,
      fontSize: 12,
      color: C.slate,
      isTextBox: true,
      margin: 0,
      valign: 'top',
    })
  })
  s.addText(
    'Адаптивно: ≥1024px — master-detail, на мобильных карточка открывается поверх списка. Каждый экран: loading / error / empty / success.',
    {
      x: 0.6,
      y: 6.25,
      w: 7.4,
      h: 0.6,
      fontFace: FONT,
      fontSize: 11.5,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    },
  )
  foot(s)
  s.addNotes('Живой скриншот production. Четыре экрана с роутингом, вход по паролю или через Google.')
}

// 5. Демо: организации и журнал
{
  const s = newSlide()
  s.background = { color: C.light }
  title(s, 'Организации и журнал подписаний')
  s.addImage({ path: SHOT('live-organizations.png'), x: 0.6, y: 1.45, w: 6.0, h: 3.375 })
  s.addImage({ path: SHOT('live-journal.png'), x: 6.75, y: 1.45, w: 6.0, h: 3.375 })
  s.addText(
    'CRUD организаций; участники добавляются по email через RPC (auth.users клиенту недоступна); роль «оператор» без права подписи — для живой проверки политик',
    {
      x: 0.6,
      y: 5.0,
      w: 6.0,
      h: 0.9,
      fontFace: FONT,
      fontSize: 12,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    },
  )
  s.addText(
    'Журнал пишется только сервером (RPC), клиент не может его менять; отказы фиксируются с причиной — «роль без права подписи», «документ не требует подписи»',
    {
      x: 6.75,
      y: 5.0,
      w: 6.0,
      h: 0.9,
      fontFace: FONT,
      fontSize: 12,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    },
  )
  foot(s)
}

// 5a. Интерфейс по DESIGN.md
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'Интерфейс по DESIGN.md: до и после')
  s.addText('ДО — итерация 1', {
    x: 0.6,
    y: 1.5,
    w: 5.9,
    h: 0.3,
    fontFace: FONT,
    fontSize: 11,
    bold: true,
    color: C.orange,
    isTextBox: true,
    margin: 0,
  })
  s.addImage({ path: SHOT('before-design-md.png'), x: 0.6, y: 1.85, w: 5.9, h: 3.32 })
  s.addText('ПОСЛЕ — DESIGN.md (Broadsheet)', {
    x: 6.85,
    y: 1.5,
    w: 5.9,
    h: 0.3,
    fontFace: FONT,
    fontSize: 11,
    bold: true,
    color: C.ink,
    isTextBox: true,
    margin: 0,
  })
  s.addImage({ path: SHOT('live-desktop.png'), x: 6.85, y: 1.85, w: 5.9, h: 3.32 })
  body(
    s,
    [
      'Маркеры нейрослопа убраны: дефолтная палитра Tailwind, скругления и тени на всём, иконки в цветных квадратах, иллюстрации-заглушки, чек-лист «преимуществ» на входе',
      'DESIGN.md (формат Google Labs): YAML-токены + правила; взята готовая система Broadsheet (designmd.ai) — серифы, линейки вместо теней, радиус 0, один красный акцент; шрифты заменены на кириллические',
      'Токены спроецированы на Tailwind: стандартная палитра, rounded-* и shadow-* отключены на уровне темы; файл валидируется в CI. Скролл-эффекты: появление строк, полоса прогресса, липкий заголовок (с prefers-reduced-motion)',
    ],
    { x: 0.6, y: 5.35, w: W - 1.2, h: 1.6, fontSize: 11.5 },
  )
  foot(s)
  s.addNotes(
    'По замечанию защиты интерфейс переведён на готовую дизайн-систему в формате DESIGN.md. Контракт тестов не менялся — 46 тестов проходят. Подробности и честный разбор маркеров — docs/ui_iteration.md.',
  )
}

// 6. Архитектура
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'Архитектура')
  const box = (x, y, w, h, head, lines, fill = C.white, color = C.ink) => {
    s.addShape(pres.ShapeType.rect, {
      x,
      y,
      w,
      h,
      fill: { color: fill },
      line: { color: fill === C.white ? C.line : fill, width: 1 },
    })
    s.addText(head, {
      x: x + 0.2,
      y: y + 0.12,
      w: w - 0.4,
      h: 0.4,
      fontFace: FONT,
      fontSize: 14,
      bold: true,
      color,
      isTextBox: true,
      margin: 0,
    })
    s.addText(
      lines.map((t, i) => ({
        text: t,
        options: { bullet: { indent: 10 }, breakLine: i < lines.length - 1 },
      })),
      {
        x: x + 0.2,
        y: y + 0.55,
        w: w - 0.4,
        h: h - 0.65,
        fontFace: FONT,
        fontSize: 11.5,
        color,
        isTextBox: true,
        margin: 0,
        valign: 'top',
      },
    )
  }
  box(
    0.6,
    1.5,
    3.6,
    3.2,
    'Frontend (GitHub Pages)',
    [
      'React 19 + TypeScript strict',
      'React Router (HashRouter)',
      'Tailwind v4',
      'EdoProvider — граница с бэкендом',
      'мок-провайдер для тестов и демо',
    ],
    C.mint,
  )
  box(
    4.9,
    1.5,
    3.6,
    3.2,
    'Supabase',
    [
      'Auth: email + Google OAuth (PKCE)',
      'PostgREST: CRUD поверх 5 таблиц',
      'RPC: sign_document, add_member…',
      'Storage: приватный bucket PDF',
      'RLS + права уровня колонок',
    ],
    C.ink,
    C.white,
  )
  box(9.2, 1.5, 3.6, 3.2, 'Эксплуатация', [
    'GitHub Actions: audit → lint → prettier → tsc → DESIGN.md lint → 46 тестов → build → deploy',
    'Uptime-workflow + health RPC',
    'JSON-логи → client_logs',
    'Яндекс.Метрика: 14 событий',
  ])
  for (const x of [4.2, 8.5])
    s.addShape(pres.ShapeType.rightArrow, {
      x,
      y: 2.85,
      w: 0.7,
      h: 0.5,
      fill: { color: C.emerald },
      line: { color: C.emerald },
    })
  s.addText(
    'Ключевое решение: интерфейс EdoProvider. Фронтенд не знает, откуда данные — бэкенд подключался без изменения компонентов; тот же интерфейс закрывает риск зависимости от одного ЭДО-провайдера.',
    {
      x: 0.6,
      y: 5.0,
      w: W - 1.2,
      h: 0.8,
      fontFace: FONT,
      fontSize: 13.5,
      color: C.ink,
      isTextBox: true,
      margin: 0,
    },
  )
  s.addText(
    'Нет прав администратора на машине → нет Docker/VPS → Supabase + GitHub Pages: ограничение стало фильтром решений.',
    {
      x: 0.6,
      y: 5.9,
      w: W - 1.2,
      h: 0.6,
      fontFace: FONT,
      fontSize: 12.5,
      color: C.slate,
      isTextBox: true,
      margin: 0,
      italic: true,
    },
  )
  foot(s)
}

// 6a. Архитектура: почему именно так
{
  const s = newSlide()
  s.background = { color: C.light }
  title(s, 'Архитектура: почему именно так')
  const rows = [
    [
      { text: 'Решение', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Альтернатива', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Почему', options: { bold: true, color: C.white, fill: { color: C.ink } } },
    ],
    [
      'Supabase вместо своего сервера',
      'Node/Express + Postgres в Docker на VPS',
      'Нет прав администратора → нет Docker; нет VPS. Auth, RLS, REST — без собственного сервера',
    ],
    [
      'Безопасность в БД, а не в middleware',
      'Проверки прав в API-слое',
      'Без своего сервера единственная граница доверия — PostgreSQL: RLS, права колонок, security definer RPC',
    ],
    [
      'Интерфейс EdoProvider',
      'Прямые вызовы supabase-js из компонентов',
      'Мок → тесты и CI без секретов; бэкенд подключён без правки компонентов; ответ на риск зависимости от одного провайдера',
    ],
    [
      'GitHub Pages + HashRouter',
      'Vercel/Netlify + BrowserRouter',
      'Без второго аккаунта и токенов (OIDC); цена — нет SPA-fallback → hash-роутинг, решение задокументировано в App.tsx',
    ],
    [
      'Чистая логика вне React (src/lib)',
      'Логика внутри компонентов',
      'Правило 3 CLAUDE.md: фильтры, валидация, разбор OAuth-ошибок тестируются юнитами без DOM',
    ],
  ]
  s.addTable(rows, {
    x: 0.6,
    y: 1.45,
    w: W - 1.2,
    colW: [3.0, 3.3, 5.83],
    rowH: 0.7,
    fontFace: FONT,
    fontSize: 11.5,
    color: C.ink,
    border: { type: 'solid', color: C.line, pt: 0.75 },
    fill: { color: C.white },
    valign: 'middle',
    margin: 0.08,
  })
  s.addText(
    'Метод из ДЗ-1: сначала отсечь по жёстким ограничениям, потом сравнивать. Решения принимал человек; агент предлагал варианты и аргументы. Подробно: docs/agentic_engineering.md §1',
    {
      x: 0.6,
      y: 6.0,
      w: W - 1.2,
      h: 0.7,
      fontFace: FONT,
      fontSize: 12.5,
      color: C.slate,
      isTextBox: true,
      margin: 0,
      italic: true,
    },
  )
  foot(s)
}

// 7. Данные и безопасность
{
  const s = newSlide()
  s.background = { color: C.light }
  title(s, 'Данные и безопасность')
  const t = [
    [
      { text: 'Таблица', options: { bold: true, color: C.white, fill: { color: C.emerald } } },
      { text: 'Назначение', options: { bold: true, color: C.white, fill: { color: C.emerald } } },
    ],
    ['organizations', 'юрлица; created_by — владелец'],
    ['org_members', 'роли: signer / operator / accountant (M:N с auth.users)'],
    ['documents', 'входящие; file_path → Storage; check-constraints'],
    ['sign_attempts', 'append-only журнал подписаний'],
    ['client_logs', 'warn/error с фронтенда'],
  ]
  s.addTable(t, {
    x: 0.6,
    y: 1.45,
    w: 5.6,
    colW: [1.7, 3.9],
    fontFace: FONT,
    fontSize: 11.5,
    color: C.ink,
    border: { type: 'solid', color: C.line, pt: 0.75 },
    fill: { color: C.white },
    rowH: 0.5,
    margin: 0.07,
    valign: 'middle',
  })
  card(
    s,
    6.6,
    1.45,
    3.0,
    2.3,
    'Подписание',
    'Только через RPC с проверкой роли и статуса; у клиента отозваны права менять status — путь «мимо» физически невозможен',
    C.orange,
  )
  card(
    s,
    9.8,
    1.45,
    3.0,
    2.3,
    'RLS везде',
    'Видимость только своих организаций; анонимам — 401; is_member() как security definer против рекурсии',
  )
  card(
    s,
    6.6,
    3.95,
    3.0,
    2.3,
    'Аудит OWASP (AI)',
    '12 находок, 11 исправлены: служебная функция была вызываема через RPC, TOCTOU в подписании, утечка сообщений сервера, CSP',
    C.ink,
  )
  card(
    s,
    9.8,
    3.95,
    3.0,
    2.3,
    'Секреты',
    'Ключи только в .env.local и GitHub Secrets; пароли тестовых учёток ротированы и убраны из репозитория',
  )
  s.addText(
    '6 миграций в supabase/migrations — проверены на живой базе API-тестами и e2e под свежим пользователем.',
    {
      x: 0.6,
      y: 4.6,
      w: 5.6,
      h: 0.8,
      fontFace: FONT,
      fontSize: 12,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    },
  )
  foot(s)
}

// 7a. Подписание только через явное подтверждение
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'Что значит «подписание только через явное подтверждение»')
  const layers = [
    [
      '1 · UI',
      'Кнопка «Утвердить и подписать» не подписывает — открывает диалог с документом, контрагентом, суммой и подписантом. provider.sign() вызывает только «Подтвердить».',
      'CLAUDE.md, правило 8; тест «Отмена не меняет статус»',
      C.emerald,
    ],
    [
      '2 · Данные',
      'Обход UI невозможен: у роли authenticated отозван UPDATE на колонку status (права уровня колонок). Прямой PATCH status → 403.',
      'миграция 1; API-тест №4',
      C.orange,
    ],
    [
      '3 · Бизнес-правило',
      'Единственный путь — RPC sign_document(): членство, роль signer, статус, блокировка строки, запись в append-only журнал (и отказов тоже).',
      'миграции 2, 3, 5; API-тесты №6–9',
      C.ink,
    ],
  ]
  layers.forEach(([h, t, ref, color], i) => {
    const y = 1.5 + i * 1.65
    s.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y,
      w: W - 1.2,
      h: 1.45,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
    })
    s.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y,
      w: 2.3,
      h: 1.45,
      fill: { color },
      line: { color },
    })
    s.addText(h, {
      x: 0.75,
      y,
      w: 2.0,
      h: 1.45,
      fontFace: FONT,
      fontSize: 16,
      bold: true,
      color: C.white,
      isTextBox: true,
      margin: 0,
      valign: 'middle',
    })
    s.addText(t, {
      x: 3.1,
      y: y + 0.15,
      w: 6.6,
      h: 1.2,
      fontFace: FONT,
      fontSize: 12.5,
      color: C.ink,
      isTextBox: true,
      margin: 0,
      valign: 'middle',
    })
    s.addText(ref, {
      x: 9.9,
      y: y + 0.15,
      w: 2.7,
      h: 1.2,
      fontFace: FONT,
      fontSize: 11,
      color: C.slate,
      isTextBox: true,
      margin: 0,
      valign: 'middle',
      italic: true,
    })
  })
  s.addText(
    'Происхождение: правило «никогда не подписывать автоматически» для AI-агента из ДЗ-2 (бот Диадока) перенесено с уровня инструкции на уровень архитектуры — подпись юридически значима.',
    {
      x: 0.6,
      y: 6.5,
      w: W - 1.2,
      h: 0.5,
      fontFace: FONT,
      fontSize: 12,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    },
  )
  foot(s)
}

// 8. AI на каждом этапе
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'AI-агент на каждом этапе')
  const rows = [
    [
      { text: 'Этап', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Как использован', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Что дало', options: { bold: true, color: C.white, fill: { color: C.ink } } },
    ],
    [
      'Планирование',
      'Идея, анализ конкурентов (субагент + веб-поиск), 3 UI-концепции text-to-UI, 12 user stories',
      'Подтверждённая ниша; концепция выбрана по главному сценарию',
    ],
    [
      'Архитектура',
      'Схема БД и RLS по ТЗ; ТЗ проверено независимым агентом-«техлидом»',
      '5 критичных пробелов в ТЗ найдены до первой строки кода',
    ],
    [
      'Frontend',
      'Инициализация, компоненты по RTCF-промптам, тесты',
      'Баг «бесконечный цикл» найден по скриншоту + консоли',
    ],
    [
      'Backend',
      'Миграции, RPC, Storage-политики; разбор ошибок PostgreSQL',
      '5 багов, не видимых локально, пойманы на живой базе',
    ],
    [
      'DevOps',
      'Генерация CI/CD и uptime-workflow, аудит OWASP независимым агентом',
      'Пайплайн дважды остановил деплой по делу',
    ],
    [
      'Оптимизация',
      'Рекомендации линтера/агента: чанки, хуки, отмена устаревших ответов',
      'Меньше лишних перерисовок; supabase-js кэшируется отдельно от кода',
    ],
  ]
  s.addTable(rows, {
    x: 0.6,
    y: 1.45,
    w: W - 1.2,
    colW: [1.9, 5.8, 4.43],
    fontFace: FONT,
    fontSize: 11.5,
    color: C.ink,
    border: { type: 'solid', color: C.line, pt: 0.75 },
    fill: { color: C.white },
    rowH: 0.62,
    valign: 'middle',
    margin: 0.08,
  })
  s.addText(
    'Правила проекта (CLAUDE.md) влияли на архитектуру, а не на форматирование: из «подписание только через диалог» вырос RPC с проверкой роли на уровне БД.',
    {
      x: 0.6,
      y: 6.0,
      w: W - 1.2,
      h: 0.7,
      fontFace: FONT,
      fontSize: 12.5,
      color: C.slate,
      isTextBox: true,
      margin: 0,
      italic: true,
    },
  )
  foot(s)
}

// 9. Качество и эксплуатация
{
  const s = newSlide()
  s.background = { color: C.light }
  title(s, 'Качество: CI/CD, тесты, мониторинг')
  s.addImage({ path: SHOT('ci-run.png'), x: 0.6, y: 1.45, w: 6.4, h: 4.0 })
  const stats = [
    ['43', 'тестов: юниты, компоненты, провайдер'],
    ['10', 'API-запросов к живой базе, 5 негативных'],
    ['6', 'e2e-сценариев puppeteer на production'],
    ['30 мин', 'интервал uptime-проверки + алерт'],
  ]
  stats.forEach(([n, t], i) => {
    const x = 7.4 + (i % 2) * 2.75,
      y = 1.45 + Math.floor(i / 2) * 1.95
    s.addShape(pres.ShapeType.rect, {
      x,
      y,
      w: 2.55,
      h: 1.75,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
    })
    s.addText(n, {
      x: x + 0.2,
      y: y + 0.15,
      w: 2.2,
      h: 0.8,
      fontFace: FONT,
      fontSize: 34,
      bold: true,
      color: C.emerald,
      isTextBox: true,
      margin: 0,
    })
    s.addText(t, {
      x: x + 0.2,
      y: y + 0.95,
      w: 2.2,
      h: 0.7,
      fontFace: FONT,
      fontSize: 11,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    })
  })
  s.addText(
    'Пайплайн: npm audit → oxlint (0 предупреждений) → prettier → tsc → vitest → build → GitHub Pages → smoke-check. Дважды остановил деплой по делу: не включённый Pages и правки файлов в обход форматтера.',
    {
      x: 0.6,
      y: 5.6,
      w: W - 1.2,
      h: 0.9,
      fontFace: FONT,
      fontSize: 12.5,
      color: C.ink,
      isTextBox: true,
      margin: 0,
    },
  )
  foot(s)
}

// 9a. CI/CD: принципы из курса
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'CI/CD: принципы из курса, а не дефолт агента')
  const rows = [
    [
      { text: 'Принцип', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Реализация', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Что показал на практике', options: { bold: true, color: C.white, fill: { color: C.ink } } },
    ],
    [
      'Fail-fast: дешёвое раньше дорогого',
      'audit → lint → prettier → tsc → test → build',
      'прогоны 4–5 упали на prettier за 20 с, не дойдя до сборки',
    ],
    [
      'Деплой зависит от качества',
      'needs: quality; только main, не PR',
      '«красное» не попало на сайт — job deploy пропущен',
    ],
    [
      'Секреты ≠ переменные; без PAT',
      'ключи — Secrets; URL/ID — Variables; деплой по OIDC',
      'публичное видно в логах, секретов нет; нечему утечь',
    ],
    [
      'Проверка после публикации',
      'curl живого URL + job verify: Chrome на runner → вход → лента из Supabase → журнал',
      'закрывает разрыв «деплой зелёный, приложение не работает» (кейсы 4–5)',
    ],
    [
      'Мониторинг как код',
      'uptime.yml по cron: health RPC + сайт; падение = письмо',
      'отработал в первом же запуске',
    ],
    [
      'Отмена устаревших, воспроизводимость',
      'concurrency + cancel-in-progress; npm ci + lock + кэш; npm run ci локально',
      'локальный и CI-прогоны совпадают',
    ],
  ]
  s.addTable(rows, {
    x: 0.6,
    y: 1.45,
    w: W - 1.2,
    colW: [3.1, 4.9, 4.13],
    rowH: 0.66,
    fontFace: FONT,
    fontSize: 11.5,
    color: C.ink,
    border: { type: 'solid', color: C.line, pt: 0.75 },
    fill: { color: C.white },
    valign: 'middle',
    margin: 0.08,
  })
  s.addText(
    'Сознательно нет: Docker-образов (нет сервера, который их запускал бы) и матрицы Node-версий (один runtime в production). Job verify добавлен по замечанию с защиты — см. docs/agentic_engineering.md §2.',
    {
      x: 0.6,
      y: 6.2,
      w: W - 1.2,
      h: 0.6,
      fontFace: FONT,
      fontSize: 12,
      color: C.slate,
      isTextBox: true,
      margin: 0,
      italic: true,
    },
  )
  foot(s)
}

// 10. Кейсы отладки
{
  const s = newSlide()
  s.background = { color: C.white }
  title(s, 'Пять багов, которые не видели зелёные тесты')
  const cases = [
    [
      'Бесконечный цикл загрузки',
      'Дефолт пропа создавал новый провайдер на каждый рендер. Найдено по скриншоту + консоли браузера; 12 тестов молчали — они передавали стабильный проп.',
    ],
    [
      'Кириллица испорчена, миграция «Success»',
      'pbcopy без UTF-8-локали. Найдено сравнением repr() строк из API. Урок: после миграции читать данные обратно.',
    ],
    [
      'Отказы не попадали в журнал',
      'raise exception в plpgsql откатывал insert. RPC теперь возвращает {ok, error}. Урок: проверять побочные эффекты негативных сценариев.',
    ],
    [
      'RLS отклоняла создание организации',
      'INSERT … RETURNING проверяется до AFTER-триггера членства. Нашёл только e2e на живой базе — мок и 43 теста не имеют RLS.',
    ],
    [
      'Новый пользователь — пустое приложение',
      'Триггер владельца (миграция 4) × «не ронять регистрацию» (аудит): ошибка сидинга проглатывалась. Поймал скрипт скриншотов под свежим пользователем.',
    ],
    [
      'Общий вывод',
      '«Зелёный прогон» ≠ «работает». Проверять данные и побочные эффекты другим инструментом — и сценарий «с нуля» после каждой миграции.',
    ],
  ]
  cases.forEach(([h, t], i) => {
    const x = 0.6 + (i % 2) * 6.2,
      y = 1.4 + Math.floor(i / 2) * 1.8
    card(s, x, y, 5.95, 1.65, h, t, i === 5 ? C.ink : i >= 3 ? C.orange : C.emerald)
  })
  foot(s)
}

// 11. Выводы
{
  const s = newSlide()
  s.background = { color: C.light }
  title(s, 'Что я поняла о разработке с AI')
  const points = [
    [
      'Агент сильнее всего, когда его проверяет другой агент',
      'Лучшие находки — независимое ревью ТЗ, независимый аудит безопасности, API-тесты против живой базы',
    ],
    [
      'Правила влияют на архитектуру',
      'CLAUDE.md «чистая логика без сети» → тестируемые модули; «подписание через диалог» → RPC на уровне БД',
    ],
    [
      'Жёсткие ограничения — лучший фильтр',
      'Нет sudo → Supabase, GitHub Pages, системный Chrome для e2e — каждое решение оказалось проще альтернатив',
    ],
    [
      'Абстракция над провайдером окупилась дважды',
      'Мок для тестов и CI без секретов + ответ на главный рыночный риск',
    ],
  ]
  points.forEach(([h, t], i) => {
    const y = 1.5 + i * 1.3
    s.addShape(pres.ShapeType.rect, {
      x: 0.6,
      y: y + 0.1,
      w: 0.55,
      h: 0.55,
      fill: { color: C.emerald },
      line: { color: C.emerald },
    })
    s.addText(String(i + 1), {
      x: 0.6,
      y: y + 0.1,
      w: 0.55,
      h: 0.55,
      fontFace: FONT,
      fontSize: 16,
      bold: true,
      color: C.white,
      align: 'center',
      valign: 'middle',
      isTextBox: true,
      margin: 0,
    })
    s.addText(h, {
      x: 1.4,
      y,
      w: 11.3,
      h: 0.45,
      fontFace: FONT,
      fontSize: 17,
      bold: true,
      color: C.ink,
      isTextBox: true,
      margin: 0,
    })
    s.addText(t, {
      x: 1.4,
      y: y + 0.45,
      w: 11.3,
      h: 0.7,
      fontFace: FONT,
      fontSize: 13,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    })
  })
  foot(s)
}

// 11a. Agentic engineering vs вайбкодинг
{
  const s = newSlide()
  s.background = { color: C.light }
  title(s, 'Agentic engineering ≠ вайбкодинг: где следы в репозитории')
  const rows = [
    [
      { text: 'Признак', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'Вайбкодинг', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'В проекте', options: { bold: true, color: C.white, fill: { color: C.ink } } },
      { text: 'След', options: { bold: true, color: C.white, fill: { color: C.ink } } },
    ],
    [
      'Правила до кода',
      'агент пишет «как получится»',
      '11 правил проекта; правило 7 → src/lib с юнитами, правило 8 → RPC в БД',
      'CLAUDE.md',
    ],
    [
      'Агент проверяет агента',
      'автор верит своему выводу',
      'ревью ТЗ «техлидом» (5 пробелов), аудит OWASP (12 находок), конкуренты',
      'security_audit.md, competitors.md',
    ],
    [
      'Верификация другим инструментом',
      '«запустил — вроде работает»',
      '46 тестов, 10 API-тестов к живой базе, 6 e2e на production, «свежий пользователь с нуля»',
      'scripts/, src/**/*.test.*',
    ],
    [
      'Баги ловит проверка, не удача',
      'замечает пользователь',
      '5 багов прошли зелёные тесты — пойманы только верификацией; каждый с причиной',
      'development_process.md, миграции 2, 5, 6',
    ],
    [
      'Журнал решений и история',
      'один коммит «final»',
      'шапка «почему» в каждой миграции; 25+ атомарных коммитов, Co-Authored-By',
      'supabase/migrations, git log',
    ],
    [
      'Границы человека и честность',
      '«AI сделал»',
      'человек: архитектура, провайдеры, миграции в прод, приёмка, решения по аудиту; названо, что не сделано',
      'agentic_engineering.md §4',
    ],
  ]
  s.addTable(rows, {
    x: 0.6,
    y: 1.45,
    w: W - 1.2,
    colW: [2.5, 2.4, 4.9, 2.33],
    rowH: 0.66,
    fontFace: FONT,
    fontSize: 11.5,
    color: C.ink,
    border: { type: 'solid', color: C.line, pt: 0.75 },
    fill: { color: C.white },
    valign: 'middle',
    margin: 0.08,
  })
  s.addText(
    'Главное отличие: цикл замкнут на проверке, которую делает не тот, кто генерировал — другой агент, другой инструмент, другой сценарий. Честно: первые версии ci.yml и компонентов — чистая генерация; инженерная ценность появилась после прогонов, линтера и ревью.',
    {
      x: 0.6,
      y: 6.15,
      w: W - 1.2,
      h: 0.75,
      fontFace: FONT,
      fontSize: 12,
      color: C.ink,
      isTextBox: true,
      margin: 0,
    },
  )
  foot(s)
}

// 12. Итоги
{
  const s = newSlide()
  s.background = { color: C.ink }
  s.addText('Итоги', {
    x: 0.8,
    y: 0.6,
    w: 8,
    h: 0.9,
    fontFace: FONT,
    fontSize: 36,
    bold: true,
    color: C.white,
    isTextBox: true,
    margin: 0,
  })
  body(
    s,
    [
      '4 экрана, адаптивная вёрстка, формы с валидацией, 4 состояния экрана',
      '5 связанных таблиц, полный CRUD, RLS, RPC, Storage, OAuth2, аналитика',
      'CI/CD → GitHub Pages, мониторинг, JSON-логи, аудит безопасности',
      'AI на всех этапах — задокументировано с промптами и результатами',
      '46 тестов, 10 API-тестов, 6 e2e-сценариев; 5 багов найдены только на живой базе и исправлены',
    ],
    { x: 0.8, y: 1.7, w: 7.8, h: 3.6, fontSize: 16, color: 'E5E7EB' },
  )
  s.addText(
    'Приложение: topchiiaa-eng.github.io/docflow\nКод и документация: github.com/topchiiaa-eng/docflow',
    {
      x: 0.8,
      y: 5.5,
      w: 8,
      h: 1.0,
      fontFace: FONT,
      fontSize: 15,
      color: 'E5E7EB',
      isTextBox: true,
      margin: 0,
    },
  )
  s.addText('Спасибо! Вопросы?', {
    x: 9.3,
    y: 5.6,
    w: 3.5,
    h: 0.8,
    fontFace: FONT,
    fontSize: 24,
    bold: true,
    color: C.white,
    isTextBox: true,
    margin: 0,
    align: 'right',
  })
  s.addImage({ path: SHOT('live-sign-dialog.png'), x: 9.0, y: 0.9, w: 3.8, h: 2.14 })
  s.addImage({ path: SHOT('live-sign-denied.png'), x: 9.0, y: 3.3, w: 3.8, h: 2.14 })
}

await pres.writeFile({ fileName: 'docs/presentation.pptx' })
console.log('ok: docs/presentation.pptx')
