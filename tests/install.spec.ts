// The site as an installable app that opens offline: the manifest and the
// icons the build draws from the brand mark (`app/install-files.ts`), the
// head every route carries for them, and the service worker's rules
// (`app/offline.ts`).
import { readFileSync } from "node:fs"
import { inflateSync } from "node:zlib"
import { describe, expect, it } from "rstack/test"
import { ICONS, INSTALL_HEAD, INSTALL_INK, faviconSvg, installFiles, webManifest } from "@/app/install-files"
import { OFFLINE, cacheName, pageAssets, shellFor, strategyFor } from "@/app/offline"
import { MARK_CELLS } from "@/shared/ui/brand-mark"

const root = new URL("..", import.meta.url).pathname
const read = (f: string) => readFileSync(`${root}/${f}`, "utf8")

/** A PNG the encoder wrote (8-bit RGBA, unfiltered rows) back to its pixels. */
function decode(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset)
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  let at = 8
  const idat: Uint8Array[] = []
  while (at < bytes.length) {
    const length = view.getUint32(at)
    const type = new TextDecoder().decode(bytes.subarray(at + 4, at + 8))
    if (type === "IDAT") idat.push(bytes.subarray(at + 8, at + 8 + length))
    at += 12 + length
  }
  const rows = inflateSync(Buffer.concat(idat))
  const pixel = (x: number, y: number) => {
    const i = y * (width * 4 + 1) + 1 + x * 4
    return `#${[...rows.subarray(i, i + 3)].map((v) => v.toString(16).padStart(2, "0")).join("")}`
  }
  return { width, height, pixel }
}

describe("the install surface", () => {
  const files = installFiles()

  it("wears the landing's ground and ink and the kit's ember", () => {
    const landing = read("src/pages/landing/chapters.css")
    expect(INSTALL_INK.ground).toBe(landing.match(/--background: (#[0-9a-f]{6});/)![1])
    expect(INSTALL_INK.ink).toBe(landing.match(/--foreground: (#[0-9a-f]{6});/)![1])
    const [, r, g, b] = read("dither-kit/engine/theme.css").match(
      /^\.dark \{[^}]*--swatch-orange: rgb\((\d+), (\d+), (\d+)\)/m,
    )!
    expect(INSTALL_INK.ember).toBe(`#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`)
  })

  it("installs standalone from wherever the site is served, with its icons and the other routes as shortcuts", () => {
    const m = JSON.parse(webManifest())
    expect(m).toMatchObject({ start_url: ".", scope: ".", id: ".", display: "standalone", name: "dither-ui" })
    expect(m.background_color).toBe(INSTALL_INK.ground)
    expect(m.theme_color).toBe(INSTALL_INK.ground)
    const sizes = m.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`)
    expect(sizes).toEqual(expect.arrayContaining(["192x192 any", "512x512 any", "512x512 maskable"]))
    for (const icon of m.icons) expect(files[icon.src]).toBeInstanceOf(Uint8Array)
    // A shortcut opens one of the build's own routes, relative to the scope.
    const config = read("rstack.config.ts")
    expect(m.shortcuts.map((s: { url: string }) => s.url)).toEqual(["docs/", "studio/"])
    for (const s of m.shortcuts) expect(config).toContain(`"${s.url}index"`)
  })

  it("draws every icon from the brand mark: its cells whole and centred, the core in the ember", () => {
    for (const icon of ICONS) {
      const { width, height, pixel } = decode(files[icon.path] as Uint8Array)
      expect([width, height]).toEqual([icon.size, icon.size])
      const c = Math.floor(icon.size / 2)
      expect(pixel(c, c)).toBe(INSTALL_INK.ember)
      expect(pixel(0, 0)).toBe(INSTALL_INK.ground)
      // The cell above the core is bone; the corners of the mark's square are ground.
      const cell = Math.max(1, Math.floor((icon.size * icon.span) / 7))
      expect(pixel(c, c - cell)).toBe(INSTALL_INK.ink)
    }
  })

  it("keeps a maskable icon's mark inside the safe circle a launcher crops to", () => {
    const icon = ICONS.find((i) => "purpose" in i && i.purpose === "maskable")!
    const { pixel } = decode(files[icon.path] as Uint8Array)
    const c = icon.size / 2
    let reach = 0
    for (let y = 0; y < icon.size; y += 2)
      for (let x = 0; x < icon.size; x += 2)
        if (pixel(x, y) !== INSTALL_INK.ground) reach = Math.max(reach, Math.hypot(x - c, y - c))
    expect(reach).toBeLessThanOrEqual(icon.size * 0.4)
  })

  it("sets the tab's vector icon as the mark's cells", () => {
    const svg = faviconSvg()
    expect(svg.match(/<rect x=/g)).toHaveLength(MARK_CELLS.length)
    expect(svg.split(INSTALL_INK.ember)).toHaveLength(2)
  })

  it("points every route's head at the manifest, the icons and iOS's app tags, from one table", () => {
    const rels = INSTALL_HEAD.map((t) => ("rel" in t.attrs ? t.attrs.rel : t.attrs.name))
    expect(rels).toEqual(
      expect.arrayContaining(["manifest", "icon", "apple-touch-icon", "apple-mobile-web-app-capable"]),
    )
    for (const t of INSTALL_HEAD) if ("href" in t.attrs) expect(files[t.attrs.href]).toBeDefined()
    // The templates no longer carry their own copies.
    for (const page of ["index.html", "docs/index.html", "studio/index.html"])
      expect(read(page)).not.toMatch(/rel="(icon|apple-touch-icon|manifest)"/)
  })
})

describe("the service worker's rules", () => {
  const scope = new URL("https://dither-ui.com/")
  const ask = (mode = "no-cors", method = "GET", range = false) => ({ method, mode, range })
  const at = (path: string) => new URL(path, scope)

  it("answers pages network first, hashed assets from the cache, the rest stale while it refreshes", () => {
    expect(strategyFor(at("docs/button"), scope, ask("navigate"))).toBe("page")
    expect(strategyFor(at("static/js/index.1a2b.js"), scope, ask())).toBe("static")
    expect(strategyFor(at("favicon.svg"), scope, ask())).toBe("asset")
    expect(strategyFor(at("site.webmanifest"), scope, ask())).toBe("asset")
  })

  it("leaves the film, the cards, the player, other origins, writes and range reads to the network", () => {
    for (const path of ["trailer/dither-ui.mp4", "og/home.gif", "embed/home.json", "play/", "sw.js"])
      expect(strategyFor(at(path), scope, ask())).toBe("network")
    expect(strategyFor(new URL("https://fonts.example/a.woff2"), scope, ask())).toBe("network")
    expect(strategyFor(at("static/js/a.js"), scope, ask("cors", "POST"))).toBe("network")
    expect(strategyFor(at("static/a.mp4"), scope, ask("no-cors", "GET", true))).toBe("network")
  })

  it("keeps to its scope when the site is served under a base path", () => {
    const base = new URL("https://drvova.github.io/dither-ui/")
    expect(strategyFor(new URL("https://drvova.github.io/other/x.js"), base, ask())).toBe("network")
    expect(strategyFor(new URL("static/js/a.js", base), base, ask())).toBe("static")
    expect(shellFor(new URL("docs/slider", base), base)).toBe("docs/")
  })

  it("opens a page never kept on its own route's shell", () => {
    expect(shellFor(at("docs/slider"), scope)).toBe("docs/")
    expect(shellFor(at("studio/"), scope)).toBe("studio/")
    expect(shellFor(at("anything"), scope)).toBe("")
    for (const route of OFFLINE.shell) expect(shellFor(at(route), scope)).toBe(route)
  })

  it("keeps the build assets a shell page loads, and only those", () => {
    const html = `<script defer src="/static/js/index.1.js"></script><link href="/static/css/index.2.css" rel="stylesheet">
      <link rel="icon" href="/favicon.svg"><a href="/docs/">docs</a><img src="https://cdn.example/x.png">`
    expect(pageAssets(html, at("docs/"), scope)).toEqual([
      at("static/js/index.1.js").href,
      at("static/css/index.2.css").href,
    ])
  })

  it("names its caches by version, so a new one drops the old", () => {
    expect(cacheName("pages")).toBe(`dither-ui-pages-v${OFFLINE.version}`)
    expect(new Set(Object.keys(OFFLINE.caches).map((k) => cacheName(k as keyof typeof OFFLINE.caches))).size).toBe(3)
  })
})
