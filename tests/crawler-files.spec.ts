import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import {
  componentEmbed,
  llmsTxt,
  oembed,
  ogCardPage,
  ROUTE_CARDS,
  robotsTxt,
  sectionsManifest,
  shareCards,
  shareHead,
  sitemapXml,
} from "@/pages/docs/crawler-files"
import { SECTIONS } from "@/pages/docs/groups"
import { SITE_URL } from "@/pages/docs/seo"

// All three crawler files are generated at build time from GROUPS/SITE_URL
// (see the rstack.config crawlFiles plugin); these tests pin the emitted shape and
// prove the generators never drift from the section IA. A renamed section id
// referenced in llms.txt or the sitemap throws from docsUrl() at render time,
// so dead links fail the build and these tests together.

describe("llms.txt", () => {
  const llms = llmsTxt()

  it("starts with an H1 then a blockquote summary", () => {
    expect(llms.split("\n").slice(0, 3)).toEqual(["# dither-ui", "", expect.stringMatching(/^> /)])
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

  it("disallows only the card renderer, for the wildcard agent alone, never the cards", () => {
    const disallows = [...robots.matchAll(/^Disallow: (.+)$/gm)].map((m) => m[1])
    expect(disallows).toEqual(["/og/$", "/og/index.html", "/og/sections.json"])
    const namedBlock = robots.slice(0, robots.indexOf("User-agent: *"))
    expect(namedBlock).not.toMatch(/Disallow/)
    // Every line is a directive, a comment or blank.
    for (const line of robots.split("\n")) expect(line).toMatch(/^($|#|[A-Za-z-]+: )/)
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
      expect(s.head).toContain(`<link rel="canonical" href="${s.url}" />`)
      expect(s.head).toContain(`${SITE_URL}/og/${s.id}.png`)
      expect(s.head).toContain(`${SITE_URL}/embed/${s.id}.json`)
      expect(s.head).toContain(`${SITE_URL}/oembed/${s.id}.json`)
      expect(s.title).toBe(`${s.label} | dither-ui`)
      expect(s.description.length).toBeGreaterThan(20)
      expect(s.group.length).toBeGreaterThan(0)
      expect(() => JSON.parse(s.breadcrumb)).not.toThrow()
      expect(JSON.parse(s.breadcrumb)["@type"]).toBe("BreadcrumbList")
    }
  })
})

describe("share cards", () => {
  const cards = shareCards()

  it("covers the routes then every section, with ids unique across both", () => {
    expect(cards.map((c) => c.id)).toEqual([...ROUTE_CARDS.map((r) => r.id), ...SECTIONS.map((s) => s.id)])
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length)
  })

  it("gives Discord a component embed of the playing card under its 3,000 byte cap", () => {
    for (const card of cards) {
      const json = componentEmbed(card)
      expect(new TextEncoder().encode(json).length).toBeLessThanOrEqual(3000)
      const { component } = JSON.parse(json)
      expect(component.type).toBe(17)
      const kinds = component.components.map((c: { type: number }) => c.type)
      expect(kinds).toEqual([10, 12, 1])
      expect(component.components[1].items[0].media.url).toBe(`${SITE_URL}/og/${card.id}.gif`)
      // Component embeds allow link buttons only, each with a label and a url.
      for (const b of component.components[2].components) {
        expect(Object.keys(b).sort()).toEqual(["label", "style", "type", "url"])
        expect(b.style).toBe(5)
        expect(b.label).not.toMatch(/[→›»]$/)
      }
    }
  })

  it("gives oEmbed readers the playing card as a photo, its still as the thumbnail", () => {
    const o = JSON.parse(oembed(cards[0]))
    expect(o).toMatchObject({ version: "1.0", type: "photo", width: 1200, height: 630 })
    expect(o.url).toBe(`${SITE_URL}/og/home.gif`)
    expect(o.thumbnail_url).toBe(`${SITE_URL}/og/home.png`)
  })

  it("is what each route's own head points at", () => {
    const files = { home: "index.html", docs: "docs/index.html", studio: "studio/index.html" }
    for (const card of cards.slice(0, ROUTE_CARDS.length)) {
      const html = readFileSync(files[card.id as keyof typeof files], "utf8").replace(/\s+/g, " ")
      for (const tag of shareHead(card)
        .split("\n")
        .map((t) => t.trim()))
        expect(html).toContain(tag)
    }
  })

  it("keeps the copy bans: no middle dot, em dash or uppercase label", () => {
    for (const card of cards) {
      const text = [card.title, card.description, card.alt, ...card.links.map((l) => l.label)].join(" ")
      expect(text).not.toMatch(/[\u00b7\u2014]/)
    }
    expect(ogCardPage()).not.toMatch(/text-transform|toUpperCase|[\u00b7\u2014]/)
  })
})

describe("og card page", () => {
  const page = ogCardPage()
  const script = page.slice(page.indexOf("<script>") + 8, page.indexOf("</script>"))

  it("is one self-contained script: the art and the GIF encoder inline, no imports", () => {
    expect(() => new Function(script)).not.toThrow()
    expect(script).not.toMatch(/\bimport\b|\brequire\(/)
    for (const name of ["ogArt", "ogWrap", "encodeGif", "lzw", "deltaBox", "quantize"])
      expect(script).toMatch(new RegExp(`function ${name}\\(`))
    expect(page).toMatch(/<canvas id="dith" width="1200" height="630">/)
    expect(page).toMatch(/noindex/)
  })

  it("answers the prerender and the Discord service", () => {
    expect(script).toContain("files(id, seed, inv)")
    expect(script).toContain('document.title = "og-ready"')
    // The Discord service swaps this exact read for the manifest inline.
    expect(script).toContain('fetch("./sections.json").then(r=>r.json())')
  })
})
