// The title each route carries in a tab, a search result and a share
// preview: each route's head sets it (`pages/docs/heads.ts`), so the
// prerendered pages carry it as static bytes for crawlers. Copy
// follows the bans: no em dashes or middle dots.
export const ROUTE_TITLES = {
  landing: "dither-ui: a dithered UI toolkit for Solid",
  docs: "Solid dither components and chart documentation | dither-ui",
  studio: "Studio: build dithered Solid interfaces | dither-ui",
  // An address none of the routes own (no entry page of its own: the host
  // serves the landing's shell for it, as 404.html).
  missing: "Page not found | dither-ui",
} as const

export type RouteName = keyof typeof ROUTE_TITLES
