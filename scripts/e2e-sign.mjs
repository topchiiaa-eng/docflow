// End-to-end проверка подписания на живом бэкенде (ДЗ-5, Шаг 8):
// вход → подписание документа signer-организации → отказ по роли в «Компании В».
// Запуск: DEMO_EMAIL=… DEMO_PASS=… node scripts/e2e-sign.mjs (dev-сервер на :5173)
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT = 'docs/screenshots'
const { DEMO_EMAIL, DEMO_PASS } = process.env
if (!DEMO_EMAIL || !DEMO_PASS) throw new Error('задайте DEMO_EMAIL и DEMO_PASS')

const clickByText = async (page, text) => {
  const el = await page.waitForSelector(`text/${text}`, { timeout: 10_000 })
  await el.click()
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.waitForSelector('#email')
  await page.type('#email', DEMO_EMAIL)
  await page.type('#password', DEMO_PASS)
  await page.click('button[type=submit]')
  await page.waitForSelector('text/ГетБлоггер')

  // 1) успешное подписание (Компания А, роль signer)
  await clickByText(page, 'ГетБлоггер')
  await clickByText(page, 'Утвердить и подписать')
  await page.waitForSelector('[role=dialog]')
  await page.screenshot({ path: `${OUT}/live-sign-dialog.png` })
  await clickByText(page, 'Подтвердить')
  await page.waitForFunction(
    () =>
      document.querySelectorAll('section[aria-label="Карточка документа"] span').length &&
      [...document.querySelectorAll('section[aria-label="Карточка документа"] span')].some(
        (s) => s.textContent === 'Подписан',
      ),
    { timeout: 15_000 },
  )
  await page.screenshot({ path: `${OUT}/live-signed.png` })
  console.log('ok: подписание — статус «Подписан»')

  // 2) отказ по роли (Компания В, роль operator)
  await clickByText(page, 'Крипто-Тест')
  await clickByText(page, 'Утвердить и подписать')
  await clickByText(page, 'Подтвердить')
  const alert = await page.waitForSelector('section[aria-label="Карточка документа"] [role=alert]', {
    timeout: 15_000,
  })
  const text = await alert.evaluate((el) => el.textContent)
  await page.screenshot({ path: `${OUT}/live-sign-denied.png` })
  console.log(`ok: отказ по роли показан — «${text}»`)
} finally {
  await browser.close()
}
