---
version: alpha
name: ДокПоток · Broadsheet
description: >-
  Дизайн-система приложения «ДокПоток». Взята готовая система Broadsheet
  (designmd.ai/chef/broadsheet, MIT) — газетный, плоский, острый стиль —
  и адаптирована под русскоязычное плотное рабочее приложение.
colors:
  primary: '#0A0A0A'
  secondary: '#DC2626'
  tertiary: '#4B5563'
  surface: '#FFFFFF'
  surface-muted: '#F9FAFB'
  surface-subtle: '#F3F4F6'
  outline: '#E5E7EB'
  outline-input: '#D1D5DB'
  on-primary: '#FFFFFF'
  success: '#16A34A'
  success-container: '#DCFCE7'
  on-success-container: '#166534'
  warning: '#D97706'
  warning-container: '#FEF3C7'
  on-warning-container: '#92400E'
  error: '#DC2626'
  error-container: '#FEE2E2'
  on-error-container: '#991B1B'
typography:
  h1:
    fontFamily: PT Serif
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  h2:
    fontFamily: PT Serif
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
  h3:
    fontFamily: PT Serif
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.25
  figure:
    fontFamily: PT Serif
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: Source Serif 4
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: Source Serif 4
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Source Serif 4
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.05em
  mono:
    fontFamily: IBM Plex Mono
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: 0px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.none}'
    padding: 8px 20px
    height: 40px
  button-primary-hover:
    backgroundColor: '#1F2937'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    rounded: '{rounded.none}'
    padding: 8px 20px
    height: 40px
  button-secondary-hover:
    backgroundColor: '{colors.surface-subtle}'
  button-destructive:
    backgroundColor: '{colors.error}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.none}'
    padding: 8px 20px
  card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.none}'
    padding: '{spacing.md}'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.primary}'
    rounded: '{rounded.none}'
    padding: 10px 12px
    height: 40px
  chip-status-success:
    backgroundColor: '{colors.success-container}'
    textColor: '{colors.on-success-container}'
    rounded: '{rounded.none}'
    padding: 4px 12px
  chip-status-warning:
    backgroundColor: '{colors.warning-container}'
    textColor: '{colors.on-warning-container}'
    rounded: '{rounded.none}'
    padding: 4px 12px
  chip-status-error:
    backgroundColor: '{colors.error-container}'
    textColor: '{colors.on-error-container}'
    rounded: '{rounded.none}'
    padding: 4px 12px
  chip-filter-active:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.none}'
    padding: 4px 12px
  list-row:
    backgroundColor: '{colors.surface}'
    padding: 0 16px
    height: 44px
  list-row-hover:
    backgroundColor: '{colors.surface-muted}'
  toast:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.none}'
    padding: 12px 16px
---

## Overview

Основа — готовая дизайн-система **Broadsheet** (автор chef, галерея designmd.ai, лицензия MIT): интерфейс, вдохновлённый печатной газетой. Иерархия строится линейками, весом шрифта и воздухом, а не тенями и скруглениями. Палитра намеренно скупая: чёрный, серый, белый и единственный акцент — красный для срочного и необратимого.

Для «ДокПотока» это уместная метафора: входящие документы, журнал подписаний, реестр организаций — всё это «бумажные» сущности, и ленту удобнее читать как газетную полосу или бухгалтерскую ведомость, чем как набор цветных плиток.

Адаптации по сравнению с исходным Broadsheet (все осознанные и перечислены здесь, чтобы не считать их отступлениями):

- **Шрифты.** Libre Baskerville и Source Serif Pro не содержат кириллицы. Заменены на пары с полной кириллицей: заголовки — **PT Serif**, текст — **Source Serif 4**, цифры и коды — **IBM Plex Mono**. Шрифты self-hosted (`@fontsource`), внешних CDN нет — CSP остаётся `font-src 'self'`.
- **Плотность.** Broadsheet рассчитан на чтение статей (тело 18px). Для рабочего списка документов тело 15px, мелкий текст 13px, метки 12px; высота строки списка 44px сохранена.
- **Состояния.** Добавлены токены контейнеров для статусов (success/warning/error) — в исходнике они заданы только в прозе компонентов «Chips».

## Colors

- **Primary (#0A0A0A):** заголовки, основной текст, основные кнопки, активные элементы навигации, сильные линейки.
- **Secondary (#DC2626):** только срочное и необратимое — счётчик «требуют подписи», отказы, удаление. Никакой другой яркий цвет в интерфейсе не используется.
- **Tertiary (#4B5563):** вторичная информация: даты, организации, подписи к полям, пояснения.
- **Surface (#FFFFFF):** фон страницы и карточек. **Surface-muted (#F9FAFB)** — hover строк и фон формы входа. **Surface-subtle (#F3F4F6)** — hover вторичных кнопок, нейтральные метки.
- **Outline (#E5E7EB):** тонкие разделители. **Outline-input (#D1D5DB):** рамки полей ввода.
- **Success / Warning / Error:** семантика статусов документа: «Подписан» (success), «Требуется подпись» (warning), «Отказ» (error). Каждый статус всегда сопровождается текстом — цвет не единственный носитель смысла.

## Typography

- **Заголовки (PT Serif, bold):** h1 32px / h2 24px / h3 20px. Заголовок страницы — один, крупный, с 2px чёрной линейкой под блоком заголовка.
- **Цифры-факты (PT Serif, 40px bold):** сводка на экране «Входящие» — три числа в ряд, разделённые вертикальными линейками, как таблица курсов в газете.
- **Текст (Source Serif 4):** body 15px/1.5, small 13px. Названия документов — 600, контрагент — 400.
- **Метки (Source Serif 4, 12px, 600, uppercase, tracking 0.05em):** категории (УПД / Акт / Счёт / Договор), заголовки колонок таблиц, подписи полей, навигация на мобильных.
- **Моноширинный (IBM Plex Mono, 14px):** суммы, номера документов, даты в таблицах — чтобы колонки цифр выравнивались.

## Layout

- Базовая сетка — 8px: xs 4 / sm 8 / md 16 / lg 24 / xl 32 / 2xl 48 / 3xl 64.
- **Десктоп (≥1024px):** сайдбар 240px слева с правой линейкой 1px; контент до 1152px; экран «Входящие» — лента и карточка документа в колонках `1fr / 380px` с вертикальной линейкой между ними.
- **Мобильные:** шапка с нижней 2px линейкой, навигация — нижняя панель с верхней линейкой; карточка документа выезжает снизу поверх списка.
- Разделы страницы разделяются горизонтальными линейками (1px серыми между строками, 2px чёрными между смысловыми блоками), а не отступами-карточками.
- Текст всегда выровнен по левому краю, цифры в таблицах — по правому.

## Elevation & Depth

Теней нет. Глубина передаётся только линейками и фоном:

- строка списка: разделитель 1px outline, hover — фон surface-muted, выбранная — левая линейка 3px primary и жирный текст;
- карточка документа и диалоги: верхняя линейка 2px primary («Elevated» в Broadsheet);
- подложка под диалогом — чёрный с прозрачностью 40%; у самого диалога тени нет.

## Shapes

Радиус скругления везде **0px** — у кнопок, полей, меток, аватаров, точек-индикаторов. В Tailwind-слое радиусы отключены на уровне темы (`--radius-*: initial`), поэтому скруглённый элемент не может появиться случайно.

## Components

### Buttons
- **Primary:** фон primary, текст белый, без рамки; hover #1F2937. Высота 40px, отступы 8px 20px, текст 14px/600.
- **Secondary:** прозрачный фон, текст primary, рамка 2px primary; hover surface-subtle.
- **Ghost:** без фона и рамки, текст primary (или error для «Удалить»); hover surface-subtle; используется для второстепенных действий внутри строк и карточек.
- **Destructive:** фон error, текст белый; только в диалогах подтверждения удаления.
- **Disabled:** прозрачность 0.4, без hover.

### Cards
- **Default:** фон surface, рамка 1px outline, без тени; hover — рамка primary (для кликабельных).
- **Elevated:** верхняя линейка 2px primary вместо рамки по периметру; карточка документа, диалоги, блоки форм.
- Внутренний отступ 16px (24px у диалогов).

### Inputs
- Рамка 1px outline-input, фон surface, высота 40px, отступы 10px 12px, текст body.
- Hover — рамка #9CA3AF; focus — рамка 2px primary (через `box-shadow` внутрь, чтобы поле не прыгало); error — рамка error и фон #FEF2F2.
- Подпись поля — метка 12px uppercase над полем, отступ 4px; подсказка/ошибка — 12px tertiary или error под полем.

### Chips
- **Filter:** uppercase 12px; активный — фон primary, текст белый; неактивный — прозрачный с рамкой 1px outline-input; число документов в чипе — tertiary.
- **Status:** uppercase 11px, tracking 0.5px, отступы 4px 12px: success-container / warning-container / error-container; нейтральный («Не требует подписи») — surface-subtle с текстом tertiary.

### Lists
- Строка 44px (на карточках документа выше — две строки текста), разделитель 1px outline; hover surface-muted; выбранная — жирный текст и левая линейка 3px primary.
- Непрочитанный документ — чёрный квадрат 6px перед названием и вес 700.
- Таблицы: заголовок колонок — метка uppercase 12px с нижней линейкой 2px primary; строки — 1px outline.

### Dialogs
- Ширина до 448px, верхняя линейка 2px primary, отступ 24px, заголовок h3, подложка чёрная 40%.
- Диалог подписания: таблица «документ / контрагент / сумма / подписант» со строками-линейками и предупреждение в warning-container. Кнопки «Отмена» (secondary) и «Подтвердить» (primary) одинаковой ширины.

### Toasts
Фон primary, текст белый 14px, без скругления, левая линейка 3px success (успех) или error (ошибка); внизу экрана по центру.

## Do's and Don'ts

1. **Do** разделяйте блоки линейками (1px серыми, 2px чёрными), как колонки газеты.
2. **Do** используйте серифы с нормальной высотой строки; суммы и номера — моноширинным.
3. **Do** оставляйте красный только для срочного: счётчик «требуют подписи», отказы, удаление.
4. **Don't** не скругляйте углы — ни у кнопок, ни у меток, ни у аватаров.
5. **Don't** не добавляйте тени, свечения, градиенты и «стеклянные» эффекты.
6. **Do** подписи категорий и колонок — 12px uppercase с трекингом.
7. **Don't** не вводите новых ярких цветов: зелёный/жёлтый/красный — только как фон статусов.
8. **Do** держите вертикальный ритм 8px.
9. **Don't** не центрируйте текст абзацев; центр — только для цифр-фактов и пустых состояний.
10. **Do** всё вторичное (даты, организации, пояснения) — цветом tertiary, а не уменьшением до нечитаемого.
11. **Don't** не ставьте иконки в цветные квадраты и не используйте иллюстрации-«заглушки»: пустое состояние — это заголовок, одна фраза и действие.
12. **Do** анимации — только сдержанные: появление строк при прокрутке 300 мс, полоса прогресса чтения; при `prefers-reduced-motion` всё отключается.
