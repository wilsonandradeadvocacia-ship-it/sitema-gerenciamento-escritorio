import { chromium } from 'playwright-core'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 2,
})
for (const file of readdirSync('.').filter((f) => /^\d\d-.*\.html$/.test(f)).sort()) {
  await page.goto('file://' + resolve(file))
  await page.screenshot({ path: file.replace('.html', '.png') })
  console.log('ok', file)
}
await browser.close()
