import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { SECTIONS } from "@/pages/docs/groups"

// public/llms.txt follows the llmstxt.org spec: H1, blockquote summary,
// absolute https links with descriptions, no nested lists. Every /docs deep
// link it points at must exist in the section IA, or an LLM gets a 404 shell.
const llms = readFileSync(resolve(import.meta.dirname, "../public/llms.txt"), "utf8")
const robots = readFileSync(resolve(import.meta.dirname, "../public/robots.txt"), "utf8")

const links = [...llms.matchAll(/^- \[([^\]]+)\]\((https:\/\/[^)]+)\): (.+)$/gm)].map((m) => ({
  title: m[1],
  url: m[2],
  desc: m[3],
}))

describe("llms.txt", () => {
  it("starts with an H1 then a blockquote summary", () => {
    expect(llms.split("\n").slice(0, 3)).toEqual([
      "# dither-ui",
      "",
      expect.stringMatching(/^> /),
    ])
  })

  it("uses only absolute https links with descriptions and no nesting", () => {
    expect(links.length).toBeGreaterThan(10)
    for (const l of links) {
      expect(l.url).toMatch(/^https:\/\//)
      expect(l.desc.length).toBeGreaterThan(20)
    }
    expect(llms).not.toMatch(/^\s{2,}- /m) // no nested bullets
  })

  it("points every /docs link at an existing section id", () => {
    const ids = new Set(SECTIONS.map((s) => s.id))
    const bad = links.filter((l) => {
      const m = l.url.match(/^https:\/\/dither-ui\.com\/docs\/([a-z0-9-]+)$/)
      return m ? !ids.has(m[1]) : false
    })
    expect(bad.map((b) => b.url)).toEqual([])
  })
})

describe("robots.txt", () => {
  it("allows every declared crawler and keeps the sitemap line", () => {
    const agents = [...robots.matchAll(/^User-agent: (.+)$/gm)].map((m) => m[1])
    expect(agents).toContain("*")
    for (const a of agents) {
      const block = robots.slice(robots.indexOf(`User-agent: ${a}`))
      const end = block.indexOf("\nUser-agent:", 1)
      expect(block.slice(0, end === -1 ? undefined : end)).toMatch(/^[\s\S]*Allow: \/\r?$/m)
    }
    expect(robots).toMatch(/Sitemap: https:\/\/dither-ui\.com\/sitemap\.xml/)
    expect(robots).not.toMatch(/Disallow/)
  })
})
