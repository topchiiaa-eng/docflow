// Проверка отправки событий в Яндекс.Метрику (ДЗ-6, Шаг 4): ловим сетевые запросы к mc.yandex.ru.
// Запуск: set -a; source .env.test.local; set +a; BASE_URL=… node scripts/e2e-analytics.mjs
import puppeteer from 'puppeteer-core'
const BASE = process.env.BASE_URL ?? 'http://localhost:5173/'
const { EMAIL, PASS } = process.env
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const p = await b.newPage()
  await p.setViewport({ width: 1280, height: 800 })
  const hits = []
  p.on('request', (r) => {
    if (r.url().includes('mc.yandex')) hits.push(r.url())
  })
  const cspErrors = []
  p.on('console', (m) => {
    if (/Content Security Policy/.test(m.text())) cspErrors.push(m.text().slice(0, 160))
  })
  await p.goto(BASE, { waitUntil: 'networkidle0' })
  await p.type('#email', EMAIL)
  await p.type('#password', PASS)
  await p.click('button[type=submit]')
  await p.waitForSelector('text/ГетБлоггер', { timeout: 15000 })
  await (await p.$('text/ГетБлоггер')).click()
  await new Promise((r) => setTimeout(r, 2500))
  const tag = hits.find((u) => u.includes('tag.js'))
  const goals = hits
    .filter((u) => /goal:/.test(decodeURIComponent(u)))
    .map((u) => decodeURIComponent(u).match(/goal:\/\/[^/]*\/([a-z_]+)/)?.[1])
  console.log('тег Метрики загружен:', tag ? 'да' : 'нет')
  console.log('запросов к mc.yandex.ru:', hits.length)
  console.log('события-цели (reachGoal):', goals.filter(Boolean).join(', ') || 'нет')
  console.log('ошибки CSP:', cspErrors.length ? cspErrors : 'нет')
} finally {
  await b.close()
}
