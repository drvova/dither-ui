// Scroll scenes (`shared/lib/scroll-scene.ts`): where an element is in its
// passage, 0 to 1, between two moments or through the span it is pinned,
// written on the glide; the landing's scenes (`SCENES`) and their
// stylesheets, which move only where motion is welcome.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { glide } from "@dither-ui/kit/engine/dither-paint.ts"
import { SCENES } from "@/pages/landing/scenes"
import { sceneProgress, sceneValue } from "@/shared/lib/scroll-scene"

const root = new URL("../../..", import.meta.url).pathname
const read = (p: string) => readFileSync(join(root, p), "utf8")

describe("a scene's progress", () => {
  const vh = 900
  const through = { from: ["top", 1], to: ["top", 0.5] } as const

  it("runs between two moments of the element's passage, linear in the scroll", () => {
    // the top at the viewport's foot, then halfway up it, then between
    expect(sceneProgress(through, { top: 900, height: 300 }, vh)).toBe(0)
    expect(sceneProgress(through, { top: 450, height: 300 }, vh)).toBe(1)
    expect(sceneProgress(through, { top: 675, height: 300 }, vh)).toBeCloseTo(0.5)
    // clamped either side
    expect(sceneProgress(through, { top: 2000, height: 300 }, vh)).toBe(0)
    expect(sceneProgress(through, { top: -2000, height: 300 }, vh)).toBe(1)
  })

  it("reads the foot edge from the element's height", () => {
    const leaving = { from: ["top", 0], to: ["bottom", 0.25] } as const
    expect(sceneProgress(leaving, { top: 64, height: 800 }, vh)).toBe(0)
    expect(sceneProgress(leaving, { top: 0, height: 800 }, vh)).toBe(0)
    // the foot at a quarter of the viewport: the top at 225 - 800
    expect(sceneProgress(leaving, { top: 225 - 800, height: 800 }, vh)).toBe(1)
  })

  it("runs through the span a pinned child holds", () => {
    const pin = { pin: true } as const
    // not yet pinned: the child stands at the run's top
    expect(sceneProgress(pin, { top: 300, height: 900 }, vh, { top: 300, height: 500 })).toBe(0)
    // pinned at 200 while the run's top went to -0: halfway through the 400px hold
    expect(sceneProgress(pin, { top: 0, height: 900 }, vh, { top: 200, height: 500 })).toBe(0.5)
    expect(sceneProgress(pin, { top: -800, height: 900 }, vh, { top: -400, height: 500 })).toBe(1)
  })

  it("is written on the glide", () => {
    expect(sceneValue(0)).toBe("0.0000")
    expect(sceneValue(1)).toBe(glide(1).toFixed(4))
    expect(sceneValue(0.25)).toBe(glide(0.25).toFixed(4))
    expect(Number(sceneValue(0.25))).toBeGreaterThan(0.5)
  })
})

describe("the landing's scenes", () => {
  it("ease the hero back, slide the tiles in and hold the plates", () => {
    expect(SCENES.hero).toEqual({ from: ["top", 0], to: ["bottom", 0] })
    expect(SCENES.tile.from).toEqual(["top", 1])
    expect(SCENES.plate).toEqual({ pin: true })
    // the hero at rest under the header has not started
    expect(sceneProgress(SCENES.hero, { top: 64, height: 800 }, 900)).toBe(0)
  })

  it("move only where motion is welcome, and only by the compositor", () => {
    for (const file of [
      "packages/site/src/pages/landing/Showcase.css",
      "packages/site/src/pages/landing/Plate.css",
      "packages/site/src/pages/landing/Examples.css",
    ]) {
      const css = read(file)
      const blocks = [...css.matchAll(/@media \(prefers-reduced-motion: no-preference\)[^{]*\{/g)]
      expect(blocks.length, file).toBeGreaterThan(0)
      // every reading of the scene sits after the welcome opens, inside it
      const first = blocks[0].index!
      for (const m of css.matchAll(/var\(--scene/g)) expect(m.index!, file).toBeGreaterThan(first)
      // what it moves: translate, scale and opacity, nothing that lays out
      const moved = [...css.matchAll(/^\s+([a-z-]+): [^;]*var\(--scene/gm)].map((m) => m[1])
      expect(moved.length, file).toBeGreaterThan(0)
      for (const p of moved) expect(["translate", "scale", "opacity"], `${file}: ${p}`).toContain(p)
    }
  })
})
