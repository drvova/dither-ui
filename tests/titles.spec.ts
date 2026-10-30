// Each route's entry page carries its title three times as static bytes (the
// <title>, og:title, twitter:title) for crawlers and link previews; all three
// are the route's row in ROUTE_TITLES, and no title breaks the copy bans.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { ROUTE_TITLES, type RouteName } from "../src/shared/config/titles"

const ENTRY: Record<RouteName, string> = { landing: "index.html", docs: "docs/index.html", studio: "studio/index.html" }

describe("route titles", () => {
  for (const [route, file] of Object.entries(ENTRY) as [RouteName, string][])
    it(`${file} carries the ${route} title`, () => {
      const html = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
      const title = ROUTE_TITLES[route]
      expect(html.match(/<title>([^<]*)<\/title>/)?.[1]).toBe(title)
      expect(html.match(/property="og:title" content="([^"]*)"/)?.[1]).toBe(title)
      expect(html.match(/name="twitter:title" content="([^"]*)"/)?.[1]).toBe(title)
    })

  it("keep the copy bans", () => {
    for (const title of Object.values(ROUTE_TITLES)) expect(title).not.toMatch(/[—·]/)
  })
})
