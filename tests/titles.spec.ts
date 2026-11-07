// Each route's entry page carries its title three times as static bytes (the
// <title>, og:title, twitter:title) for crawlers and link previews; all three
// are the route's row in ROUTE_TITLES, and no title breaks the copy bans.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { ROUTE_TITLES, type RouteName } from "../src/shared/config/titles"

// The missing page has no entry of its own (the host serves the landing's
// shell for an unknown address), so it carries its title at runtime only.
const ENTRY: Record<Exclude<RouteName, "missing">, string> = {
  landing: "index.html",
  docs: "docs/index.html",
  studio: "studio/index.html",
}

describe("route titles", () => {
  for (const [route, file] of Object.entries(ENTRY) as [Exclude<RouteName, "missing">, string][])
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

describe("the landing's address", () => {
  it("is the root or its entry file, and nothing else", async () => {
    const { isLanding } = await import("../src/shared/lib/routes")
    expect(isLanding("/")).toBe(true)
    expect(isLanding("/index.html")).toBe(true)
    for (const path of ["/docx", "/studios-old", "/blog/hello", "/index.htm", "/favicon.ico"])
      expect(isLanding(path), path).toBe(false)
  })
})
