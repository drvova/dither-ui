// The site as an installable app: its web manifest, its icons (the browser
// tab's, the home screen's, the install prompt's, plain and maskable) and
// the head that points at them, all drawn from the brand mark's own cells
// (`shared/ui/brand-mark.ts`) on the landing's obsidian, never hand-drawn.
// The build emits every file here (`rstack.config.ts`, the `installFiles`
// plugin) and injects INSTALL_HEAD into each route's head. Node-side only:
// rstack.config.ts loads it under Node's own TypeScript, so its imports
// carry `.ts`.
import { deflateSync } from "node:zlib"
import { ROUTE_CARDS } from "../pages/docs/crawler-files.ts"
import { MARK_CELLS } from "../shared/ui/brand-mark.ts"

/** The landing's ground and ink, and the mark's ember core (held equal to
 * the site's tokens by `tests/install.spec.ts`). */
export const INSTALL_INK = { ground: "#101214", ink: "#e4e1d8", ember: "#ff9632" } as const

/** Every icon the site ships: its path, its size in px and how much of it
 * the mark spans (a maskable icon keeps the mark inside the safe circle a
 * launcher may crop to, 80% of its width). */
export const ICONS = [
  { path: "favicon.png", size: 32, span: 0.875 },
  { path: "apple-touch-icon.png", size: 180, span: 0.55 },
  { path: "icons/192.png", size: 192, span: 0.55, purpose: "any" },
  { path: "icons/512.png", size: 512, span: 0.55, purpose: "any" },
  { path: "icons/maskable-512.png", size: 512, span: 0.42, purpose: "maskable" },
] as const

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** The icon's pixels, RGBA: the ground, the mark's cells whole on it,
 * centred, the core in the ember. */
export function iconPixels(size: number, span: number): Uint8Array {
  const px = new Uint8Array(size * size * 4)
  const ground = rgb(INSTALL_INK.ground)
  for (let i = 0; i < size * size; i++) px.set([...ground, 255], i * 4)
  const cell = Math.max(1, Math.floor((size * span) / 7))
  const at = Math.floor((size - 7 * cell) / 2)
  for (const m of MARK_CELLS) {
    const ink = rgb(m.core ? INSTALL_INK.ember : INSTALL_INK.ink)
    for (let y = 0; y < cell; y++)
      for (let x = 0; x < cell; x++) px.set([...ink, 255], ((at + m.y * cell + y) * size + at + m.x * cell + x) * 4)
  }
  return px
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (const b of bytes) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** RGBA pixels as a PNG: 8 bits a channel, every row unfiltered. */
export function png(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const rows = new Uint8Array(height * (width * 4 + 1))
  for (let y = 0; y < height; y++)
    rows.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length)
    const view = new DataView(out.buffer)
    view.setUint32(0, data.length)
    out.set(new TextEncoder().encode(type), 4)
    out.set(data, 8)
    view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
    return out
  }
  const head = new Uint8Array(13)
  new DataView(head.buffer).setUint32(0, width)
  new DataView(head.buffer).setUint32(4, height)
  head.set([8, 6, 0, 0, 0], 8)
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", head),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", new Uint8Array()),
  ]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/** The tab's icon as a vector: the mark on a rounded obsidian tile. */
export function faviconSvg(): string {
  const cells = MARK_CELLS.map(
    (m) =>
      `<rect x="${1 + m.x * 2}" y="${1 + m.y * 2}" width="2" height="2" fill="${m.core ? INSTALL_INK.ember : INSTALL_INK.ink}"/>`,
  ).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" rx="3" fill="${INSTALL_INK.ground}"/>${cells}</svg>\n`
}

/** The web app manifest. Every URL is relative to the manifest's own, so
 * the app installs whatever base the site is served under. */
export function webManifest(): string {
  const home = ROUTE_CARDS.find((r) => r.id === "home")!
  const icons = ICONS.filter((i) => "purpose" in i).map((i) => ({
    src: i.path,
    sizes: `${i.size}x${i.size}`,
    type: "image/png",
    purpose: i.purpose,
  }))
  return JSON.stringify(
    {
      id: ".",
      name: home.title,
      short_name: home.title,
      description: home.line,
      start_url: ".",
      scope: ".",
      display: "standalone",
      orientation: "any",
      background_color: INSTALL_INK.ground,
      theme_color: INSTALL_INK.ground,
      categories: ["developer", "design"],
      icons,
      // The other routes, a long press on the icon away.
      shortcuts: ROUTE_CARDS.filter((r) => r.id !== "home").map((r) => ({
        name: r.title,
        description: r.line,
        url: `${new URL(r.url).pathname.replace(/^\//, "")}/`,
        icons: [icons[0]],
      })),
    },
    null,
    2,
  )
}

/** Every file the install surface ships, by its path in dist. */
export function installFiles(): Record<string, string | Uint8Array> {
  return {
    "site.webmanifest": webManifest(),
    "favicon.svg": faviconSvg(),
    ...Object.fromEntries(ICONS.map((i) => [i.path, png(iconPixels(i.size, i.span), i.size, i.size)])),
  }
}

/** The head every site route carries for it: the manifest, the icons, and
 * what iOS reads to open the site from the home screen as an app. */
export const INSTALL_HEAD = [
  { tag: "link", attrs: { rel: "manifest", href: "site.webmanifest" } },
  { tag: "link", attrs: { rel: "icon", href: "favicon.svg", type: "image/svg+xml" } },
  { tag: "link", attrs: { rel: "icon", href: "favicon.png", sizes: "32x32", type: "image/png" } },
  { tag: "link", attrs: { rel: "apple-touch-icon", href: "apple-touch-icon.png" } },
  { tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-title", content: "dither-ui" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-status-bar-style", content: "black" } },
] as const
