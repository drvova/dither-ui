// Render a Studio composition (or any player URL) to a PNG frame sequence —
// and an MP4 when ffmpeg is around — in any Playwright engine: Chromium,
// WebKit (Safari's engine) or Firefox. HyperFrames needs Chromium's CDP
// begin-frame control; this path needs only the web platform: every frame is
// the `hf-seek` DOM event the player already honours (each kit surface paints
// its moment synchronously), then a screenshot. Same seeds + same time → the
// same canvas bytes in every engine (text antialiasing is the engine's).
//
//   node scripts/render-frames.mjs <composition.html | url> [--browser chromium|webkit|firefox]
//     [--fps 30] [--seconds 6] [--out frames] [--mp4 out.mp4] [--scale 1] [--executable <path>]
//
// Duration, fps and size default to the composition's own root contract
// (data-duration, data-fps, data-width/height). WebKit and Firefox come from
// `npx playwright install webkit firefox`; Chromium from CHROME_PATH, a
// system install, or Playwright's registry.
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { chromium, firefox, webkit } from "playwright-core"

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback
}
const input = args.find((a) => !a.startsWith("--") && !args.includes(`--${args[args.indexOf(a) - 1]?.slice(2)}`) ) ?? args.find((a) => !a.startsWith("--"))
if (!input || args.includes("--help")) {
  console.error("usage: node scripts/render-frames.mjs <composition.html | url> [--browser chromium|webkit|firefox] [--fps 30] [--seconds 6] [--out frames] [--mp4 out.mp4] [--scale 1] [--executable <path>]")
  process.exit(input ? 0 : 1)
}
const engine = flag("browser", "chromium")
const out = resolve(flag("out", "frames"))
const mp4 = flag("mp4", "")
const scale = Number(flag("scale", "1")) || 1
const url = /^https?:\/\//.test(input) ? input : pathToFileURL(resolve(input)).href

/** The root contract of a composition file, when the input is one. */
function contractOf(file) {
  if (!existsSync(file)) return {}
  const html = readFileSync(file, "utf8")
  const root = html.match(/<div id="root"[^>]*>/)?.[0] ?? ""
  const attr = (name) => Number(root.match(new RegExp(`data-${name}="([\\d.]+)"`))?.[1])
  return { seconds: attr("duration"), fps: attr("fps"), width: attr("width"), height: attr("height") }
}
const contract = /^https?:\/\//.test(input) ? {} : contractOf(resolve(input))
const fps = Number(flag("fps", contract.fps || 30))
const seconds = Number(flag("seconds", contract.seconds || 6))
const width = contract.width || 480
const height = contract.height || 320
const frames = Math.max(1, Math.round(seconds * fps))

function findChromium() {
  const candidates = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean)
  return candidates.find((p) => existsSync(p))
}

const launchers = { chromium, webkit, firefox }
const type = launchers[engine]
if (!type) {
  console.error(`unknown browser ${engine}: chromium, webkit or firefox`)
  process.exit(1)
}
const executablePath = flag("executable", engine === "chromium" ? findChromium() : undefined)
const browser = await type.launch(executablePath ? { executablePath, args: engine === "chromium" ? ["--no-sandbox"] : [] } : {})
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale })
page.on("pageerror", (e) => console.error("page error:", e.message))
await page.goto(url, { waitUntil: "load" })
// The player's readiness: fonts + mount; HyperFrames' own hold, honoured here too.
await page.evaluate(() => window.__hf?.buildReady?.["dither-ui"] ?? null)
await page.waitForSelector("#dither-stage, .play-surface", { timeout: 15000 }).catch(() => {})
mkdirSync(out, { recursive: true })
const started = Date.now()
for (let i = 0; i < frames; i++) {
  const time = i / fps
  await page.evaluate((t) => {
    window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: t, waitUntil() {} } }))
  }, time)
  const file = resolve(out, `frame-${String(i + 1).padStart(5, "0")}.png`)
  writeFileSync(file, await page.screenshot({ clip: { x: 0, y: 0, width, height } }))
  if (i % fps === 0 || i === frames - 1) process.stderr.write(`\r${engine}: frame ${i + 1}/${frames} (${time.toFixed(2)}s)`)
}
process.stderr.write(`\n${frames} frames in ${((Date.now() - started) / 1000).toFixed(1)}s → ${out}\n`)
await browser.close()

if (mp4) {
  const ffmpeg = process.env.FFMPEG_PATH || (spawnSync("ffmpeg", ["-version"]).status === 0 ? "ffmpeg" : "")
  if (!ffmpeg) {
    console.error("no ffmpeg on the PATH (or FFMPEG_PATH): the frames are written, assemble them yourself")
    process.exit(2)
  }
  const r = spawnSync(ffmpeg, ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", resolve(out, "frame-%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", resolve(mp4)], { stdio: "inherit" })
  if (r.status !== 0) process.exit(r.status ?? 1)
  console.error(`→ ${resolve(mp4)}`)
}
