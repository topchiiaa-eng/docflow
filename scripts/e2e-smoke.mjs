// Post-deploy smoke-тест production (запускается из CI после деплоя):
// вход тестовым пользователем → лента с данными из Supabase → журнал открывается.
// Падение = деплой «зелёный», но приложение не работает с реальным бэкендом.
// Нужны E2E_EMAIL / E2E_PASS (GitHub Secrets) и Chrome (CHROME_PATH; на ubuntu-runner — /usr/bin/google-chrome).
import puppeteer from 'puppeteer-core'

const BASE = process.env.BASE_URL ?? 'https://topchiiaa-eng.github.io/docflow/'
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const { E2E_EMAIL, E2E_PASS } = process.env
if (!E2E_EMAIL || !E2E_PASS) {
  console.log('::warning::E2E_EMAIL/E2E_PASS не заданы — smoke-тест пропущен')
  process.exit(0)
}

const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
try {
  const page = await b.newPage()
  await page.setViewport({ width: 1280, height: 720 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.waitForSelector('#email', { timeout: 20000 })
  await page.type('#email', E2E_EMAIL)
  await page.type('#password', E2E_PASS)
  await page.click('button[type=submit]')
  await page.waitForSelector('ul[aria-label="Список документов"] li', { timeout: 30000 })
  const docs = await page.$$eval('ul[aria-label="Список документов"] li', (els) => els.length)
  console.log(`лента: ${docs} документов из Supabase`)
  await (await page.waitForSelector('text/Журнал')).click()
  await page.waitForSelector('h1 ::-p-text(Журнал подписаний)', { timeout: 20000 })
  console.log('журнал: открыт')
  if (errors.length) throw new Error('JS-ошибки на странице: ' + errors.join('; '))
  if (docs === 0) throw new Error('лента пуста — сидинг или RLS сломаны')
  console.log('smoke OK')
} finally {
  await b.close()
}
