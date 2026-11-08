// The site's routes and their pages. The landing paints at once (it is the
// entry and the shared link target); the docs and the Studio are heavy, each
// its own chunk, loaded once (`once`) by whoever asks first: main.ts, for the
// page the address opens on, before the app mounts; App.vue, on a move.
// Mounting first wiped the prerendered page and showed nothing until the
// chunk came (a docs page's first paint waited for its code, about 2.5s at
// 4x CPU); loading first leaves the prerendered bytes painted meanwhile and
// mounts the same page over them in one step.
import type { Component } from "vue"
import type { RouteName } from "@/shared/config/titles"
import { appPathname, isLanding } from "@/shared/lib"

/** The route the address names. */
export function resolveRoute(): RouteName {
  const path = appPathname()
  if (path.startsWith("/studio")) return "studio"
  if (path.startsWith("/docs")) return "docs"
  return isLanding(path) ? "landing" : "missing"
}

const once = <T>(load: () => Promise<T>) => {
  let loading: Promise<T> | undefined
  return () => (loading ??= load())
}

/** The docs' page, with the pack of the section the address opens on. */
export const loadDocs = once((): Promise<Component> =>
  import("@/pages/docs").then(async (m) => (await m.preloadOpenPacks(), m.DocsPage)),
)

/** The Studio's page. */
export const loadStudio = once((): Promise<Component> => import("@/pages/studio").then((m) => m.StudioPage))

/** The page the address opens on, loaded (the landing and the missing page
 * ship with the app). */
export function loadOpenPage(): Promise<unknown> {
  const route = resolveRoute()
  return route === "docs" ? loadDocs() : route === "studio" ? loadStudio() : Promise.resolve()
}
