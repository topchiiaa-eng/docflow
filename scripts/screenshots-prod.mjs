// Скриншоты всех экранов с production под свежим пользователем (демо-набор создаётся триггером).
// Запуск: node scripts/screenshots-prod.mjs  (BASE_URL по умолчанию — GitHub Pages)
import puppeteer from 'puppeteer-core'

const BASE = process.env.BASE_URL ?? 'https://topchiiaa-eng.github.io/docflow/'
const OUT = 'docs/screenshots'
const email = `shots-${Date.now()}@docflow-test.ru`
const password = `Shots-${Math.random().toString(36).slice(2, 10)}!1`

const clickText = async (page, text) =>
  (await page.waitForSelector(`text/${text}`, { timeout: 15000 })).click()
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const page = await b.newPage()
  await page.setViewport({ width: 1280, height: 720 })
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.screenshot({ path: `${OUT}/live-login.png` })

  // регистрация нового пользователя через UI
  await clickText(page, 'Нет аккаунта? Зарегистрироваться')
  await page.type('#email', email)
  await page.type('#password', password)
  await page.click('button[type=submit]')
  await page.waitForSelector('text/ГетБлоггер', { timeout: 20000 })
  await page.screenshot({ path: `${OUT}/live-desktop.png` })
  console.log('ok: login, desktop (новый пользователь)')

  // форма добавления документа
  await clickText(page, '+ Добавить документ')
  await page.waitForSelector('#nd-cp')
  await page.type('#nd-cp', 'ООО «Ромашка»')
  await page.type('#nd-title', 'Акт № 7')
  await page.type('#nd-sum', '1 500')
  await page.screenshot({ path: `${OUT}/live-new-document.png` })
  await page.keyboard.press('Escape')
  await (await page.$('[role="dialog"] button[type="button"]')).click() // Отмена

  // подписание: диалог, успех, отказ по роли
  await clickText(page, 'На подпись')
  await page.waitForSelector('text/ГетБлоггер')
  await clickText(page, 'ГетБлоггер')
  await clickText(page, 'Утвердить и подписать')
  await page.waitForSelector('[role=dialog]')
  await page.screenshot({ path: `${OUT}/live-sign-dialog.png` })
  await clickText(page, 'Подтвердить')
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('section[aria-label="Карточка документа"] span')].some(
        (s) => s.textContent === 'Подписан',
      ),
    { timeout: 15000 },
  )
  await page.screenshot({ path: `${OUT}/live-signed.png` })
  await clickText(page, 'Крипто-Тест')
  await clickText(page, 'Утвердить и подписать')
  await clickText(page, 'Подтвердить')
  await page.waitForSelector('section[aria-label="Карточка документа"] [role=alert]', { timeout: 15000 })
  await page.screenshot({ path: `${OUT}/live-sign-denied.png` })
  console.log('ok: sign dialog / signed / denied')

  // журнал и организации
  await clickText(page, 'Журнал')
  await page.waitForSelector('table')
  await page.screenshot({ path: `${OUT}/live-journal.png` })
  await clickText(page, 'Организации')
  await page.waitForSelector('#org-name')
  const card = await page.waitForSelector('section[aria-label="Компания А"]')
  await (await card.waitForSelector('text/Показать участников')).click()
  await card.waitForSelector(`li ::-p-text(${email})`)
  await page.screenshot({ path: `${OUT}/live-organizations.png` })
  console.log('ok: journal, organizations')

  // мобильная версия
  const ctx = await b.createBrowserContext() // отдельная сессия: иначе вкладка уже залогинена
  const m = await ctx.newPage()
  await m.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
  await m.goto(BASE, { waitUntil: 'networkidle0' })
  await m.waitForSelector('#email')
  await m.type('#email', email)
  await m.type('#password', password)
  await m.click('button[type=submit]')
  await m.waitForSelector('text/ГетБлоггер', { timeout: 20000 })
  await m.screenshot({ path: `${OUT}/live-mobile.png` })
  console.log('ok: mobile')
} finally {
  await b.close()
}
