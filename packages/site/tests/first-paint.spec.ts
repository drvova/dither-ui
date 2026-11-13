// @rstest-environment jsdom
// The first paint and the next page. The app mounts once the page the
// address opens on has loaded, so the prerendered bytes stay painted while
// it does (mounting first emptied a docs page until its chunk came: a first
// paint at about 2.5s at 4x CPU, now about 0.4s). The display face is
// fetched with the HTML. A page the reader is about to open is made ready
// before the click (Chromium's speculation rules).
import { describe, expect, it } from "rstack/test"
import { speculationRules } from "../src/app/page-reveal"

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
