// The Studio as an installable app that opens offline (the landing and the
// docs stay pages of the web): the manifest and the icons the build draws
// from the brand mark (`app/install-files.ts`), the head each route carries,
// and the service worker's rules (`app/offline.ts`).
import { existsSync, readFileSync } from "node:fs"
import { crc32, inflateSync } from "node:zlib"
import { describe, expect, it } from "rstack/test"
import {
  ICONS,
  INSTALL_INK,
  MANIFEST,
  STUDIO_GROUND,
  faviconSvg,
  installFiles,
  APP_HEAD,
  ICON_HEAD,
  webManifest,
} from "@/app/install-files"
import { OFFLINE, cacheName, inApp, pageAssets, strategyFor } from "@/app/offline"
import { MARK_CELLS } from "@/shared/ui/brand-mark"

const root = new URL("../../..", import.meta.url).pathname
const read = (f: string) => readFileSync(`${root}/${f}`, "utf8")

/** A PNG the encoder wrote (8-bit RGBA, unfiltered rows) back to its pixels,
 * every chunk's CRC checked against zlib's own. */
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
    expect(view.getUint32(at + 8 + length), type).toBe(crc32(bytes.subarray(at + 4, at + 8 + length)))
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

  it("wears the landing's ground and ink and the kit's ember, and the Studio's own ground as the app", () => {
    const landing = read("packages/site/src/pages/landing/chapters.css")
    expect(INSTALL_INK.ground).toBe(landing.match(/--background: (#[0-9a-f]{6});/)![1])
    expect(INSTALL_INK.ink).toBe(landing.match(/--foreground: (#[0-9a-f]{6});/)![1])
    const [, r, g, b] = read("packages/dither-kit/src/engine/theme.css").match(
      /^\.dark \{[^}]*--swatch-orange: rgb\((\d+), (\d+), (\d+)\)/m,
    )!
    expect(INSTALL_INK.ember).toBe(`#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`)
    // The Studio's route names its chrome's colour from the same constant.
    expect(read("packages/site/src/routes/studio.tsx")).toContain("createSignal<string>(STUDIO_GROUND)")
  })

  it("installs the Studio, standalone, from its own folder under whatever base the site is served", () => {
    const m = JSON.parse(webManifest())
    expect(MANIFEST).toBe(`${OFFLINE.app}app.webmanifest`)
    expect(m).toMatchObject({ start_url: ".", scope: ".", id: ".", display: "standalone", short_name: "Studio" })
    expect(m.background_color).toBe(STUDIO_GROUND)
    expect(m.theme_color).toBe(STUDIO_GROUND)
    const sizes = m.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`)
    expect(sizes).toEqual(expect.arrayContaining(["192x192 any", "512x512 any", "512x512 maskable"]))
    // Each icon resolves from the manifest's folder to a file the build ships.
    for (const icon of m.icons) {
      const path = new URL(icon.src, `https://x/${MANIFEST}`).pathname.slice(1)
      expect(files[path]).toBeInstanceOf(Uint8Array)
    }
    // The app is one of the build's own routes.
    expect(existsSync(`${root}/packages/site/src/routes/${OFFLINE.app.replace(/\/$/, "")}.tsx`)).toBe(true)
  })

  it("draws every icon from the brand mark: its cells whole and centred, the core in the ember", () => {
    for (const icon of ICONS) {
      const { width, height, pixel } = decode(files[icon.path] as Uint8Array)
      expect([width, height]).toEqual([icon.size, icon.size])
      const c = Math.floor(icon.size / 2)
      expect(pixel(c, c)).toBe(INSTALL_INK.ember)
      expect(pixel(0, 0)).toBe(INSTALL_INK.ground)
      // The cell above the core is bone.
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

  it("gives every route the icons and only the Studio the manifest and iOS's app tags", () => {
    const of = (head: typeof ICON_HEAD) => head.map((t) => t.attrs.rel ?? t.attrs.name)
    expect(of(ICON_HEAD)).toEqual(["icon", "icon", "apple-touch-icon"])
    expect(of(APP_HEAD)).toEqual(expect.arrayContaining(["manifest", "apple-mobile-web-app-capable"]))
    for (const t of [...ICON_HEAD, ...APP_HEAD]) if (t.attrs.href) expect(files[t.attrs.href]).toBeDefined()
  })
})

describe("the service worker's rules", () => {
  const site = new URL("https://dither-ui.com/")
  const ask = (mode = "no-cors", method = "GET", range = false) => ({ method, mode, range })
  const at = (path: string) => new URL(path, site)

  it("registers on the Studio only", () => {
    expect(inApp("/studio")).toBe(true)
    expect(inApp("/studio/")).toBe(true)
    for (const path of ["/", "/docs", "/docs/slider", "/studios"]) expect(inApp(path)).toBe(false)
  })

  it("answers pages network first, hashed assets from the cache, the rest stale while it refreshes", () => {
    expect(strategyFor(at("studio/"), site, ask("navigate"))).toBe("page")
    expect(strategyFor(at("_build/assets/index-1a2b.js"), site, ask())).toBe("static")
    expect(strategyFor(at("favicon.svg"), site, ask())).toBe("asset")
    expect(strategyFor(at("kit/src/solid/files.json"), site, ask())).toBe("asset")
  })

  it("leaves the film, the cards, the player, other origins, writes and range reads to the network", () => {
    for (const path of ["trailer/dither-ui.mp4", "og/home.gif", "embed/home.json", "play/", "sw.js"])
      expect(strategyFor(at(path), site, ask())).toBe("network")
    expect(strategyFor(new URL("https://fonts.example/a.woff2"), site, ask())).toBe("network")
    expect(strategyFor(at("_build/assets/a.js"), site, ask("cors", "POST"))).toBe("network")
    expect(strategyFor(at("_build/assets/a.mp4"), site, ask("no-cors", "GET", true))).toBe("network")
  })

  it("keeps to the site when it is served under a base path", () => {
    const base = new URL("https://drvova.github.io/dither-ui/")
    expect(strategyFor(new URL("https://drvova.github.io/other/x.js"), base, ask())).toBe("network")
    expect(strategyFor(new URL("_build/assets/a.js", base), base, ask())).toBe("static")
  })

  it("keeps the build assets the app's page loads, and only those", () => {
    const html = `<script defer src="/_build/assets/index-1.js"></script><link href="/_build/assets/index-2.css" rel="stylesheet">
      <link rel="icon" href="/favicon.svg"><a href="/docs/">docs</a><img src="https://cdn.example/x.png">`
    expect(pageAssets(html, at(OFFLINE.app), site)).toEqual([
      at("_build/assets/index-1.js").href,
      at("_build/assets/index-2.css").href,
    ])
  })

  it("names its caches by version, so a new one drops the old", () => {
    expect(cacheName("pages")).toBe(`dither-ui-pages-v${OFFLINE.version}`)
    expect(new Set(Object.keys(OFFLINE.caches).map((k) => cacheName(k as keyof typeof OFFLINE.caches))).size).toBe(3)
  })
})
