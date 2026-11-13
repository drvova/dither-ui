// Each route's page carries its title three times as static bytes (the
// <title>, og:title, twitter:title) for crawlers and link previews; all three
// are the route's row in ROUTE_TITLES (the pages' head table, held by
// its own spec), and no title breaks the copy bans.
import { describe, expect, it } from "rstack/test"
import { ROUTE_TITLES } from "../src/shared/config/titles"

describe("route titles", () => {
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
