// Скриншоты приложения, подключённого к Supabase (ДЗ-5): вход → лента → карточка.
// Запуск: DEMO_EMAIL=… DEMO_PASS=… node scripts/screenshots-live.mjs (dev-сервер на :5173)
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT = 'docs/screenshots'
const { DEMO_EMAIL, DEMO_PASS } = process.env
if (!DEMO_EMAIL || !DEMO_PASS) throw new Error('задайте DEMO_EMAIL и DEMO_PASS')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
try {
  for (const view of [
    { name: 'live-desktop', w: 1280, h: 800 },
    { name: 'live-mobile', w: 375, h: 812, mobile: true },
  ]) {
    // отдельный контекст на каждый прогон: иначе вторая страница наследует сессию первой
    const ctx = await browser.createBrowserContext()
    const page = await ctx.newPage()
    await page.setViewport({ width: view.w, height: view.h, isMobile: !!view.mobile, hasTouch: !!view.mobile })
    await page.goto(BASE, { waitUntil: 'networkidle0' })

    await page.waitForSelector('#email')
    if (view.name === 'live-desktop') await page.screenshot({ path: `${OUT}/live-login.png` })
    await page.type('#email', DEMO_EMAIL)
    await page.type('#password', DEMO_PASS)
    await page.click('button[type=submit]')

    await page.waitForSelector('text/ВебсайтСофт', { timeout: 15_000 })
    await page.screenshot({ path: `${OUT}/${view.name}.png` })
    console.log(`ok: ${view.name}`)
    await ctx.close()
  }
} finally {
  await browser.close()
}
