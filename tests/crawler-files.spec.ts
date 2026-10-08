import { describe, expect, it } from "vitest"
import { llmsTxt, ogCardPage, robotsTxt, sectionsManifest, sitemapXml } from "@/pages/docs/crawler-files"
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
  })

  it("disallows only the og card surface, for the wildcard agent alone", () => {
    const disallows = [...robots.matchAll(/^Disallow: (.+)$/gm)].map((m) => m[1])
    expect(disallows).toEqual(["/og/"])
    const wildcard = robots.slice(robots.indexOf("User-agent: *"))
    expect(wildcard).toMatch(/Disallow: \/og\//)
    const namedBlock = robots.slice(0, robots.indexOf("User-agent: *"))
    expect(namedBlock).not.toMatch(/Disallow/)
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

describe("sections manifest (og engine)", () => {
  const manifest = JSON.parse(sectionsManifest())

  it("covers every section exactly once with seo-derived meta", () => {
    expect(manifest.map((s) => s.id)).toEqual(SECTIONS.map((s) => s.id))
    for (const s of manifest) {
      expect(s.url).toBe(`${SITE_URL}/docs/${s.id}`)
      expect(s.title).toBe(`${s.label} | dither-ui`)
      expect(s.description.length).toBeGreaterThan(20)
      expect(s.group.length).toBeGreaterThan(0)
      expect(() => JSON.parse(s.breadcrumb)).not.toThrow()
      expect(JSON.parse(s.breadcrumb)["@type"]).toBe("BreadcrumbList")
    }
  })
})

describe("og card page", () => {
  const page = ogCardPage()

  it("is a self-contained renderer gated on og-ready with seed and invert params", () => {
    expect(page).toMatch(/<canvas id="dith" width="1200" height="630">/)
    expect(page).toMatch(/document\.title="og-ready"/)
    expect(page).toMatch(/seedOf\(id\)/)
    expect(page).toMatch(/inv/)
    expect(page).toMatch(/Bayer|const B = \[/)
    expect(page).toMatch(/noindex/)
  })

  it("draws through the house ramp and never solid discs (density cap)", () => {
    expect(page).toMatch(/SKY = \["#0c1730"/)
    expect(page).toMatch(/Math\.min\(v, ?1\.15\)/)
  })
})
