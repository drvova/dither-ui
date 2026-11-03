// Record the Studio's agent panel driving YOUR coding agent: a video of
// one ask answered on the canvas by the harness you are signed in to
// (Claude Code by default). The panel is a control plane, so nothing signs
// in here: the bridge starts the harness as your own process, on its own
// login, in a fresh scratch folder. The script starts that bridge, opens
// the Studio you serve, picks the harness, types the ask, lets each
// permission prompt show a beat before allowing it (always, for that tool,
// in that scratch folder), waits for the turn to end, fits the canvas to
// its frames, opens what it changed, and writes a WebM (and an MP4 when ffmpeg is
// on the PATH).
//
//   npm run dev                       # the Studio, in another terminal
//   node scripts/agent-demo.mjs [--url http://localhost:5173/studio/]
//     [--harness claude] [--agent "<any ACP command>"] [--ask "<text>"]
//     [--out agent-demo] [--timeout 300] [--executable <chromium>]
//
// `--harness` is one of the bridge's presets (claude, codex, gemini, ...);
// `--agent` runs any command that speaks the Agent Client Protocol instead.
import { spawn, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, renameSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { chromium } from "playwright-core"

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback
}
if (args.includes("--help")) {
  console.log(
    'usage: node scripts/agent-demo.mjs [--url http://localhost:5173/studio/] [--harness claude] [--agent "<command>"] [--ask "<text>"] [--out agent-demo] [--timeout 300] [--executable <chromium>]',
  )
  process.exit(0)
}
const url = flag("url", "http://localhost:5173/studio/")
const agent = flag("agent", "")
const harness = flag("harness", "claude")
const ask = flag("ask", "A sign-in screen with an email field, a password field and a primary button")
const out = resolve(flag("out", "agent-demo"))
const timeout = Number(flag("timeout", "300")) * 1000
// Its own port, so a bridge you already run is left alone.
const PORT = 8791
const W = 1440
const H = 900

function findChromium() {
  return [
    flag("executable", ""),
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find((p) => p && existsSync(p) && statSync(p).isFile())
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

// The bridge, in a scratch folder: the harness works there, never in a repo.
const cwd = mkdtempSync(join(tmpdir(), "dither-agent-demo-"))
const bridgeArgs = ["bridge/dither-bridge.mjs", "--port", String(PORT), "--cwd", cwd]
if (agent) bridgeArgs.push("--agent", agent)
const bridge = spawn(process.execPath, bridgeArgs, { stdio: ["ignore", "pipe", "pipe"] })
const said = []
for (const s of [bridge.stdout, bridge.stderr]) s.on("data", (d) => said.push(String(d)))
await pause(800)

const executablePath = findChromium()
const browser = await chromium.launch(executablePath ? { executablePath, args: ["--no-sandbox"] } : {})
mkdirSync(out, { recursive: true })
const context = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: out, size: { width: W, height: H } },
})
// The panel's saved choice, as if picked in its harness menu: this bridge,
// the preset (or the bridge's own --agent), prompts left to answer.
// The top page only: a built tool's sandbox frame has no storage to set.
await context.addInitScript(
  ([bridgeUrl, id]) =>
    window === window.top &&
    localStorage.setItem("dither-agent-config", JSON.stringify({ bridgeUrl, harness: id, command: "", auto: false })),
  [`ws://127.0.0.1:${PORT}`, agent ? "" : harness],
)
const page = await context.newPage()
page.on("pageerror", (e) => console.error("page error:", e.message))

let ok = false
try {
  await page.goto(url, { waitUntil: "networkidle" })
  await pause(1200)
  await page.locator('button[aria-label^="Toggle agent"]').click()
  const field = page.locator('textarea[name="agent-goal"]')
  await field.waitFor()
  await pause(700)
  await field.pressSequentially(ask, { delay: 38 })
  await pause(500)
  await field.press("Enter")

  // Each prompt shows a beat, then is allowed once; the turn ends with its
  // "Worked for" line.
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (await page.locator(".worked").count()) break
    // The last allow is the harness's "always" when it offers one: the
    // scratch folder remembers it, so a tool is asked about once.
    const allow = page.locator(".approval .key.is-primary").last()
    if (await allow.isVisible().catch(() => false)) {
      await pause(1400)
      await allow.click().catch(() => {})
    }
    await pause(400)
  }
  if (!(await page.locator(".worked").count())) throw new Error(`the turn did not end within ${timeout / 1000}s`)
  await pause(1500)
  // Every frame in view, wherever the agent put the new one.
  await page.locator('button[aria-label="Fit to screen"]').click()
  await pause(1200)
  const changed = page.locator(".head.is-split .toggle")
  if (await changed.count()) {
    await changed.click()
    await pause(2500)
  }
  ok = true
} catch (e) {
  console.error(`agent demo: ${e.message}`)
  console.error(said.join("").split("\n").slice(-12).join("\n"))
} finally {
  const video = page.video()
  await context.close()
  await browser.close()
  bridge.kill()
  if (video && ok) {
    const webm = join(out, "agent-demo.webm")
    renameSync(await video.path(), webm)
    console.log(`video: ${webm}`)
    const mp4 = join(out, "agent-demo.mp4")
    const ff = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        webm,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        "20",
        "-movflags",
        "+faststart",
        mp4,
      ],
      { stdio: "inherit" },
    )
    if (ff.status === 0) console.log(`video: ${mp4}`)
  }
  process.exit(ok ? 0 : 1)
}
