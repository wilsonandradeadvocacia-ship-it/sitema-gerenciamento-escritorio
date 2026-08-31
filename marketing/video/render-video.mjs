// Renderiza reels.html quadro a quadro e codifica em H.264.
//   node render-video.mjs              -> reels-calculadora-30s.mp4
//   node render-video.mjs --preview    -> PNGs de amostra em ./preview
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FPS = 30
const DUR = 30.0
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const FFMPEG = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const OUT = 'reels-calculadora-30s.mp4'
const preview = process.argv.includes('--preview')

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await page.goto('file://' + resolve('reels.html'))
await page.evaluate(() => document.fonts.ready)

if (preview) {
  mkdirSync('preview', { recursive: true })
  for (const t of [1.6, 3.6, 6.0, 10.6, 12.6, 16.4, 21.4, 25.4, 29.0]) {
    await page.evaluate((x) => window.seek(x), t)
    writeFileSync(`preview/t${t}.png`, await page.screenshot({ type: 'png' }))
  }
  console.log('preview pronto')
} else {
  const total = Math.round(DUR * FPS)
  const ff = spawn(FFMPEG, [
    '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', OUT,
  ], { stdio: ['pipe', 'ignore', 'inherit'] })

  for (let i = 0; i < total; i++) {
    await page.evaluate((x) => window.seek(x), i / FPS)
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if (i % 90 === 0) console.log(`${i}/${total}`)
  }
  ff.stdin.end()
  await new Promise((r) => ff.on('close', r))
  console.log('video pronto:', OUT)
}
await browser.close()
