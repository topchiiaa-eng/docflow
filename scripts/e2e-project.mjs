// E2E проектной работы на реальном бэкенде: организация → участник → документ с PDF → журнал.
// Запуск: set -a; source .env.test.local; set +a; BASE_URL=… node scripts/e2e-project.mjs
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/'
const { EMAIL, PASS, EMAIL2 } = process.env
const OUT = 'docs/screenshots'
if (!EMAIL || !PASS) throw new Error('задайте EMAIL и PASS')

// минимальный валидный PDF для загрузки
const PDF = '/tmp/docflow-e2e.pdf'
writeFileSync(
  PDF,
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF\n',
)

const clickText = async (page, text) =>
  (await page.waitForSelector(`text/${text}`, { timeout: 15000 })).click()
const stamp = Date.now().toString().slice(-5)

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const page = await b.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.type('#email', EMAIL)
  await page.type('#password', PASS)
  await page.click('button[type=submit]')
  await page.waitForSelector('text/Входящие')

  // 1) Организации: создать
  await clickText(page, 'Организации')
  await page.waitForSelector('#org-name')
  const orgName = `ООО «E2E ${stamp}»`
  await page.type('#org-name', orgName)
  await clickText(page, '+ Создать')
  await page.waitForSelector(`text/${orgName}`)
  console.log('1) организация создана:', orgName)

  // 2) Участник по email (второй тестовый пользователь)
  if (EMAIL2) {
    const card = await page.waitForSelector(`section[aria-label="${orgName}"]`)
    await (await card.waitForSelector('text/Показать участников')).click()
    await card.waitForSelector('text/' + EMAIL)
    await (await card.$('input[type=email]')).type(EMAIL2)
    await (await card.waitForSelector('text/Добавить')).click()
    await card.waitForSelector(`li ::-p-text(${EMAIL2})`) // именно в списке участников, не в поле ввода
    console.log('2) участник добавлен:', EMAIL2)
  }
  await page.screenshot({ path: `${OUT}/live-organizations.png` })

  // 3) Документ с PDF
  await clickText(page, 'Входящие')
  await clickText(page, '+ Добавить документ')
  await page.waitForSelector('#nd-org')
  await page.select(
    '#nd-org',
    await page.$eval('#nd-org', (s) => [...s.options].find((o) => o.text.includes('E2E')).value),
  )
  await page.type('#nd-cp', 'ООО «Контрагент E2E»')
  await page.type('#nd-title', `Акт № ${stamp}`)
  await page.type('#nd-sum', '1 234,5')
  const fileInput = await page.$('#nd-file')
  await fileInput.uploadFile(PDF)
  await page.screenshot({ path: `${OUT}/live-new-document.png` })
  await (await page.$('[role="dialog"][aria-label="Новый документ"] button[type=submit]')).click()
  await page.waitForSelector(`text/Акт № ${stamp}`)
  await page.waitForSelector('text/Открыть PDF')
  console.log('3) документ создан, PDF загружен (кнопка «Открыть PDF» есть)')

  // 4) Подписать его и проверить журнал
  await clickText(page, 'Утвердить и подписать')
  await clickText(page, 'Подтвердить')
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('section[aria-label="Карточка документа"] span')].some(
        (s) => s.textContent === 'Подписан',
      ),
    { timeout: 15000 },
  )
  await clickText(page, 'Журнал')
  await page.waitForSelector(`text/Акт № ${stamp}`)
  await page.screenshot({ path: `${OUT}/live-journal.png` })
  console.log('4) запись в журнале есть')
} finally {
  await b.close()
}
