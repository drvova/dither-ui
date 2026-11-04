// The site offline: what its service worker (`sw.ts`, built to `dist/sw.js`
// by the `sw` environment of rstack.config.ts) keeps and how it answers each
// request, and the registration the app makes once it has loaded. The
// rules are pure so the tests can read them; the worker only wires them to
// its events.

/** The app the site installs as: the Studio, at this path under the site
 * (the landing and the docs stay pages of the web). The worker's scope, the
 * manifest's place and the one page it keeps for offline all read it. A
 * new `version` drops every cache of an older one; a growing cache keeps
 * at most `keep` entries, the oldest dropped first. */
export const OFFLINE = {
  app: "studio/",
  version: 1,
  caches: { pages: "pages", static: "static", assets: "assets" },
  keep: 240,
} as const

export type CacheKind = keyof typeof OFFLINE.caches
export const cacheName = (kind: CacheKind) => `dither-ui-${OFFLINE.caches[kind]}-v${OFFLINE.version}`

/** Whether a path under the site is the app's: where the worker registers. */
export const inApp = (pathname: string) => `${pathname}/`.startsWith(`/${OFFLINE.app}`)

/** How the worker answers a request from the app: left to the network, a
 * page (network first, the copy kept for offline), a hashed asset (from the
 * cache once kept), or another of the site's files (the kept copy at once,
 * refreshed behind it). */
export type Strategy = "network" | "page" | "static" | "asset"

/** What of a request the rules read. */
export type Ask = { method: string; mode: string; range: boolean }

/** Paths under the site the worker leaves to the network: the film and the
 * share cards (large, range-read media), their embeds, the player and the
 * worker itself. */
const PASS = /^(trailer|og|embed|oembed|play)\/|^sw\.js$/

/** `site` is the site's root: the app's assets live under it, not under
 * the app's own path, and every fetch the app makes reaches the worker. */
export function strategyFor(url: URL, site: URL, ask: Ask): Strategy {
  if (ask.method !== "GET" || ask.range) return "network"
  if (url.origin !== site.origin || !url.pathname.startsWith(site.pathname)) return "network"
  const path = url.pathname.slice(site.pathname.length)
  if (PASS.test(path)) return "network"
  if (ask.mode === "navigate") return "page"
  if (path.startsWith("static/")) return "static"
  return "asset"
}

/** The build assets a page's HTML loads (its scripts, styles and
 * preloads), as absolute URLs under the site: what the worker keeps with
 * the app's page at install, so the app opens offline. */
export function pageAssets(html: string, page: URL, site: URL): string[] {
  const found = new Set<string>()
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    const url = new URL(m[1].replace(/&amp;/g, "&"), page)
    if (url.origin === site.origin && url.pathname.startsWith(`${site.pathname}static/`)) found.add(url.href)
  }
  return [...found]
}

/** Registers the worker, scoped to the app, once the app's page has loaded
 * (a production build only: `rs dev` serves no worker), where the browser
 * has service workers; `base` is the site's. */
export function registerOffline(base: string, pathname: string): void {
  if (!import.meta.env.PROD || !inApp(pathname) || !("serviceWorker" in navigator)) return
  const register = () =>
    void navigator.serviceWorker.register(`${base}sw.js`, { scope: `${base}${OFFLINE.app}` }).catch(() => {})
  if (document.readyState === "complete") register()
  else addEventListener("load", register, { once: true })
}
