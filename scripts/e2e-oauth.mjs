// Проверка интеграции Google OAuth на опубликованном сайте (ДЗ-6, Шаг 3):
// 1) кнопка «Войти через Google» уводит на accounts.google.com с нужным callback;
// 2) возврат с #error=access_denied показывает понятное сообщение.
import puppeteer from 'puppeteer-core'
const BASE = process.env.BASE_URL ?? 'https://topchiiaa-eng.github.io/docflow/'
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const p = await b.newPage()
  await p.setViewport({ width: 1280, height: 800 })
  await p.goto(BASE, { waitUntil: 'networkidle0' })
  const btn = await p.waitForSelector('text/Войти через Google')
  await Promise.all([p.waitForNavigation({ timeout: 20000 }), btn.click()])
  const u = new URL(p.url())
  console.log('1) после клика:', u.origin + u.pathname)
  console.log('   redirect_uri =', u.searchParams.get('redirect_uri'))
  console.log('   redirect_to  =', u.searchParams.get('redirect_to'))
  await p.screenshot({ path: 'docs/screenshots/oauth-google-consent.png' })

  await p.goto(`${BASE}#error=access_denied&error_code=access_denied&error_description=User+denied+access`, {
    waitUntil: 'networkidle0',
  })
  const alert = await p.waitForSelector('[role=alert]', { timeout: 10000 })
  console.log('2) сообщение при отмене:', await alert.evaluate((e) => e.textContent))
  console.log('   hash очищен:', p.url().includes('#') ? 'нет' : 'да')
  await p.screenshot({ path: 'docs/screenshots/oauth-denied.png' })
} finally {
  await b.close()
}
