// The browser walk: every page of a built site visited in one engine, and
// what a reader would meet there checked. Run by hand, never by a build or
// the gate:
//
//   npm run walk -- --engine chromium|webkit|firefox [--out <folder>] [--root <built site>]
//     [--jobs 4] [--only <a path as /docs/area/, or text in one; several by commas>] [--run all|family|none]
//     [--styles tailwind,css,modules,stylex] [--light all|<n>] [--phone on|off] [--contrast on|off]
//     [--executable <browser>] [--driver <webdriver server>]
//
// Chromium is `CHROME_PATH` or a standard install, through Playwright.
// WebKit is WebKitGTK (`WebKitWebDriver` and `MiniBrowser`), Firefox a
// `firefox` with `geckodriver`, both over WebDriver; the walk installs no
// browser, `--executable` and `--driver` name the ones this machine has.
//
// It serves `--root` (default `packages/site/.output/public`) itself and
// walks: the landing, `/docs/`, EVERY docs section the build lists
// (`og/sections.json`), the Studio, the player (bare, then given a frame
// from the Studio's own document) and an address nothing answers. A page's
// record: what it threw, what it logged as an error or a warning, what it
// asked for and was refused, and for a docs section every demo card
// revealed, every canvas in it painted, its Code tab's files read one by
// one, and its example edited and Run in every styling system the docs'
// switch offers (`--styles`). Sections walk in the dark theme, then again in
// light (`--light all`; a number walks the first few of each family and one
// in eight of the rest). The Studio adds a frame from the library, selects
// it, changes a property, undoes, redoes and opens search. Every page in
// both themes has the contrast of its text measured where the walk stops
// (`--contrast`), and every page is walked once more at an iPhone's size
// (`--phone`): what overflows the window, targets under 24px, fields under
// 16px, text cut off, a demo spilling out of its card; the Studio there
// shows its notice (walk-checks.mjs).
//
// Out: `<out>/<engine>.json` (every page's record), `<out>/<engine>.md` (the
// summary) and `<out>/shots/<engine>/` (the sampled and the flagged pages).
// Exit code 1 when an unexplained finding remains.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import {
  A11Y,
  changedPixels,
  CONTRAST,
  DIALOG_CLOSED,
  DIALOG_FOCUS,
  DIALOG_KEYS,
  DIALOG_OPENED,
  DIALOG_TABBED,
  dialogFindings,
  FOCUS_ARRIVED,
  FOCUS_BEFORE,
  FOCUS_OFF,
  KEYS_DONE,
  KEYS_END,
  KEYS_READ,
  KEYS_START,
  measureContrast,
  PHONE,
} from "./walk-checks.mjs"
import { coloursIn, decodePng, firefoxDriver, playwrightDriver, serve, sleep, webkitDriver } from "./walk-drivers.mjs"

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback
}
if (args.includes("--help")) {
  console.error(
    "usage: npm run walk -- --engine chromium|webkit|firefox [--out <folder>] [--root <built site>] [--jobs 4] [--only <text>] [--run all|family|none] [--styles tailwind,css,modules,stylex] [--light all|<n>] [--phone on|off] [--contrast on|off] [--executable <browser>] [--driver <webdriver server>]",
  )
  process.exit(0)
}
const engine = flag("engine", "chromium")
const root = resolve(flag("root", "packages/site/.output/public"))
const out = resolve(flag("out", "walk-report"))
const jobs = Math.max(1, Number(flag("jobs", "4")) || 4)
const only = flag("only", "")
const runMode = flag("run", "all")
const lightFlag = flag("light", "all")
const lightEach = lightFlag === "all" ? Infinity : Number(lightFlag) || 0
const phone = flag("phone", "on") !== "off"
const contrast = flag("contrast", "on") !== "off"
const a11y = flag("a11y", "on") !== "off"
/** The docs' styling systems each example is Run in, by the switch's labels. */
const STYLE_LABELS = { tailwind: "Tailwind", css: "CSS", modules: "Modules", stylex: "StyleX" }
const styles = flag("styles", Object.keys(STYLE_LABELS).join(",")).split(",").filter(Boolean)
for (const st of styles)
  if (!STYLE_LABELS[st]) throw new Error(`unknown styling ${st}: ${Object.keys(STYLE_LABELS).join(", ")}`)
if (!existsSync(join(root, "og/sections.json"))) {
  console.error(`no built site at ${root}: run \`npm run build\` first`)
  process.exit(1)
}

function findChromium() {
  return [
    flag("executable", ""),
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].find((p) => p && existsSync(p))
}

async function openEngine() {
  if (engine === "chromium") {
    const executablePath = findChromium()
    if (!executablePath) throw new Error("no Chromium: set CHROME_PATH or pass --executable")
    return playwrightDriver({ executablePath })
  }
  if (engine === "webkit")
    return webkitDriver({ driver: flag("driver", undefined), binary: flag("executable", undefined) })
  if (engine === "firefox")
    return firefoxDriver({ driver: flag("driver", undefined), binary: flag("executable", undefined) })
  throw new Error(`unknown engine ${engine}: chromium, webkit or firefox`)
}

// ---------------------------------------------------------------- the pages

/** Requests a page is known to be refused, by design. */
const KNOWN_REFUSALS = {
  // the player stands outside the site's shell, so it names no icon and the browser asks for the default one
  play: [/\/favicon\.ico$/],
  // the address nothing answers is itself the refusal
  missing: [/\/no-such-page\/?$/],
}
const MISSING = "/no-such-page/"

/** What a machine without a GPU, or the walk's own hand, brings about: a
 * page is not at fault for it. */
const ENVIRONMENT = [
  // software GL (SwiftShader): every readback of the kit's GL engines stalls its one thread
  /GL Driver Message .*GPU stall due to ReadPixels/,
  // the walk's pointer is a script's: Gecko holds no active pointer of its id for a surface to capture
  /setPointerCapture: Invalid pointer id/,
]

/** A media element that failed on a file the build holds: a format this
 * engine does not play (an open Chromium has no H.264), the machine's,
 * not the page's. `failed` is the recorder's `<tag> <url>`. */
function unplayable(failed) {
  const [tag, url = ""] = failed.split(" ")
  const path = url.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0]
  return /^(video|audio|source)$/.test(tag) && path !== "" && existsSync(join(root, decodeURI(path)))
}

const sections = JSON.parse(readFileSync(join(root, "og/sections.json"), "utf8"))
const registry = JSON.parse(readFileSync(join(root, "agent/registry.json"), "utf8"))

function plan() {
  const pages = [
    { kind: "landing", path: "/", theme: "dark" },
    { kind: "docs", path: "/docs/", theme: "dark" },
  ]
  const perFamily = new Map()
  for (const s of sections) {
    const n = perFamily.get(s.group) ?? 0
    perFamily.set(s.group, n + 1)
    // screenshots of the first few of a family and one in eight of the rest
    const sample = n < 3 || n % 8 === 0
    const light = n < lightEach || (lightEach > 0 && n % 8 === 0)
    const page = { kind: "section", path: `/docs/${s.id}/`, id: s.id, group: s.group, theme: "dark", sample }
    pages.push({ ...page, first: n === 0 })
    if (light) pages.push({ ...page, theme: "light" })
  }
  pages.push(
    { kind: "studio", path: "/studio/", theme: "dark" },
    { kind: "studio", path: "/studio/", theme: "light", look: true },
    { kind: "play", path: "/play/", theme: "dark" },
    { kind: "missing", path: MISSING, theme: "dark" },
  )
  // every page once more at a phone's size, in the dark
  if (phone)
    for (const p of pages.filter((x) => x.theme === "dark"))
      pages.push({ ...p, device: "phone", sample: p.kind === "section" ? p.first : true })
  const picked = only.split(",").filter(Boolean)
  return picked.length
    ? pages.filter((p) => picked.some((t) => (t.startsWith("/") ? p.path === t : p.path.includes(t))))
    : pages
}

// ---------------------------------------------------------------- page scripts
// Each runs in the page, as the body of an async function given `arg`; the
// recorder's helpers are `__walk` (walk-drivers.mjs).

/** The app has mounted over the prerendered bytes and the page is at rest. */
const READY = `
const W = window.__walk
await W.until(() => document.readyState === "complete", 20000)
if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, W.sleep(4000)])
await W.sleep(arg && arg.settle || 600)
return { title: document.title, w: innerWidth, h: innerHeight, ratio: devicePixelRatio, dark: document.documentElement.classList.contains("dark"),
  overflow: document.documentElement.scrollWidth - innerWidth }
`

const RECORD_FAILED = `return window.__walk.failed.splice(0)`

const RECORD = `const W = window.__walk; return { errors: W.errors.splice(0), logs: W.logs.splice(0), failed: W.failed.splice(0) }`

/** The docs section's cards, counted once the section's own pack has loaded. */
const CARDS = `
const W = window.__walk
const section = document.getElementById(arg.id)
if (!section) return { missing: true }
await W.until(() => section.querySelector("[data-demo-card]"), 6000)
await W.sleep(300)
const cards = [...document.querySelectorAll("[data-demo-card]")]
const shown = (c) => c.closest("section[id]") === section && c.getClientRects().length > 0
return {
  elsewhere: cards.filter((c) => !shown(c)).length,
  heading: (section.querySelector("h1,h2") || {}).textContent || "",
  text: section.innerText.length,
  cards: cards.map((c) => (shown(c) ? arg.id : "")),
  loose: [...section.querySelectorAll("canvas")].filter((c) => !c.closest("[data-demo-card]")).length,
}
`

/** One card brought into view, revealed and settled; its canvases read. A
 * canvas that reads blank gets a while longer: a model still loading, a
 * surface that paints on its first frame in view. */
const CARD = `
const W = window.__walk
const card = arg.n < 0 ? document.getElementById(arg.id) : document.querySelectorAll("[data-demo-card]")[arg.n]
if (!card) return { missing: true }
const well = arg.n < 0 ? card : card.querySelector(".demo-well")
if (arg.n >= 0) card.scrollIntoView({ block: "center" })
const waiting = () => arg.n >= 0 && well.querySelector(":scope > div > [aria-hidden=true].animate-pulse")
const revealed = arg.n < 0 || !!(await W.until(() => !waiting(), 6000))
await W.frames(3)
await W.sleep(arg.settle)
const list = () => [...well.querySelectorAll("canvas")].filter((c) => arg.n >= 0 || !c.closest("[data-demo-card]"))
const read = async () => {
  const seen = []
  for (const c of list()) {
    let s = W.canvas(c)
    if (s.state !== "painted" && s.state !== "hidden") {
      const r = c.getBoundingClientRect()
      if (r.top < 0 || r.bottom > innerHeight) { c.scrollIntoView({ block: "center" }); await W.frames(3); s = W.canvas(c) }
    }
    seen.push(s)
  }
  return W.layers(seen)
}
let canvases = await read()
const end = Date.now() + arg.patience
const empty = () => canvases.some((c) => c.state === "blank" || c.state === "flat")
if (empty()) {
  // a surface that prints under a pointer is given one
  const all = list()
  for (let i = 0; i < all.length; i++) if (canvases[i].state === "blank") canvases[i] = await W.poke(all[i])
  W.layers(canvases)
  while (empty() && Date.now() < end) {
    await W.sleep(250)
    canvases = await read()
  }
}
const alert = well.querySelector("[role=alert]")
const content = arg.n < 0 ? well : well.firstElementChild
return { revealed, canvases, text: well.innerText.trim().length,
  rendered: content.children.length > 0 && content.getBoundingClientRect().height > 1, alert: alert ? alert.textContent.slice(0, 200) : "" }
`

/** A canvas the page could not read, centred for a screenshot. */
const CENTRE = `
const card = arg.n < 0 ? document.getElementById(arg.id) : document.querySelectorAll("[data-demo-card]")[arg.n]
const well = arg.n < 0 ? card : card.querySelector(".demo-well")
const c = [...well.querySelectorAll("canvas")][arg.i]
if (!c) return null
c.scrollIntoView({ block: "center" })
await window.__walk.frames(3)
await window.__walk.sleep(200)
const r = c.getBoundingClientRect()
const x = Math.max(0, r.left), y = Math.max(0, r.top)
return [x, y, Math.min(innerWidth, r.right) - x, Math.min(innerHeight, r.bottom) - y]
`

/** The Code tab: opened, every file tab picked and read. */
const CODE = `
const W = window.__walk
const card = document.querySelectorAll("[data-demo-card]")[arg.n]
card.scrollIntoView({ block: "start" })
const tabs = card.querySelector("[role=tablist]").querySelectorAll("[role=tab]")
tabs[1].click()
const panel = await W.until(() => card.querySelector(".source-panel-scope"), 10000)
if (!panel) return { opened: false }
const area = () => panel.querySelector("[role=tabpanel] textarea")
const loaded = (name) => W.until(() => {
  const note = panel.querySelector("[role=tabpanel] .src-note")
  if (note && /Couldn't load/.test(note.textContent)) return { error: note.textContent.trim() }
  const t = area()
  return t && t.value && t.getAttribute("aria-label") === name + " source" ? { text: t.value } : null
}, 10000)
const files = []
const fileTabs = () => [...panel.querySelectorAll(".src-tab")]
await W.until(() => fileTabs().length, 5000)
// the kit's files join the example's once the kit's index has loaded
let count = -1
await W.until(async () => { const n = fileTabs().length; const same = n === count; count = n; if (!same) await W.sleep(250); return same }, 6000)
for (let i = 0; i < fileTabs().length; i++) {
  const tab = fileTabs()[i]
  tab.click()
  const name = tab.dataset.path.split("/").pop()
  const got = await loaded(name)
  files.push({ path: tab.dataset.path, name, selected: tab.getAttribute("aria-selected") === "true",
    size: got && got.text ? got.text.length : 0, error: got ? got.error || "" : "never loaded",
    text: i === 0 && got && got.text ? got.text : undefined })
}
fileTabs()[0].click()
await loaded(files[0].name)
const run = panel.querySelector(".src-run")
return { opened: true, files, runnable: run.getAttribute("aria-disabled") !== "true", why: run.getAttribute("title") || "",
  styling: (card.querySelector("[aria-label=Styling] [aria-pressed=true]") || {}).textContent || "" }
`

/** Edit the example (a line the module runs as it loads, so a run that
 * leaves its mark compiled and evaluated the edited text) and Run it; read
 * the result standing in the preview; restore the demo. */
const RUN = `
const W = window.__walk
const card = document.querySelectorAll("[data-demo-card]")[arg.n]
const panel = card.querySelector(".source-panel-scope")
const area = panel.querySelector("[role=tabpanel] textarea")
const mark = "walk" + Date.now() + "_" + arg.n
const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set
set.call(area, area.value + "\\n;(globalThis.__walkRan = " + JSON.stringify(mark) + ")\\n")
area.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }))
await W.frames(2)
const edited = !!panel.querySelector(".src-tab .src-dot")
const run = panel.querySelector(".src-run")
const started = Date.now()
run.click()
const restore = () => [...card.querySelectorAll("button")].find((b) => b.textContent.trim() === "Restore the demo")
const done = await W.until(() => {
  if (run.textContent.trim() === "Running") return null
  const problems = [...panel.querySelectorAll(".src-problems li")].map((li) => li.textContent.trim().slice(0, 300))
  if (problems.length) return { problems }
  return restore() && globalThis.__walkRan === mark ? { ran: true } : restore() ? null : null
}, arg.patience)
const result = { edited, ms: Date.now() - started, ran: !!(done && done.ran), problems: done && done.problems || [],
  timeout: !done, marked: globalThis.__walkRan === mark, status: (panel.querySelector(".src-status") || {}).textContent || "" }
if (!result.ran) {
  // put the example back as it was
  const revert = panel.querySelector(".src-key[aria-label^=Revert]")
  if (revert) revert.click()
  return result
}
const well = card.querySelector(".demo-well")
well.scrollIntoView({ block: "center" })
await W.frames(3)
await W.sleep(arg.settle)
const stopped = well.querySelector("[role=alert]")
result.stopped = stopped && /The run stopped/.test(stopped.textContent) ? stopped.textContent.trim().slice(0, 300) : ""
const all = () => [...well.querySelectorAll("canvas")]
const read = () => W.layers(all().map(W.canvas))
let canvases = read()
const empty = () => canvases.some((c) => c.state === "blank" || c.state === "flat")
if (empty()) {
  for (let i = 0; i < all().length; i++) if (canvases[i].state === "blank") canvases[i] = await W.poke(all()[i])
  W.layers(canvases)
  const end = Date.now() + 2500
  while (empty() && Date.now() < end) { await W.sleep(250); canvases = read() }
}
result.canvases = canvases
// rendered: the run put elements in the preview; visible: one of them has a box
// (a surface that fills its parent has none when the example gives it no size)
const made = [...well.firstElementChild.querySelectorAll("*")]
result.rendered = made.length > 0
result.visible = made.some((el) => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 })
restore().click()
await W.frames(2)
result.restored = !restore()
const revert = panel.querySelector(".src-key[aria-label^=Revert]")
if (revert) revert.click()
return result
`

const PREVIEW = `
const card = document.querySelectorAll("[data-demo-card]")[arg.n]
card.querySelector("[role=tablist]").querySelectorAll("[role=tab]")[0].click()
await window.__walk.frames(2)
return true
`

/** A long page read top to bottom: every canvas that comes into view, as it
 * stands there. */
const SCROLL = `
const W = window.__walk
const seen = new Map()
const look = () => {
  for (const c of document.querySelectorAll("canvas")) {
    const r = c.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight) continue
    const s = W.canvas(c)
    const was = seen.get(c)
    if (!was || was.state !== "painted") seen.set(c, s)
  }
}
const step = Math.round(innerHeight * 0.6)
let y = 0
for (let i = 0; i < 400; i++) {
  scrollTo(0, y)
  await W.frames(2)
  await W.sleep(arg.pause)
  look()
  if (y >= document.documentElement.scrollHeight - innerHeight - 1) break
  y = Math.min(y + step, document.documentElement.scrollHeight - innerHeight)
}
await W.sleep(600)
look()
for (const [c, s] of seen) {
  if (s.state !== "blank") continue
  c.scrollIntoView({ block: "center" })
  await W.frames(3)
  await W.sleep(arg.pause)
  let now = W.canvas(c)
  if (now.state === "blank") now = await W.poke(c)
  // a layer of a surface whose other canvas is painted
  if (now.state === "blank" && [...c.parentElement.querySelectorAll("canvas")].some((o) => o !== c && W.canvas(o).state === "painted")) now.state = "layer"
  seen.set(c, now)
}
const height = document.documentElement.scrollHeight
scrollTo(0, 0)
return { height, canvases: [...seen.values()], sections: document.querySelectorAll("section[id]").length,
  cards: document.querySelectorAll("[data-demo-card]").length }
`

/** The Studio: a frame added from the library, selected, a property changed
 * in the inspector, undone and redone, search opened. */
const STUDIO = `
const W = window.__walk
const out = { steps: [] }
const step = (name, ok, detail) => out.steps.push({ name, ok: !!ok, detail: detail === undefined ? "" : String(detail).slice(0, 300) })
const named = (label) => [...document.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") || b.textContent.trim()) === label)
const api = await W.until(() => window.ditherStudio, 15000)
step("the Studio answers on window.ditherStudio", api)
if (!api) return out
const doc = () => (typeof api.document === "function" ? api.document() : api.document)
const frames = () => document.querySelectorAll("[data-artboard-id]")
await W.until(() => frames().length, 8000)
await W.sleep(800)
const before = frames().length
step("a frame stands on the canvas", before > 0, before)
const first = W.until(() => { const c = frames()[0] && frames()[0].querySelector("canvas"); return c && W.canvas(c).state === "painted" }, 5000)
step("its chart is painted", await first)

named("Library").click()
const library = await W.until(() => document.querySelector('[role=dialog][aria-label="Component library"]'), 4000)
step("the library opens", library)
if (!library) return out
const items = [...library.querySelectorAll(".library-item")]
const registry = typeof api.registry === "function" ? await api.registry() : api.registry
step("the library lists the registry", registry && items.length >= registry.components.length, items.length + " items")
const pick = items.find((b) => b.textContent.includes("DitherSwitch"))
pick.click()
await W.until(() => frames().length === before + 1, 4000)
step("the library adds a frame", frames().length === before + 1, frames().length)
const added = frames()[frames().length - 1]
const id = added.dataset.artboardId

// select the first frame, then the new one, by its name plate
const side = async () => {
  let s = document.querySelector('aside[aria-label="Properties and layers"]')
  if (!s) { named("Toggle properties and layers").click(); s = await W.until(() => document.querySelector('aside[aria-label="Properties and layers"]'), 4000) }
  return s
}
const panel = await side()
step("the inspector opens", panel)
if (!panel) return out
const press = (el) => {
  const r = el.getBoundingClientRect()
  const at = { bubbles: true, cancelable: true, composed: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1 }
  el.dispatchEvent(new PointerEvent("pointerdown", at))
  el.dispatchEvent(new MouseEvent("mousedown", at))
  el.dispatchEvent(new PointerEvent("pointerup", { ...at, buttons: 0 }))
  el.dispatchEvent(new MouseEvent("mouseup", { ...at, buttons: 0 }))
  el.dispatchEvent(new MouseEvent("click", { ...at, buttons: 0 }))
}
const plate = (frame) => frame.querySelector(".cursor-move") || frame
const nameField = () => panel.querySelector('input[name="artboard-name"]')
press(plate(frames()[0]))
const firstName = await W.until(() => nameField() && nameField().value !== "Switch" && nameField().value, 3000)
step("selecting the first frame shows it in the inspector", firstName, firstName)
press(plate(added))
const second = await W.until(() => nameField() && nameField().value === "Switch", 3000)
step("selecting the new frame shows it in the inspector", second, nameField() && nameField().value)

const mine = () => JSON.stringify((doc().artboards || []).find((a) => a.id === id) || null)
const box = panel.querySelector('input[type=checkbox][name="disabled"]') || [...panel.querySelectorAll("input[type=checkbox]")][0]
step("the inspector offers the component's props", box)
if (!box) return out
// history gathers the edits of 300ms into one step: let the added frame become its own
await W.sleep(700)
const was = mine()
box.click()
await W.sleep(400)
const changed = mine()
step("a property change reaches the document", changed !== was && /"disabled":true/.test(changed), changed.slice(0, 200))
const frameSwitch = () => added.querySelector("[role=switch],button,input")
const disabledNow = () => { const el = frameSwitch(); return !!el && (el.disabled === true || el.getAttribute("aria-disabled") === "true" || el.hasAttribute("disabled")) }
step("and the frame on the canvas", disabledNow())
named("Undo").click()
await W.sleep(400)
step("undo takes it back", mine() === was, mine().slice(0, 200))
named("Redo").click()
await W.sleep(400)
step("redo brings it again", mine() === changed)

const search = [...document.querySelectorAll("button")].find((b) => /^Search/.test(b.textContent.trim()))
search.click()
const palette = await W.until(() => [...document.querySelectorAll("[role=dialog]")].find((d) => d.querySelector("input")), 4000)
step("search opens", palette, palette && (palette.getAttribute("aria-label") || ""))
if (palette) {
  const field = palette.querySelector("input")
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
  set.call(field, "area")
  field.dispatchEvent(new InputEvent("input", { bubbles: true }))
  await W.sleep(400)
  step("search answers a query", palette.innerText.toLowerCase().includes("area"), palette.innerText.slice(0, 120))
  field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
  await W.sleep(300)
}
out.document = JSON.stringify(doc())
// an undo or a redo stands the frames up again: their charts draw in
const drawn = () => W.layers([...document.querySelectorAll("[data-artboard-id] canvas")].map(W.canvas))
await W.until(() => !drawn().some((c) => c.state === "blank"), 5000, 200)
out.canvases = drawn()
return out
`

const PLAY = `
const W = window.__walk
const surface = await W.until(() => document.querySelector(".play-surface, .play-empty"), 8000)
await W.sleep(1200)
const canvases = W.layers([...document.querySelectorAll("canvas")].map(W.canvas))
return { surface: surface ? surface.className.split(" ").find((c) => c === "play-surface" || c === "play-empty") : "", canvases,
  text: document.body.innerText.trim().slice(0, 160), clock: typeof window.ditherClock }
`

// ---------------------------------------------------------------- the walk

const shots = join(out, "shots", engine)
mkdirSync(shots, { recursive: true })
const slug = (page) =>
  `${page.kind === "section" ? page.id : page.kind}${page.variant ? `-${page.variant}` : ""}-${page.theme}${page.device ? `-${page.device}` : ""}`

/** The example's own words for what a run cannot do: an elision the reader
 * fills in, or something only their app has. */
const sketched = (text) => /…|\.\.\.\s*[\]})]/.test(text ?? "")

function codeIssues(code) {
  const issues = []
  if (!code.opened) return ["the Code tab never opened its source panel"]
  const [example, ...rest] = code.files
  if (!example) return ["the source panel shows no file"]
  for (const f of code.files) if (f.error) issues.push(`${f.name}: ${f.error}`)
  for (const f of code.files) if (!f.error && !f.size) issues.push(`${f.name}: empty`)
  const text = example.text ?? ""
  if (/\.tsx$/.test(example.name)) {
    if (
      /<script setup|<template[\s>]|\bv-(if|for|model|show|bind|on)\b|\s@[a-z]+=|\s:[a-z-]+="|defineProps|from "vue"/.test(
        text,
      )
    )
      issues.push(`${example.name}: Vue's notation shows through`)
    if (text.includes('{"{"}')) issues.push(`${example.name}: script or a stylesheet printed as the component's text`)
    if (!/export default function|export function|export const/.test(text))
      issues.push(`${example.name}: no component exported`)
    const imported = new Set(
      [...text.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from/g)].flatMap((m) =>
        m[1].split(",").map((n) =>
          n
            .trim()
            .split(/\s+as\s+/)
            .pop(),
        ),
      ),
    )
    const loose = [...new Set([...text.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]))].filter(
      (t) => KIT.has(t) && !imported.has(t),
    )
    if (loose.length) issues.push(`${example.name} renders ${loose.join(", ")} of the kit without importing it`)
    const kit = /from "@dither-kit[^"]*"/.test(text)
    const kitTabs = rest.filter((f) => f.path.startsWith("dither-kit/") && /\.tsx?$/.test(f.name))
    if (kit && !kitTabs.length) issues.push(`${example.name} imports the kit, yet no kit file is a tab`)
    if (!rest.some((f) => f.name === "theme.css")) issues.push("no theme.css tab")
    if (!rest.some((f) => f.name === "prompt.md")) issues.push("no prompt.md tab")
  } else if (!/\.(sh|ts|css)$/.test(example.name)) issues.push(`unexpected example file ${example.name}`)
  return issues
}

/** Every name the kit's index exports, read from the kit's source as the build serves it. */
const KIT = new Set(
  [
    ...readFileSync(join(root, "kit/src/solid/solid/index.ts"), "utf8").matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g),
  ].flatMap((m) =>
    m[1]
      .split(",")
      .map((n) =>
        n
          .trim()
          .split(/\s+as\s+/)
          .pop(),
      )
      .filter(Boolean),
  ),
)

/** The name a stopped run could not find, when the example itself never
 * declares it: state, data or a component the example leaves to its reader
 * (`rows`, `setTab`, `YourCard`). */
function freeName(stopped, text) {
  const name = /ReferenceError: (?:Can't find variable: )?([A-Za-z_$][\w$]*)/.exec(stopped)?.[1]
  if (!name) return ""
  const word = `(?<![\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`
  const declared = new RegExp(
    `(?:const|let|var)\\s+(?:${word}|\\[[^\\]]*${word}[^\\]]*\\]|\\{[^}]*${word}[^}]*\\})|function\\s+${word}|class\\s+${word}|import[^\\n]*${word}[^\\n]*from`,
  ).test(text)
  return declared ? "" : name
}

async function unreadCanvases(s, ratio, where, canvases, page) {
  // The page could not read these (a WebGL context, a tainted canvas): look
  // at the pixels the browser shows instead.
  for (let i = 0; i < canvases.length; i++) {
    const c = canvases[i]
    if (c.state !== "unread") continue
    const rect = await s.run(CENTRE, { ...where, i })
    if (!rect || rect[2] < 2 || rect[3] < 2) continue
    const png = decodePng(await s.shot())
    const colours = coloursIn(png, rect, png.width / page.w || ratio)
    c.state = colours > 1 ? "painted" : "blank"
    c.by = `screenshot (${colours} colours)`
  }
}

/** The docs' styling switch on a card's Code tab set to `arg.label`, and
 * the example read again once the panel shows it in that system. */
const STYLE = `
const W = window.__walk
const card = document.querySelectorAll("[data-demo-card]")[arg.n]
const panel = card.querySelector(".source-panel-scope")
const group = card.querySelector("[aria-label=Styling]")
if (!panel || !group) return { switched: false, why: "no styling switch" }
const key = [...group.querySelectorAll("button")].find((b) => b.textContent.trim() === arg.label)
if (!key) return { switched: false, why: "no " + arg.label + " key" }
const area = () => panel.querySelector("[role=tabpanel] textarea")
const first = () => panel.querySelector(".src-tab")
if (key.getAttribute("aria-pressed") !== "true") {
  key.click()
  // the panel writes the files again as the choice turns (an example without classes reads the same)
  await W.until(() => key.getAttribute("aria-pressed") === "true", 3000)
  await W.frames(3)
}
const t = first()
if (t && t.getAttribute("aria-selected") !== "true") { t.click(); await W.frames(2) }
const name = t ? t.dataset.path.split("/").pop() : ""
await W.until(() => area() && area().getAttribute("aria-label") === name + " source", 4000)
const run = panel.querySelector(".src-run")
return { switched: key.getAttribute("aria-pressed") === "true", text: area() ? area().value : "", files: [...panel.querySelectorAll(".src-tab")].map((x) => x.dataset.path.split("/").pop()),
  runnable: !!run && run.getAttribute("aria-disabled") !== "true" }
`

/** The Studio at a phone's size: its notice, not the editor. */
const NOTICE = `
const W = window.__walk
const heading = await W.until(() => [...document.querySelectorAll("h1")].find((h) => h.getClientRects().length), 8000)
await W.sleep(400)
return { heading: heading ? heading.textContent.trim() : "", editor: !!document.querySelector("[data-artboard-id],aside[aria-label='Properties and layers']"),
  keys: [...document.querySelectorAll("button,a[href]")].filter((b) => b.getClientRects().length).map((b) => (b.getAttribute("aria-label") || b.textContent).trim()).slice(0, 8) }
`

const blank = (c) => c.state === "blank" || c.state === "flat"

const STEPS = new Map()

/** A Run's record judged: what stops or renders nothing is a finding, named
 * for its card and, past Tailwind, its styling system. */
async function judgeRun(s, ready, page, n, run, text, label, issue) {
  if (run.ran) {
    await unreadCanvases(s, ready.ratio, { n, id: page.id }, run.canvases ?? [], ready)
    const free = run.stopped && freeName(run.stopped, text ?? "")
    if (free && !KIT.has(free)) {
      run.reader = free
      issue("run", `${label}: stops on ${free}, a name the example never declares`)
    } else if (run.stopped) issue("run", `${label}: ${run.stopped}`)
    else if (!run.rendered) issue("run", `${label}: the run rendered nothing`)
    else if (!run.visible) {
      run.unsized = true
      issue("run", `${label}: the run rendered no visible box`)
    }
    for (const c of (run.canvases ?? []).filter(blank))
      issue("run-canvas", `${label}: after Run, a ${c.state} canvas ${c.w}x${c.h} ${c.cls}`)
    if (!run.restored) issue("run", `${label}: the demo was not restored`)
    if (!run.edited) issue("run", `${label}: the edit never marked the file`)
  } else if (run.timeout) issue("run", `${label}: Run never finished (${run.ms}ms)`)
  else if (sketched(text)) {
    run.sketch = true
    issue("run", `${label}: does not compile for an elision it prints`)
  } else issue("run", `${label}: ${run.problems.join(" / ")}`)
}

/** The text in the window, its contrast measured off a screenshot. */
async function sampleContrast(s, rec, ready, issue, at) {
  const samples = await s.run(CONTRAST, { limit: 160 })
  if (!samples?.length) return
  const png = decodePng(await s.shot())
  const { measured, found } = measureContrast(png, samples, png.width / ready.w || ready.ratio)
  rec.contrast.samples += measured
  for (const f of found) {
    if (rec.contrast.seen.has(f)) continue
    rec.contrast.seen.add(f)
    issue("contrast", `${at}: ${f}`)
  }
}

/** The keys a page opens a dialog with that do not say so themselves
 * (`aria-haspopup`), by their names. */
const DIALOG_LABELS = {
  landing: ["Watch the film"],
  studio: [],
}

/** What a screen reader and a keyboard meet on the page (walk-checks.mjs):
 * the page read as assistive technology reads it; on the desktop Tab
 * pressed through it, round to where it began, every stop it reaches
 * showing a mark of focus (a stop whose style focus leaves alone is looked
 * at on screen, focused against unfocused); then each dialog opened by
 * its key from the keyboard, Tabbed through and closed with Escape. At a
 * phone's size the page is read and its menus' dialogs walked. */
async function walkA11y(s, rec, ready, page, issue, url) {
  const read = await s.run(A11Y, null)
  rec.a11y = { counts: read.counts }
  for (const rule of ["names", "ids", "refs", "headings", "landmarks", "images"])
    for (const f of read[rule]) issue(`a11y-${rule}`, f)
  const phoneSized = page.device === "phone"
  if (!phoneSized) {
    const start = await s.run(KEYS_START, null)
    const limit = Math.min(2000, start.stops * 2 + 40)
    let at = { tabs: 0 }
    while (at.tabs < limit) {
      await s.press("Tab", 20)
      at = await s.run(KEYS_READ, null)
      if (at.wrapped) break
      if (at.held) {
        // a field that keeps Tab for itself (a code field's indent) lets go on Escape, as a code editor's does
        await s.press("Escape")
        await s.press("Tab")
        const after = await s.run(KEYS_READ, null)
        if (after.held) {
          issue("a11y-keyboard", `Tab is held by ${at.held}: it never moves on, Escape or not`)
          break
        }
        ;(rec.a11y.released ??= []).push(at.held)
        at = after
      }
    }
    const end = await s.run(KEYS_END, null)
    rec.a11y.keys = { stops: end.stops, reached: end.reached, tabs: at.tabs, round: !!at.wrapped }
    for (const m of end.missed) issue("a11y-reach", `Tab never reaches ${m}`)
    // a stop looked at again as a reader meets it: Tab pressed to it from the stop before, the page settled
    const arrive = async (key) => {
      await s.run(FOCUS_BEFORE, { key })
      await s.press("Tab")
      return s.run(FOCUS_ARRIVED, { key })
    }
    for (const h of end.hidden) {
      // transparent as focus arrived: a scene fading in as Tab scrolls to it shows once it settles
      if (h.why === "transparent") {
        const there = await arrive(h.key)
        if (!there.arrived) continue
        h.why = there.hidden || (there.inView ? "" : "outside the window")
        if (!h.why) continue
      }
      issue("a11y-hidden-focus", `focus lands on ${h.where} (${h.why})`)
    }
    // a stop whose style focus left alone: on screen, focused against unfocused
    // (looked at twice before it is a finding: a busy machine can shoot before a mark is drawn)
    for (const u of end.unmarked.slice(0, 40)) {
      let seen = false
      let looked = false
      for (let attempt = 0; attempt < 2 && !seen; attempt++) {
        const there = await arrive(u.key)
        if (!there.arrived || !there.inView || there.hidden) break
        looked = true
        const on = decodePng(await s.shot())
        await s.run(FOCUS_OFF, null)
        const off = decodePng(await s.shot())
        seen = changedPixels(on, off, there.box, on.width / ready.w || ready.ratio) >= 6
      }
      if (looked && !seen) issue("a11y-focus-mark", `${u.where} shows no mark of focus`)
    }
    if (end.unmarked.length > 40)
      issue("a11y-focus-mark", `${end.unmarked.length - 40} more stops whose style focus leaves alone, not looked at`)
    await s.run(KEYS_DONE, null)
  }
  const arg = {
    labels: phoneSized ? [] : (DIALOG_LABELS[page.kind] ?? []),
    wells: !phoneSized && page.kind === "section",
  }
  let keys = await s.run(DIALOG_KEYS, arg)
  rec.a11y.dialogs = []
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    try {
      if (!(await s.run(DIALOG_FOCUS, { i }))) continue
      await s.press("Enter")
      const opened = await s.run(DIALOG_OPENED, { wait: key.why === "tried" ? 450 : 2000 })
      if (!opened.opened) {
        if (key.why !== "tried") issue("a11y-dialog", dialogFindings({ opener: key.where, opened: false })[0])
        // a menu or a popover it opened instead
        await s.press("Escape")
        continue
      }
      if (opened.modal && opened.stops) {
        await s.press("Tab", opened.stops + 2)
        await s.press("Shift+Tab", opened.stops + 2)
      }
      const escaped = await s.run(DIALOG_TABBED, null)
      await s.press("Escape")
      const closed = await s.run(DIALOG_CLOSED, { i })
      const r = { opener: key.where, ...opened, escaped, ...closed }
      rec.a11y.dialogs.push(r)
      for (const f of dialogFindings(r)) issue("a11y-dialog", f)
      if (!closed.closed) throw new Error("the dialog stayed open")
    } catch (e) {
      // the page as it loaded, to try the next key on
      if (!/stayed open/.test(String(e))) issue("a11y-dialog", `${key.where}: ${String(e?.message ?? e).slice(0, 200)}`)
      await s.go(url)
      await s.run(READY, { settle: 600 })
      keys = await s.run(DIALOG_KEYS, arg)
    }
  }
}

async function walkPage(session, server, page) {
  const started = Date.now()
  const rec = {
    ...page,
    issues: [],
    known: [],
    environment: [],
    outside: [],
    slow: [],
    contrast: { samples: 0, seen: new Set() },
  }
  // a step that takes long is kept with its name: a stalled page explains what it then shows
  const s = {
    ...session,
    async run(body, arg) {
      const at = Date.now()
      try {
        return await session.run(body, arg)
      } finally {
        if (Date.now() - at > 8000) rec.slow.push({ step: STEPS.get(body) ?? "script", ms: Date.now() - at })
      }
    },
  }
  const issue = (kind, detail) =>
    ENVIRONMENT.some((e) => e.test(detail)) ? rec.environment.push(detail) : rec.issues.push({ kind, detail })
  const onPhone = page.device === "phone"
  server.state.theme = page.theme
  server.refused()
  s.drain()
  let url = server.origin + page.path
  // a hash after the same page is no navigation: the page reads its hash as it loads
  if (page.hash) {
    url += page.hash
    await s.go("about:blank")
  }
  await s.go(url)
  const ready = await s.run(READY, { settle: page.kind === "section" ? 500 : 1500 })
  Object.assign(rec, { title: ready.title, w: ready.w, h: ready.h })
  if (onPhone && ready.w !== 390) rec.environment.push(`the phone's window is ${ready.w}px wide in this engine`)
  // the landing and the missing page are printed in the dark, always; the player takes its theme from its link
  if (
    ready.dark !== (page.theme === "dark") &&
    (page.kind === "section" || page.kind === "studio" || page.kind === "docs")
  )
    issue("theme", `asked for ${page.theme}, the page is ${ready.dark ? "dark" : "light"}`)
  if (ready.overflow > 1 && !onPhone) issue("overflow", `the page is ${ready.overflow}px wider than the window`)
  // the code and its runs are walked once, on the desktop in the dark; contrast in both themes, on the desktop
  const full = page.theme === "dark" && !onPhone
  const measure = contrast && !onPhone
  // what the page was refused before each Run, kept apart from what a run's own example asks for
  const held = { refused: [], failed: [], native: [] }

  if (page.kind === "section") {
    const found = await s.run(CARDS, { id: page.id })
    if (found.missing) issue("section", `no section #${page.id} on its page`)
    else {
      rec.heading = found.heading
      if (found.text < 40) issue("section", "the section is empty")
      rec.cards = []
      if (page.sample) writeFileSync(join(shots, `${slug(page)}.png`), await s.shot())
      if (measure) await sampleContrast(s, rec, ready, issue, "top")
      const wells = found.cards.map((section, n) => ({ n, section })).filter((w) => w.section)
      if (found.loose) wells.push({ n: -1, section: page.id })
      for (const { n, section } of wells) {
        const card = { n, section, ...(await s.run(CARD, { n, id: page.id, settle: 350, patience: 4000 })) }
        await unreadCanvases(s, ready.ratio, { n, id: page.id }, card.canvases ?? [], ready)
        rec.cards.push(card)
        const name = n < 0 ? "outside a card" : `card ${n + 1}${section === page.id ? "" : ` (#${section})`}`
        if (card.missing) issue("card", `${name}: gone`)
        else {
          if (!card.revealed) issue("card", `${name}: never revealed its demo`)
          else if (n >= 0 && !card.rendered) issue("card", `${name}: an empty preview`)
          if (card.alert && /stopped|error/i.test(card.alert)) issue("card", `${name}: ${card.alert}`)
          for (const c of card.canvases.filter(blank))
            issue("canvas", `${name}: a ${c.state} canvas ${c.w}x${c.h} (${c.rect[2]}x${c.rect[3]} css) ${c.cls}`)
        }
        if (page.sample && n === wells[0].n) writeFileSync(join(shots, `${slug(page)}-card.png`), await s.shot())
        if (measure && n >= 0 && !card.missing) await sampleContrast(s, rec, ready, issue, `${name} in view`)
        if (n < 0 || !full || card.missing) continue
        const code = await s.run(CODE, { n })
        const example = code.files?.[0]
        card.code = { ...code, files: code.files?.map(({ text, ...f }) => f) }
        card.example = example?.text
        for (const problem of codeIssues(code)) issue("code", `${name}: ${problem}`)
        const mayRun = runMode === "all" || (runMode === "family" && page.first && n === 0)
        if (code.opened && mayRun && code.runnable) {
          card.runs = {}
          for (const style of styles) {
            // the example in this styling system, as the docs' switch shows it
            let text = example?.text
            if (style !== "tailwind") {
              const switched = await s.run(STYLE, { n, label: STYLE_LABELS[style] })
              if (!switched.switched) {
                issue("run", `${name} (${STYLE_LABELS[style]}): ${switched.why || "the styling switch never turned"}`)
                continue
              }
              if (!switched.runnable) {
                issue("run", `${name} (${STYLE_LABELS[style]}): Run is offered in Tailwind and not here`)
                continue
              }
              text = switched.text
            }
            const label = style === "tailwind" ? name : `${name} (${STYLE_LABELS[style]})`
            const before = [server.refused(), await s.run(RECORD_FAILED, null), s.drain()]
            const run = await s.run(RUN, { n, settle: 350, patience: 45000 })
            card.runs[style] = run
            if (style === "tailwind") card.run = run
            // what the example asks for and the site does not hold: its own illustrative addresses
            const failed = await s.run(RECORD_FAILED, null)
            for (const f of failed.filter(unplayable)) rec.environment.push(`this engine does not play ${f}`)
            const asked = new Set([
              ...server.refused().map((r) => r.url),
              ...failed.filter((f) => !unplayable(f)).map((f) => f.split(" ").pop()),
            ])
            const during = s
              .drain()
              .filter(
                (d) => !(d.kind === "response" || d.kind === "requestfailed" || /Failed to load resource/.test(d.text)),
              )
            // every example runs as written: an address the site does not hold is a finding
            if (asked.size) {
              run.asked = [...asked].map((u) => u.split(server.origin).join(""))
              issue("run", `${label}: asks for ${run.asked.join(", ")}, which the site does not hold`)
            }
            held.refused.push(...before[0])
            held.failed.push(...before[1])
            held.native.push(...before[2], ...during)
            await judgeRun(s, ready, page, n, run, text, label, issue)
          }
          // the next card's files are read as authored
          if (styles.some((st) => st !== "tailwind")) await s.run(STYLE, { n, label: STYLE_LABELS.tailwind })
        }
        if (code.opened) await s.run(PREVIEW, { n })
      }
      if (!found.cards.includes(page.id) && !found.loose) rec.bare = true
    }
  } else if (page.kind === "landing" || page.kind === "docs" || page.kind === "missing") {
    writeFileSync(join(shots, `${slug(page)}.png`), await s.shot())
    const read = await s.run(SCROLL, { pause: page.kind === "docs" ? 250 : 450 })
    rec.height = read.height
    rec.canvases = read.canvases
    for (const c of read.canvases.filter(blank)) issue("canvas", `a ${c.state} canvas ${c.w}x${c.h} ${c.cls}`)
    if (measure) {
      // the page read where a reader stops: a window at a time, top to bottom, at rest
      const stops = Math.min(16, Math.ceil(read.height / ready.h))
      for (let i = 0; i < stops; i++) {
        await s.run(
          `scrollTo(0, ${Math.round((i * (read.height - ready.h)) / Math.max(1, stops - 1))}); await window.__walk.sleep(1100)`,
          null,
        )
        await sampleContrast(s, rec, ready, issue, `window ${i + 1}`)
      }
      await s.run("scrollTo(0, 0)", null)
    }
  } else if (page.kind === "studio" && onPhone) {
    const notice = await s.run(NOTICE, null)
    rec.notice = notice
    if (notice.editor) issue("studio", "at a phone's size the editor stands, not the notice")
    if (!notice.heading) issue("studio", "at a phone's size no notice shows")
    writeFileSync(join(shots, `${slug(page)}.png`), await s.shot())
  } else if (page.kind === "studio") {
    const studio = await s.run(STUDIO, null)
    rec.steps = studio.steps
    rec.document = studio.document
    rec.canvases = studio.canvases
    for (const st of studio.steps.filter((x) => !x.ok))
      issue("studio", `${st.name}${st.detail ? `: ${st.detail}` : ""}`)
    for (const c of (studio.canvases ?? []).filter(blank)) issue("canvas", `a ${c.state} canvas ${c.w}x${c.h} ${c.cls}`)
    if (measure) await sampleContrast(s, rec, ready, issue, "the Studio")
    writeFileSync(join(shots, `${slug(page)}.png`), await s.shot())
  } else if (page.kind === "play") {
    const play = await s.run(PLAY, null)
    Object.assign(rec, play)
    const want = page.hash ? "play-surface" : "play-empty"
    if (play.surface !== want)
      issue("play", `expected ${want}, the page shows ${play.surface || "nothing"}: ${play.text}`)
    if (play.clock !== "object") issue("play", "no window.ditherClock")
    if (page.hash && !play.canvases.some((c) => c.state === "painted"))
      issue("canvas", "the played frame painted no canvas")
    if (measure) await sampleContrast(s, rec, ready, issue, "the player")
    writeFileSync(join(shots, `${slug(page)}.png`), await s.shot())
  }

  if (a11y && page.theme === "dark") await walkA11y(s, rec, ready, page, issue, url)

  if (onPhone) {
    // the page at a phone's size, every card revealed above
    const p = await s.run(PHONE, null)
    rec.phone = p.counts
    if (p.overflow > 1)
      issue(
        "phone-overflow",
        `the page is ${p.overflow}px wider than the window${p.wide.length ? `: ${p.wide.join("; ")}` : ""}`,
      )
    for (const t of p.targets) issue("phone-target", `${t}, under 24px and crowded`)
    for (const f of p.fields) issue("phone-field", `${f}: under 16px, so focusing it zooms the page`)
    for (const c of p.clipped) issue("phone-clipped", c)
    for (const sp of p.spills) issue("phone-spill", sp)
  }

  const seen = await s.run(RECORD, null)
  const known = KNOWN_REFUSALS[page.kind] ?? []
  const isKnown = (text) => known.some((k) => k.test(text.split(" ").pop().split(/[?#]/)[0]))
  const origin = server.origin
  const strip = (t) => t.split(origin).join("")
  for (const e of seen.errors) issue("error", strip(e))
  for (const l of seen.logs) {
    if (/Failed to load resource/.test(l)) continue
    issue(l.startsWith("warn") ? "warning" : "console", strip(l))
  }
  const refused = new Set()
  for (const r of [...held.refused, ...server.refused()]) refused.add(`${r.status} ${r.url}`)
  for (const f of [...held.failed, ...seen.failed])
    if (unplayable(f)) rec.environment.push(`this engine does not play ${strip(f)}`)
    else refused.add(`failed ${strip(f)}`)
  for (const n of [...held.native, ...s.drain()]) {
    const text = strip(n.text)
    if (n.kind === "pageerror") {
      if (
        !seen.errors.some((e) =>
          e.includes(
            text
              .split("\n")[0]
              .replace(/^Error: /, "")
              .slice(0, 60),
          ),
        )
      )
        issue("error", text)
    } else if (n.kind === "requestfailed") {
      // a request the page itself gave up (a preload it navigated away from) is no failure
      if (!/ERR_ABORTED/.test(text)) refused.add(`failed ${text}`)
    } else if (n.kind === "response") refused.add(text)
    else if (/Failed to load resource/.test(text)) continue
    else if (!seen.logs.some((l) => l.slice(l.indexOf(": ") + 2, 80) === text.slice(0, 80 - l.indexOf(": ") - 2)))
      issue(n.kind === "console.warning" ? "warning" : "console", text)
  }
  // another host's answer is not this site's: a machine behind a network policy reaches none
  const outside = (text) => /https?:\/\//.test(text)
  for (const r of refused) {
    if (outside(r)) rec.outside.push(r)
    else if (isKnown(r)) rec.known.push(r)
    else rec.issues.push({ kind: "request", detail: r })
  }
  if (rec.issues.length && page.kind === "section")
    writeFileSync(join(shots, `${slug(page)}-flagged.png`), await s.shot())
  rec.contrast = rec.contrast.samples
  rec.ms = Date.now() - started
  return rec
}

/** The player given a frame: the Studio's own document, as the Studio's
 * preview link carries it. */
function playPage(document) {
  const doc = JSON.parse(document)
  const first = doc.artboards[0]
  const encoded = Buffer.from(JSON.stringify({ artboards: [first] }), "utf8").toString("base64url")
  return {
    kind: "play",
    variant: "frame",
    path: "/play/",
    theme: "dark",
    hash: `#doc=${encoded}&artboard=${encodeURIComponent(first.id)}&theme=dark`,
  }
}

for (const [name, body] of Object.entries({
  READY,
  CARDS,
  CARD,
  CENTRE,
  CODE,
  RUN,
  STYLE,
  PREVIEW,
  SCROLL,
  STUDIO,
  NOTICE,
  PLAY,
  PHONE,
  CONTRAST,
  A11Y,
  KEYS_START,
  KEYS_END,
  DIALOG_KEYS,
}))
  STEPS.set(body, name.toLowerCase())

const driver = await openEngine()
const queue = plan()
const total = queue.length
const records = []
let done = 0
const started = Date.now()
console.error(`${engine}: ${total} pages, ${jobs} at once, from ${root}`)

async function worker() {
  const server = await serve(root)
  // one window a device, opened when a page first needs it
  const windows = new Map()
  const open = async (device) => {
    if (!windows.has(device)) windows.set(device, await driver.session(device))
    return windows.get(device)
  }
  while (queue.length) {
    const page = queue.shift()
    const device = page.device ?? "desktop"
    let s = await open(device)
    let rec
    for (let attempt = 0; attempt < 2 && !rec; attempt++) {
      try {
        rec = await walkPage(s, server, page)
      } catch (e) {
        if (attempt === 1)
          rec = {
            ...page,
            issues: [{ kind: "walk", detail: String(e?.stack ?? e).slice(0, 600) }],
            known: [],
            environment: [],
            outside: [],
            slow: [],
          }
        // a session that died takes a new one
        await s.close().catch(() => {})
        windows.delete(device)
        s = await open(device)
      }
    }
    // A page that stalled and then showed an empty canvas is walked once more:
    // on a machine drawing in software a renderer can hang for seconds. The
    // first walk stays in the record.
    if (rec.slow?.length && rec.issues.some((x) => x.kind === "canvas" || x.kind === "run-canvas")) {
      const first = { slow: rec.slow, issues: rec.issues }
      rec = await walkPage(s, server, page).catch(() => rec)
      rec.stalled = first
    }
    records.push(rec)
    if (page.kind === "studio" && page.theme === "dark" && rec.document) {
      queue.push(playPage(rec.document))
      if (phone) queue.push({ ...playPage(rec.document), device: "phone", sample: true })
    }
    done++
    const bad = rec.issues.length ? ` ${rec.issues.length} finding(s)` : ""
    console.error(
      `[${done}/${total}] ${page.path}${page.hash ? "#doc" : ""} ${page.theme}${page.device ? ` ${page.device}` : ""} ${rec.ms ?? "?"}ms${bad}`,
    )
  }
  for (const w of windows.values()) await w.close().catch(() => {})
  await server.close()
}
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, worker))
const version = driver.version
await driver.close()

// ---------------------------------------------------------------- the report

const key = (p) => `${p.path}|${p.theme}|${p.device ?? ""}`
const order = plan().map(key)
records.sort((a, b) => order.indexOf(key(a)) - order.indexOf(key(b)))

// Which registry components a docs example renders: a JSX tag in an
// example's own file, on a page the walk read.
const tags = new Set()
for (const r of records)
  for (const c of r.cards ?? []) for (const m of (c.example ?? "").matchAll(/<([A-Z][A-Za-z0-9]*)/g)) tags.add(m[1])
const lower = new Set([...tags].map((t) => t.toLowerCase()))
const chartTag = (t) => lower.has(`${t}chart`)
const widgetTag = (t) => lower.has(`dither${t}`)
const coverage = {
  components: registry.components.length,
  never: registry.components.filter((c) => !tags.has(c.is)).map((c) => c.is),
  charts: registry.charts.filter((t) => !chartTag(t)),
  widgets: registry.widgets.filter((t) => !widgetTag(t)),
}

const kinds = {}
for (const r of records) for (const i of r.issues) kinds[i.kind] = (kinds[i.kind] ?? 0) + 1
const slow = records
  .filter((r) => r.slow?.length)
  .map((r) => `${r.path} (${r.slow.map((x) => `${x.step} ${Math.round(x.ms / 1000)}s`).join(", ")})`)
const again = records.filter((r) => r.stalled).map((r) => `${r.path} (${r.theme}${r.device ? `, ${r.device}` : ""})`)
const desk = records.filter((r) => !r.device)
const phones = records.filter((r) => r.device === "phone")
const cards = desk.filter((r) => r.theme === "dark").flatMap((r) => (r.cards ?? []).filter((c) => c.n >= 0))
const runs = cards.filter((c) => c.run)
const sum = (list, f) => list.reduce((n, r) => n + (f(r) ?? 0), 0)
/** Each styling system's runs: how many, how many ran to a rendered result. */
const byStyle = Object.fromEntries(
  styles.map((st) => {
    const these = cards.map((c) => c.runs?.[st]).filter(Boolean)
    const clean = these.filter((r) => r.ran && !r.stopped && r.rendered && r.visible && !r.reader)
    return [st, { runs: these.length, ran: these.filter((r) => r.ran).length, rendered: clean.length }]
  }),
)
const totals = {
  pages: records.length,
  sections: desk.filter((r) => r.kind === "section" && r.theme === "dark").length,
  light: desk.filter((r) => r.kind === "section" && r.theme === "light").length,
  phone: {
    pages: phones.length,
    targets: sum(phones, (r) => r.phone?.targets),
    fields: sum(phones, (r) => r.phone?.fields),
    boxes: sum(phones, (r) => r.phone?.boxes),
    wells: sum(phones, (r) => r.phone?.wells),
  },
  contrast: {
    dark: sum(
      desk.filter((r) => r.theme === "dark"),
      (r) => r.contrast,
    ),
    light: sum(
      desk.filter((r) => r.theme === "light"),
      (r) => r.contrast,
    ),
  },
  styles: byStyle,
  cards: cards.length,
  canvases: records.reduce(
    (n, r) => n + (r.canvases?.length ?? 0) + (r.cards ?? []).reduce((m, c) => m + (c.canvases?.length ?? 0), 0),
    0,
  ),
  codeTabs: cards.filter((c) => c.code?.opened).length,
  files: cards.reduce((n, c) => n + (c.code?.files?.length ?? 0), 0),
  runs: runs.length,
  ran: runs.filter((c) => c.run.ran).length,
  sketches: runs.filter((c) => c.run.sketch).length,
  readers: runs.filter((c) => c.run.reader).length,
  unsized: [
    ...new Set(
      cards.flatMap((c) =>
        Object.values(c.runs ?? {})
          .filter((r) => r.unsized)
          .map(() => c.section),
      ),
    ),
  ],
  asked: [...new Set(cards.flatMap((c) => Object.values(c.runs ?? {}).flatMap((r) => r.asked ?? [])))],
  notComponents: cards.filter((c) => c.code?.opened && !c.code.runnable).length,
  bare: [...new Set(records.filter((r) => r.bare).map((r) => r.id))],
  findings: kinds,
  known: records.reduce((n, r) => n + r.known.length, 0),
  environment: records.reduce((n, r) => n + r.environment.length, 0),
  outside: [...new Set(records.flatMap((r) => r.outside.map((o) => `${o.split(" ").pop()} (${r.id ?? r.kind})`)))],
  minutes: Math.round((Date.now() - started) / 6000) / 10,
}
const report = {
  engine,
  version,
  root,
  date: new Date().toISOString(),
  totals,
  coverage,
  pages: records.map(({ document, ...r }) => r),
}
writeFileSync(join(out, `${engine}.json`), JSON.stringify(report, null, 1))

const md = [
  `# The walk in ${version}`,
  "",
  `${totals.pages} pages in ${totals.minutes} min: ${totals.sections} docs sections in dark, ${totals.light} again in light, the landing, the docs index, the Studio, the player and a missing address; ${totals.phone.pages} of them again at a phone's size.`,
  "",
  `- at a phone's size: ${totals.phone.targets} targets, ${totals.phone.fields} fields, ${totals.phone.boxes} boxes that hide their overflow and ${totals.phone.wells} demo wells checked`,
  `- contrast: ${totals.contrast.dark} text runs measured in dark, ${totals.contrast.light} in light`,
  `- Run by styling system: ${Object.entries(byStyle)
    .map(([st, v]) => `${STYLE_LABELS[st]} ${v.rendered} of ${v.runs} rendered`)
    .join(", ")}`,
  `- demo cards: ${totals.cards}; canvases read: ${totals.canvases}`,
  `- Code tabs opened: ${totals.codeTabs} (${totals.files} files read)`,
  `- Run: ${totals.ran} of ${totals.runs} examples compiled and ran, ${totals.ran - totals.readers} of them to a rendered result; ${totals.readers} stopped on a name the example leaves to its reader; ${totals.sketches} did not compile for an elision they print; ${totals.notComponents} are not components (a command, a module, a stylesheet)`,
  `- runs that rendered with no visible box (a surface that fills a parent the example does not size): ${totals.unsized.length ? totals.unsized.join(", ") : "none"}`,
  `- addresses a run's own example asked for and the site does not hold: ${totals.asked.length ? totals.asked.join(", ") : "none"}`,
  `- other hosts a page asked and did not reach: ${totals.outside.length ? totals.outside.join(", ") : "none"}`,
  `- steps that took over 8s: ${slow.length ? slow.join(", ") : "none"}`,
  `- pages walked twice, the first walk having stalled and shown an empty canvas: ${again.length ? again.join(", ") : "none"}`,
  `- sections without a demo card: ${totals.bare.length ? totals.bare.join(", ") : "none"}`,
  `- known refusals: ${totals.known}; messages of this machine or of the walk's own pointer, not the page: ${totals.environment}`,
  `- findings: ${
    Object.keys(kinds).length
      ? Object.entries(kinds)
          .map(([k, n]) => `${k} ${n}`)
          .join(", ")
      : "none"
  }`,
  "",
  "## Findings",
  "",
  ...(records.some((r) => r.issues.length)
    ? records
        .filter((r) => r.issues.length)
        .flatMap((r) => [
          `- \`${r.path}\` (${r.theme}${r.device ? `, ${r.device}` : ""})`,
          ...r.issues.map((i) => `  - ${i.kind}: ${i.detail.replace(/\s+/g, " ").slice(0, 400)}`),
        ])
    : ["None."]),
  "",
  "## Examples that stop on a name they leave to the reader",
  "",
  records.some((r) => (r.cards ?? []).some((c) => c.run?.reader))
    ? records
        .flatMap((r) => (r.cards ?? []).filter((c) => c.run?.reader).map((c) => `${r.id} (${c.run.reader})`))
        .join(", ")
    : "None.",
  "",
  "## Registry components no docs example renders",
  "",
  coverage.never.length ? coverage.never.join(", ") : "None: every registry component is a tag in a docs example.",
  ...(coverage.charts.length ? ["", `Charts: ${coverage.charts.join(", ")}`] : []),
  ...(coverage.widgets.length ? ["", `Widgets: ${coverage.widgets.join(", ")}`] : []),
  "",
].join("\n")
writeFileSync(join(out, `${engine}.md`), md)
console.error(`\n${md}\nwritten to ${out}`)
await sleep(50)
process.exit(Object.keys(kinds).length ? 1 : 0)
