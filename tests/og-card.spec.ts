import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { INKS } from "@/pages/landing/plate"
import { ogPrint, ogScreen } from "@/pages/docs/og-art"
import {
  OG_FRAMES,
  OG_H,
  OG_HERO_SEED,
  OG_INK,
  OG_PRINT,
  OG_PRINT_INKS,
  OG_TEXT,
  OG_W,
  ogCardSeed,
  ogSeed,
  ogWrap,
} from "@/pages/docs/og-card"
import { SECTIONS } from "@/pages/docs/groups"

// The share cards: what the build draws as og/<id>.png and loops as
// og/<id>.gif, through the renderer page (`og-page.ts`), in the landing's
// printed look: the kit's poster printed beside the title.

const root = new URL("..", import.meta.url).pathname
const card = { seed: ogSeed("avatar"), inv: false }
const home = { seed: ogCardSeed("home"), inv: false }

describe("share card art", () => {
  it("loops: the end of the loop is its first frame, and the frames between move", () => {
    for (const c of [card, home]) {
      expect(ogPrint(c, 1).data).toEqual(ogPrint(c, 0).data)
      expect(ogPrint(c, 0.25).data).not.toEqual(ogPrint(c, 0).data)
      // Every frame of the GIF is on the loop: the frames step whole cells.
      expect(ogPrint(c, (OG_FRAMES - 1) / OG_FRAMES).data).not.toEqual(ogPrint(c, 0).data)
    }
  })

  it("is the same print for the same seed, another for another, each through its own screen", () => {
    expect(ogPrint(card, 0.5).data).toEqual(ogPrint({ ...card }, 0.5).data)
    expect(ogPrint({ ...card, seed: ogSeed("slider") }, 0).data).not.toEqual(ogPrint(card, 0).data)
    expect(new Set(SECTIONS.map((s) => ogScreen({ seed: ogCardSeed(s.id) }))).size).toBeGreaterThan(2)
  })

  it("prints the hero's own composition on the home card, through Bayer as the hero does", () => {
    const hero = readFileSync(`${root}/src/pages/landing/Showcase.vue`, "utf8")
    expect(hero).toMatch(new RegExp(`<DitherPoster :seed="${OG_HERO_SEED}" :inks="INKS"`))
    expect(home.seed).toBe(OG_HERO_SEED)
    expect(ogScreen(home)).toBe("bayer")
    expect([...OG_PRINT_INKS.night]).toEqual(INKS)
  })

  it("never prints bone on bone: by day the bone ink turns obsidian", () => {
    expect(OG_PRINT_INKS.day).not.toContain(OG_INK.day.ground)
    expect(OG_PRINT_INKS.day).toContain(OG_INK.night.ground)
  })

  it("stands the print on the card's right, clear of the type's column", () => {
    expect(OG_PRINT.x).toBeGreaterThanOrEqual(OG_TEXT.x + OG_TEXT.max + 48)
    expect(OG_PRINT.x + OG_PRINT.cols * OG_PRINT.cell).toBeLessThanOrEqual(OG_W - OG_TEXT.x)
    expect(OG_PRINT.y + OG_PRINT.rows * OG_PRINT.cell).toBeLessThanOrEqual(OG_H - OG_TEXT.x)
    // Its foot on the type's last line: within a descender of the baseline.
    expect(OG_PRINT.y + OG_PRINT.rows * OG_PRINT.cell - OG_TEXT.base).toBeLessThanOrEqual(8)
  })

  it("keeps every muted line at AA on its ground", () => {
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
    }
    for (const ink of [OG_INK.night, OG_INK.day]) {
      const [a, b] = [lum(ink.muted), lum(ink.ground)].sort((x, y) => y - x)
      expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe("share card type", () => {
  const measure = (text: string) => text.length * 10

  it("wraps a title in as few lines as fit, as even as those lines allow", () => {
    expect(ogWrap(["Avatar"], measure, 100)).toEqual(["Avatar"])
    const lines = ogWrap("Admin with a profile panel".split(" "), measure, 200)
    expect(lines).toHaveLength(2)
    expect(lines.every((l) => measure(l) <= 200)).toBe(true)
    // Balanced: the greedy split would leave one word on the last line.
    expect(lines).toEqual(["Admin with a", "profile panel"])
  })

  it("keeps the copy bans in the renderer: no uppercase, middle dot or em dash", () => {
    const page = readFileSync(`${root}/src/pages/docs/og-page.ts`, "utf8")
    expect(page).not.toMatch(/toUpperCase|text-transform|letterSpacing|[·—]/)
  })
})
