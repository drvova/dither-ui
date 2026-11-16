// @vitest-environment node
// The kit's UI motion is CSS, and the kit clock holds it (engine/clock.ts):
// proven in a real Chromium on the kit's own components, bundled from
// `css-motion-page.tsx` with their stylesheets. At a directed moment each
// shows what its motion is at that time (the old JS drivers' model, worked
// out here), the same seeking forwards or back, mounted before the moment
// or after it, and plays on from the moment when the clock is released.
import { join } from "node:path"
import { type Browser, chromium, type Page } from "playwright-core"
import { build } from "vite"
import solid from "vite-plugin-solid"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { MOTION_ROLES, ROLE_EASINGS } from "@dither-ui/kit/engine"
import { findChromium } from "@dither-ui/tasks"

const HERE = import.meta.dirname
const ORIGIN = "https://kit-motion.test"
let browser: Browser
let page: Page

beforeAll(async () => {
  const built = await build({
    configFile: false,
    root: HERE,
    logLevel: "error",
    plugins: [solid()],
    resolve: { conditions: ["browser"] },
    build: {
      write: false,
      cssCodeSplit: false,
      lib: {
        entry: join(HERE, "css-motion-page.tsx"),
        formats: ["es"],
        fileName: "page",
      },
    },
  })
  const output = [built].flat().flatMap((r) => ("output" in r ? r.output : []))
  const script = output.find((f) => f.type === "chunk" && f.isEntry)
  const css = output
    .filter((f) => f.type === "asset" && f.fileName.endsWith(".css"))
    .map((f) => (f.type === "asset" ? String(f.source) : ""))
    .join("\n")
  if (script?.type !== "chunk") throw new Error("the motion page did not bundle")
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
body { margin: 0; font: 16px/20px monospace } .cell { width: 10px; height: 10px }</style></head>
<body><div id="stage"></div><script type="module" src="/page.js"></script></body></html>`
  browser = await chromium.launch({
    executablePath: findChromium(),
    args: ["--no-sandbox"],
  })
  page = await browser.newPage({ reducedMotion: "no-preference" })
  await page.route(`${ORIGIN}/**`, (route) =>
    new URL(route.request().url()).pathname === "/page.js"
      ? route.fulfill({ contentType: "text/javascript", body: script.code })
      : route.fulfill({ contentType: "text/html", body: html }),
  )
  await page.goto(`${ORIGIN}/`)
  await page.waitForFunction(() => "kit" in window)
}, 120_000)

afterAll(async () => {
  await browser?.close()
})

/** A digit's or a letter's row, px: 1.25em at the page's 16px. */
const ROW = 20

/** Mount a piece and let it start (its observers fire, its CSS begins). */
async function mount(name: string) {
  await page.evaluate((n) => window.kit.mount(n), name)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
}
const seek = (ms: number) => page.evaluate((t) => window.kit.seek(t), ms)
const read = <T>(fn: () => T) => page.evaluate(fn)
/** How far up each column stands, px. */
const shifts = (selector: string) =>
  page.evaluate(
    (sel) => [...document.querySelectorAll(sel)].map((c) => -new DOMMatrix(getComputedStyle(c).transform).m42),
    selector,
  )

/** The old TextType driver's model: what is typed `ms` into the run. */
function typedAt(texts: string[], type: number, del: number, pause: number, ms: number): string {
  const cycle = (s: string) => s.length * (type + del) + pause + 220
  let u = ms - 300
  if (u < 0) return ""
  u %= texts.reduce((sum, s) => sum + cycle(s), 0)
  for (const s of texts) {
    if (u >= cycle(s)) {
      u -= cycle(s)
      continue
    }
    const typed = s.length * type + pause
    if (u < typed) return s.slice(0, Math.floor(u / type) + 1)
    return s.slice(0, Math.max(0, s.length - Math.floor((u - typed) / del) - 1))
  }
  return ""
}

describe("the kit's CSS motion under the kit clock", () => {
  it("TrueFocus: the moment's word in focus, crossfading into the next", async () => {
    await mount("focus")
    const words = () =>
      read(() => [...document.querySelectorAll(".dk-true-focus-word")].map((w) => Number(getComputedStyle(w).opacity)))
    await seek(1250)
    expect(await words()).toEqual([0.5, 1, 0.5])
    await seek(2900) // the third word blurring as the first sharpens, over the turn
    const [first, , third] = await words()
    expect(first).toBeCloseTo(0.9, 2)
    expect(third).toBeCloseTo(0.6, 2)
    await seek(250)
    expect(await words()).toEqual([1, 0.5, 0.5])
  })

  it("RotatingText: one word stands at each moment, the turn's word", async () => {
    await mount("rotate")
    for (const [ms, word] of [
      [100, 0],
      [1500, 1],
      [2600, 2],
      [3500, 0],
    ] as const) {
      await seek(ms)
      const shown = await read(() =>
        [...document.querySelectorAll(".dither-rot-word")].map((w) => Number(getComputedStyle(w).opacity)),
      )
      expect(shown.map((o) => Math.round(o))).toEqual([0, 1, 2].map((i) => (i === word ? 1 : 0)))
    }
  })

  it("TextType: the letters on the page are what is typed at the moment, forwards and back", async () => {
    await mount("type")
    for (const ms of [0, 299, 300, 450, 799, 1200, 1500, 1700, 2120, 2400, 3100, 2000, 650]) {
      await seek(ms)
      const typed = await read(() =>
        [...document.querySelectorAll(".dk-type-char")]
          .filter((c) => parseFloat(getComputedStyle(c).fontSize) > 0.5)
          .map((c) => c.textContent)
          .join(""),
      )
      expect(typed, `at ${ms}ms`).toBe(typedAt(["Hello", "World"], 100, 100, 200, ms))
    }
  })

  it("Sequence: each child's --seq-p at the moment, its stagger kept", async () => {
    await mount("sequence")
    const progress = () =>
      read(() =>
        [...document.querySelectorAll(".cell")].map((c) => Number(getComputedStyle(c).getPropertyValue("--seq-p"))),
      )
    await seek(500) // the first done, the second 0.2 into its 0.5, the third yet to start
    const [a, b, c] = await progress()
    expect(a).toBe(1)
    expect(b).toBeCloseTo(0.4, 3)
    expect(c).toBe(0)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
    await seek(100)
    expect((await progress())[0]).toBeCloseTo(0.2, 3)
    // its place is told by its animation's events, dispatched with the next frame
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    expect(await read(() => [...document.querySelectorAll(".cell")].map((c) => c.getAttribute("data-seq")))).toEqual([
      "active",
      "before",
      "before",
    ])
  })

  it("CountUp: the columns stand where the ease-out puts them at the moment", async () => {
    await mount("count")
    const rows = async () => (await shifts(".dk-count-column")).map((px) => px / ROW)
    const ease = (p: number) => 1 - (1 - p) ** 3
    await seek(400)
    const ends = await read(() =>
      [...document.querySelectorAll<HTMLElement>(".dk-count-column")].map((c) =>
        Number(c.style.getPropertyValue("--dk-end")),
      ),
    )
    const at = await rows()
    ends.forEach((end, i) => expect(at[i]).toBeCloseTo(end * ease(0.4), 0))
    await seek(1000)
    expect(await rows()).toEqual(ends)
  })

  it("DecryptedText: a glyph a frame, the letters settled by the moment", async () => {
    await mount("decrypt")
    const rows = async () => (await shifts(".dk-decrypt-column")).map((px) => Math.round(px / ROW))
    // a letter a frame at speed 3; the column's rows are frames, settled on the last
    await seek(1000 / 60 + 1)
    expect(await rows()).toEqual([2, 2, 2])
    await seek(10_000)
    expect(await rows()).toEqual([2, 3, 4])
  })

  it("the travel and the bump roles: a hop where its curve puts it, its receiver's pulse after it lands", async () => {
    await mount("arrival")
    const travel = MOTION_ROLES.travel.ms
    const bump = MOTION_ROLES.bump.ms
    const at = () =>
      read(() => ({
        x: parseFloat(getComputedStyle(document.querySelector(".hop")!).translate),
        scale: parseFloat(getComputedStyle(document.querySelector(".receiver")!).scale),
      }))
    for (const p of [0.25, 0.5, 0.75]) {
      await seek(travel * p)
      const { x, scale } = await at()
      expect(x, `hop at ${p}`).toBeCloseTo(100 * ROLE_EASINGS.travel(p), 0)
      // the receiver waits out the hop at its size
      expect(Number.isNaN(scale) ? 1 : scale).toBe(1)
    }
    for (const p of [0.2, 0.5, 0.8]) {
      await seek(travel + bump * p)
      const { x, scale } = await at()
      expect(x).toBe(100)
      expect(scale, `bump at ${p}`).toBeCloseTo(0.9 + 0.1 * ROLE_EASINGS.bump(p), 3)
    }
    // the bump passes its mark: past 1 on its way back
    await seek(travel + bump * 0.6)
    expect((await at()).scale).toBeGreaterThan(1)
    await seek(travel / 2)
    expect((await at()).x).toBeCloseTo(50, 0)
  })

  it("holds what starts while it is directed, and plays it on from the moment when released", async () => {
    await page.evaluate(() => window.kit.unmount())
    await seek(1250)
    await mount("focus") // mounted under direction: caught as its animation starts
    const words = () =>
      read(() => [...document.querySelectorAll(".dk-true-focus-word")].map((w) => Number(getComputedStyle(w).opacity)))
    expect(await words()).toEqual([0.5, 1, 0.5])
    const state = () => read(() => document.getAnimations().map((a) => a.playState))
    expect(await state()).toEqual(["paused"])
    await page.evaluate(() => window.kit.release())
    expect(await state()).toEqual(["running"])
    const time = await read(() => Number(document.getAnimations()[0]!.currentTime))
    expect(time).toBeGreaterThanOrEqual(1250)
  })
})
