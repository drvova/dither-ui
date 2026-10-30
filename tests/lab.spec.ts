// The Verification section's checks hold in CI as they do in the reader's
// browser, the poster's hash is the one the page sets beside the reader's,
// and every check names a spec that exists.
import { existsSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { CHECKS, engineOf, POSTER_HASH } from "../src/pages/docs/handbook/lab"

describe("the lab", () => {
  for (const check of CHECKS)
    it(`${check.id}: ${check.claim}`, () => {
      const reading = check.run()
      expect(reading.figure).toBeTruthy()
      expect(reading.holds).toBe(true)
    })

  it("records the poster's hash as Node prints it", () => {
    expect(CHECKS.find((c) => c.id === "portable")!.run().figure).toBe(`hash ${POSTER_HASH}`)
  })

  it("names a spec that exists for every claim, ids unique, copy within the bans", () => {
    expect(new Set(CHECKS.map((c) => c.id)).size).toBe(CHECKS.length)
    for (const c of CHECKS) {
      expect(existsSync(new URL(`../${c.test}`, import.meta.url))).toBe(true)
      for (const text of [c.claim, c.method, c.against]) expect(text).not.toMatch(/[—·]/)
    }
  })

  it("reads the engine from a user agent", () => {
    const ua = {
      chrome: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      safari:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
      ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1",
      firefox: "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
    }
    expect(Object.values(ua).map(engineOf)).toEqual(["Chromium", "Chromium", "WebKit", "WebKit", "Gecko"])
  })
})
