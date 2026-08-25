// Скриншоты приложения для отчёта: desktop / mobile / error-state.
// Запуск: node scripts/screenshots.mjs (dev-сервер должен работать на :5173)
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT = 'docs/screenshots'

const shots = [
  { name: 'desktop', url: BASE, w: 1280, h: 800, waitFor: 'text/ГетБлоггер' },
  { name: 'mobile', url: BASE, w: 375, h: 812, waitFor: 'text/ГетБлоггер', mobile: true },
  { name: 'error-state', url: `${BASE}/?fail=1`, w: 1280, h: 800, waitFor: 'text/Повторить' },
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
try {
  for (const s of shots) {
    const page = await browser.newPage()
    await page.setViewport({ width: s.w, height: s.h, isMobile: !!s.mobile, hasTouch: !!s.mobile })
    await page.goto(s.url, { waitUntil: 'networkidle0' })
    await page.waitForSelector(s.waitFor, { timeout: 10_000 })
    await page.screenshot({ path: `${OUT}/${s.name}.png` })
    console.log(`ok: ${s.name}`)
    await page.close()
  }
} finally {
  await browser.close()
}
