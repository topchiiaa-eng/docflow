// Скриншот страницы прогона CI (публичный репозиторий) для документации.
// Запуск: node scripts/ci-screenshot.mjs <run-id>
import puppeteer from 'puppeteer-core'
const runId = process.argv[2] ?? '35700624692'
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
try {
  const p = await b.newPage()
  await p.setViewport({ width: 1280, height: 800 })
  await p.goto(`https://github.com/topchiiaa-eng/docflow/actions/runs/${runId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })
  await new Promise((r) => setTimeout(r, 5000))
  await p.screenshot({ path: 'docs/screenshots/ci-run.png' })
  console.log('ok: docs/screenshots/ci-run.png')
} finally {
  await b.close()
}
