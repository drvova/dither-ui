// The landing's bento at a phone's width: the decrypted text's lines never
// wrap (the kit prints them whole, glyph by glyph, in the mono), so their
// size follows their card's own width, and the longest fits the card from a
// 320px phone's rail to the desktop's half-row (the browser walk found it cut
// on a 390px phone when it followed the window instead).
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const root = new URL("../src/pages/landing/", import.meta.url).pathname
const css = readFileSync(join(root, "Examples.css"), "utf8")
const tsx = readFileSync(join(root, "Examples.tsx"), "utf8")

/** A mono glyph's advance, in ems (the kit's mono and the display face's fallback). */
const ADVANCE = 0.6
const REM = 16

const rule = (selector: string) => {
  const at = css.indexOf(`${selector} {`)
  expect(at, selector).toBeGreaterThanOrEqual(0)
  return css.slice(at, css.indexOf("}", at))
}

describe("the bento's decrypted text", () => {
  const lines = [
    ...tsx.slice(tsx.indexOf('case "decrypted-text"')).matchAll(/<DitherDecryptedText text="([^"]+)"/g),
  ].map((m) => m[1])
  const longest = Math.max(...lines.map((l) => l.length))
  const size = /font-size:\s*clamp\(([\d.]+)rem,\s*([\d.]+)cqi,\s*([\d.]+)rem\)/.exec(rule(".examples-scope .cipher"))

  it("sizes its lines by its card, which is a size container", () => {
    expect(lines.length).toBeGreaterThan(1)
    expect(rule(".examples-scope .t-decrypted-text .card-art")).toContain("container-type: inline-size")
    expect(size).not.toBeNull()
  })

  it("fits the longest line in the card's art at every width a card has", () => {
    const [, min, cqi, max] = size!.map(Number)
    const padding = Number(/padding:\s*(\d+)px/.exec(rule(".examples-scope .card-art"))![1])
    // the rail's card on a 320px phone (86% of the page less its gutters) up to a wide desktop's half-row
    for (let card = Math.floor((320 - 32) * 0.86); card <= 800; card += 4) {
      const art = card - padding * 2
      const font = Math.min(max * REM, Math.max(min * REM, (art * cqi) / 100))
      expect(longest * ADVANCE * font, `a ${card}px card`).toBeLessThanOrEqual(art)
    }
  })
})
