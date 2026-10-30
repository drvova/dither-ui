// The title each route carries in a tab, a search result and a share
// preview. App.vue sets it as the route changes; the route entry pages
// (`index.html`, `docs/index.html`, `studio/index.html`) repeat it as static
// bytes for crawlers, held to this table by tests/titles.spec.ts. Copy
// follows the bans: no em dashes or middle dots.
export const ROUTE_TITLES = {
  landing: "dither-ui: a dithered UI toolkit for Vue",
  docs: "Vue dither components and chart documentation | dither-ui",
  studio: "Studio: build dithered Vue interfaces | dither-ui",
} as const

export type RouteName = keyof typeof ROUTE_TITLES
