// @rstest-environment jsdom
// The first paint and the next page. The app mounts once the page the
// address opens on has loaded, so the prerendered bytes stay painted while
// it does (mounting first emptied a docs page until its chunk came: a first
// paint at about 2.5s at 4x CPU, now about 0.4s). The display face is
// fetched with the HTML. A page the reader is about to open is made ready
// before the click (Chromium's speculation rules).
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { speculationRules } from "../src/app/page-reveal"
import { loadDocs, loadOpenPage, loadStudio, resolveRoute } from "../src/app/route-pages"

describe("the page the address opens on", () => {
  it("is the route the address names", () => {
    for (const [path, route] of [
      ["/", "landing"],
      ["/docs", "docs"],
      ["/docs/button", "docs"],
      ["/studio", "studio"],
      ["/nowhere", "missing"],
    ] as const) {
      history.replaceState(null, "", path)
      expect(resolveRoute(), path).toBe(route)
    }
  })

  it("loads once, whoever asks first (main.ts before mounting, App.vue on a move)", async () => {
    expect(loadDocs()).toBe(loadDocs())
    expect(loadStudio()).toBe(loadStudio())
    history.replaceState(null, "", "/docs/aurora")
    expect(loadOpenPage()).toBe(loadDocs())
    history.replaceState(null, "", "/")
    await expect(loadOpenPage()).resolves.toBeUndefined()
  })

  it("is mounted only after it has loaded", () => {
    const main = readFileSync(new URL("../src/app/main.ts", import.meta.url), "utf8")
    expect(main).toMatch(/loadOpenPage\(\)\.finally\(\(\) => createApp\(App\)\.mount\("#app"\)\)/)
    expect(main).not.toMatch(/^createApp\(App\)\.mount/m)
  })
})

describe("the display face", () => {
  it("is preloaded with the HTML, by a rule that matches its built name", () => {
    const config = readFileSync(new URL("../rstack.config.ts", import.meta.url), "utf8")
    const rule = config.match(/include: \[\/(michroma[^/]+)\/\]/)?.[1]
    expect(rule).toBeTruthy()
    const matches = new RegExp(rule!)
    expect(matches.test("static/font/michroma-latin.d3ba1b52cf.woff2")).toBe(true)
    expect(matches.test("static/font/other.d3ba1b52cf.woff2")).toBe(false)
    expect(() => readFileSync(new URL("../src/shared/fonts/michroma-latin.woff2", import.meta.url))).not.toThrow()
  })
})

describe("the next page", () => {
  for (const base of ["/", "/dither-ui/"])
    it(`is rendered ahead on intent, the Studio only fetched, under ${base}`, () => {
      const rules = JSON.parse(speculationRules(base))
      const [prerender] = rules.prerender
      expect(prerender.eagerness).toBe("moderate")
      expect(prerender.where.and[0]).toEqual({ href_matches: `${base}*` })
      const never = prerender.where.and[1].not.or.map((r: { href_matches: string }) => r.href_matches)
      expect(never).toEqual([`${base}og/*`, `${base}play/*`, `${base}kit/*`, `${base}studio*`])
      expect(rules.prefetch).toEqual([{ where: { href_matches: `${base}studio*` }, eagerness: "moderate" }])
    })
})
