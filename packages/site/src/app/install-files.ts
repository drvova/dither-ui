// The Studio as an installable app (the landing and the docs stay pages of
// the web), and the site's icons: the app's web manifest, every icon (the
// browser tab's, the home screen's, the install prompt's, plain and
// maskable) and the head that points at them, all drawn from the brand
// mark's own cells (`shared/ui/brand-mark.ts`) on the landing's obsidian,
// never hand-drawn. The build emits every file here
// (`build/site-files.ts`); the shell and the Studio's route render the
// head tags. Node-side only: the build's config loads it under Node's own
// TypeScript, so its imports carry `.ts`.
import { pngBytes } from "@dither-ui/kit/engine/png.ts"
import { ROUTE_CARDS } from "../pages/docs/crawler-files.ts"
import { MARK_CELLS } from "../shared/ui/brand-mark.ts"
import { OFFLINE } from "./offline.ts"

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
function iconPixels(size: number, span: number): Uint8Array {
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

/** The tab's icon as a vector: the mark on a rounded obsidian tile. */
export function faviconSvg(): string {
  const cells = MARK_CELLS.map(
    (m) =>
      `<rect x="${1 + m.x * 2}" y="${1 + m.y * 2}" width="2" height="2" fill="${m.core ? INSTALL_INK.ember : INSTALL_INK.ink}"/>`,
  ).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" rx="3" fill="${INSTALL_INK.ground}"/>${cells}</svg>\n`
}

/** The Studio's own dark ground, its splash and its window's colour (held
 * equal to the Studio page's dark theme-color by the tests). */
export const STUDIO_GROUND = "#08090b"

/** The app's manifest, in the app's own folder. Every URL is relative to
 * it, so the app installs whatever base the site is served under. */
export const MANIFEST = `${OFFLINE.app}app.webmanifest`

/** The web app manifest: the Studio, standalone. */
export function webManifest(): string {
  const studio = ROUTE_CARDS.find((r) => `${new URL(r.url).pathname.slice(1)}/` === OFFLINE.app)!
  const up = OFFLINE.app.replace(/[^/]+/g, "..")
  return JSON.stringify(
    {
      id: ".",
      name: `dither-ui ${studio.title}`,
      short_name: studio.title,
      description: studio.line,
      start_url: ".",
      scope: ".",
      display: "standalone",
      orientation: "any",
      background_color: STUDIO_GROUND,
      theme_color: STUDIO_GROUND,
      categories: ["design", "developer"],
      icons: ICONS.filter((i) => "purpose" in i).map((i) => ({
        src: `${up}${i.path}`,
        sizes: `${i.size}x${i.size}`,
        type: "image/png",
        purpose: i.purpose,
      })),
    },
    null,
    2,
  )
}

/** Every file the install surface ships, by its path in dist. */
export function installFiles(): Record<string, string | Uint8Array> {
  return {
    [MANIFEST]: webManifest(),
    "favicon.svg": faviconSvg(),
    ...Object.fromEntries(ICONS.map((i) => [i.path, pngBytes(i.size, i.size, iconPixels(i.size, i.span))])),
  }
}

type HeadTag = { tag: "link" | "meta"; attrs: Record<string, string> }

/** The site's icons, on every route. */
export const ICON_HEAD: HeadTag[] = [
  { tag: "link", attrs: { rel: "icon", href: "favicon.svg", type: "image/svg+xml" } },
  { tag: "link", attrs: { rel: "icon", href: "favicon.png", sizes: "32x32", type: "image/png" } },
  { tag: "link", attrs: { rel: "apple-touch-icon", href: "apple-touch-icon.png" } },
]
/** The app's: its manifest and what iOS reads to open it from the home
 * screen as an app. */
export const APP_HEAD: HeadTag[] = [
  { tag: "link", attrs: { rel: "manifest", href: MANIFEST } },
  { tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-capable", content: "yes" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-title", content: "Studio" } },
  { tag: "meta", attrs: { name: "apple-mobile-web-app-status-bar-style", content: "black" } },
]
