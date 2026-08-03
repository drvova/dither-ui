import { describe, expect, it } from "vitest"
import { llmsTxt, robotsTxt, sitemapXml } from "@/pages/docs/crawler-files"
import { SECTIONS } from "@/pages/docs/groups"
import { SITE_URL } from "@/pages/docs/seo"

// All three crawler files are generated at build time from GROUPS/SITE_URL
// (see vite.config crawlFiles plugin); these tests pin the emitted shape and
// prove the generators never drift from the section IA. A renamed section id
// referenced in llms.txt or the sitemap throws from docsUrl() at render time,
// so dead links fail the build and these tests together.

describe("llms.txt", () => {
  const llms = llmsTxt()

  it("starts with an H1 then a blockquote summary", () => {
    expect(llms.split("\n").slice(0, 3)).toEqual([
      "# dither-ui",
      "",
      expect.stringMatching(/^> /),
    ])
  })

  it("emits curated absolute https links with descriptions and an Optional section", () => {
    const links = [...llms.matchAll(/^- \[([^\]]+)\]\((https:\/\/[^)]+)\): (.+)$/gm)]
    expect(links.length).toBeGreaterThan(10)
    for (const [, , , desc] of links) expect(desc.length).toBeGreaterThan(20)
    expect(llms).toContain("## Optional")
    expect(llms).not.toMatch(/^\s{2,}- /m) // no nested bullets
  })
})

describe("robots.txt", () => {
  const robots = robotsTxt()

  it("allows every declared crawler and derives the sitemap URL from SITE_URL", () => {
    const agents = [...robots.matchAll(/^User-agent: (.+)$/gm)].map((m) => m[1])
    expect(agents).toContain("*")
    for (const a of agents) {
      const block = robots.slice(robots.indexOf(`User-agent: ${a}`))
      const end = block.indexOf("\nUser-agent:", 1)
      expect(block.slice(0, end === -1 ? undefined : end)).toMatch(/^[\s\S]*Allow: \/\r?$/m)
    }
    expect(robots).toMatch(new RegExp(`Sitemap: ${SITE_URL}/sitemap\\.xml`))
    expect(robots).not.toMatch(/Disallow/)
  })
})

describe("sitemap.xml", () => {
  const xml = sitemapXml()

  it("covers the three route entries and every docs section exactly once", () => {
    expect(xml).toMatch(`<loc>${SITE_URL}/</loc>`)
    expect(xml).toMatch(`<loc>${SITE_URL}/docs</loc>`)
    expect(xml).toMatch(`<loc>${SITE_URL}/studio</loc>`)
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
    const sectionLocs = SECTIONS.map((s) => `${SITE_URL}/docs/${s.id}`)
    expect(locs).toHaveLength(3 + sectionLocs.length)
    expect(new Set(locs).size).toBe(locs.length)
    for (const loc of sectionLocs) expect(locs).toContain(loc)
  })
})
