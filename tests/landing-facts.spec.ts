import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { SCREENS, SCREEN_KINDS } from "../dither-kit/engine/pixel"
import { STYLING_LABELS } from "../src/shared/lib/restyle"
import { COMPONENT_COUNT, RUNTIME_DEPS, SPECS } from "../src/pages/landing/facts"
import { FAMILIES, SECTION_COUNT } from "../src/pages/landing/hub"
import { choreograph, LOCKUP, LOCKUP_SIZE, MARK_CELLS, MOMENT, type Scene } from "../src/pages/landing/brand"
import { PLATES, sceneOf, STOCK } from "../src/pages/landing/plate"

const index = readFileSync(new URL("../dither-kit/tailwind/index.ts", import.meta.url), "utf8")
const components = [...index.matchAll(/default as (\w+)/g)].map((m) => m[1])
const kit = JSON.parse(readFileSync(new URL("../dither-kit/package.json", import.meta.url), "utf8")) as {
  license: string
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional?: boolean }>
}
const port = JSON.parse(readFileSync(new URL("../dither-kit-svelte/package.json", import.meta.url), "utf8")) as {
  peerDependencies: Record<string, string>
}

describe("landing facts", () => {
  it("counts the kit's public Dither components", () => {
    expect(COMPONENT_COUNT).toBe(components.filter((n) => n.startsWith("Dither")).length)
  })

  it("is the count every page, card and doc states", () => {
    const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8")
    const stated = ["index.html", "README.md", "public/agent/SKILL.md", "src/pages/docs/crawler-files.ts"].flatMap(
      (f) =>
        [...read(f).matchAll(/\b(\d{3}) (?:Vue |public `Dither\*` )?components\b|\["(\d{3})", "components"\]/g)].map(
          (m) => Number(m[1] ?? m[2]),
        ),
    )
    expect(stated.length).toBeGreaterThanOrEqual(7)
    expect(new Set(stated)).toEqual(new Set([COMPONENT_COUNT]))
    // The Studio's film counts up to the components, the sections and the backgrounds, and names two.
    const film = read("src/features/agent/film.ts")
    const counts = [...film.matchAll(/to: (\d+), duration/g)].map((m) => Number(m[1]))
    expect(counts).toEqual([COMPONENT_COUNT, SECTION_COUNT, FAMILIES.find((f) => f.title === "Backgrounds")?.count])
    expect(film).toContain(`["${COMPONENT_COUNT}", "components"]`)
    expect(film).toContain(`["${SECTION_COUNT}", "docs sections"]`)
  })

  it("keeps a spec sheet the kit bears out", () => {
    const spec = (label: string) => SPECS.find((s) => s.label === label)?.value ?? ""
    expect(spec("Components")).toContain("Vue 3")
    expect(kit.peerDependencies.vue).toMatch(/^\^3\./)
    expect(spec("Components")).toContain("Svelte 5")
    expect(port.peerDependencies.svelte).toMatch(/^\^5\./)
    expect(spec("Engine")).toContain(`${SCREENS.bayer.length}×${SCREENS.bayer[0].length}`)
    expect(spec("Screens")).toBe(SCREEN_KINDS.join(", "))
    for (const name of Object.values(STYLING_LABELS)) expect(spec("Styling")).toContain(name)
    expect(spec("License")).toBe(kit.license)
    for (const s of SPECS) expect(`${s.label} ${s.value}`).not.toMatch(/[—·]/)
  })

  it("names every package the kit needs beside Vue (a styling layer's own, optional, aside)", () => {
    const peers = Object.keys(kit.peerDependencies).filter((p) => p !== "vue" && !kit.peerDependenciesMeta[p]?.optional)
    expect([...RUNTIME_DEPS].sort()).toEqual(peers.sort())
  })

  it("prints the plate on the raised ground", () => {
    // The plate's stock is `--surface` as a colour the kit can print with:
    // the token's oklab mix of the landing's ink into its ground.
    const css = readFileSync(new URL("../src/pages/landing/chapters.css", import.meta.url), "utf8")
    const token = (name: string) => css.match(new RegExp(`${name}: (#[0-9a-f]{6});`))![1]
    const [, share] = css.match(/--surface: color-mix\(in oklab, var\(--foreground\) (\d+)%, var\(--background\)\);/)!
    const mixed = mixOklab(token("--foreground"), token("--background"), Number(share) / 100)
    rgb(STOCK).forEach((c, i) => expect(Math.abs(c - mixed[i])).toBeLessThanOrEqual(1))
  })

  it("draws the mark as the diamond's cells around one ember core", () => {
    // 1 + 4 + 8 + 12 cells within three steps of the centre of a 7x7 grid.
    expect(MARK_CELLS).toHaveLength(25)
    expect(MARK_CELLS.filter((c) => c.core)).toEqual([{ x: 3, y: 3, core: true }])
    for (const { x, y } of MARK_CELLS) expect(Math.abs(x - 3) + Math.abs(y - 3)).toBeLessThanOrEqual(3)
  })

  it("plays the brand's moment on the grid in its scene, home inside five seconds", () => {
    const cell = 4
    const box = { width: 1232, height: 524 }
    const marks = MARK_CELLS.length
    expect(LOCKUP).toHaveLength(marks + LOCKUP.filter((c) => c.x >= 10).length)
    expect(new Set(LOCKUP.map((c) => `${c.x}.${c.y}`)).size).toBe(LOCKUP.length)
    expect(MOMENT.end).toBeLessThanOrEqual(5000)
    const { gather, burst, settle } = MOMENT
    expect(gather.lift + gather.sweep + gather.span[1]).toBeLessThanOrEqual(burst.at)
    expect(burst.at + burst.span).toBeLessThanOrEqual(settle.at)
    expect(settle.at + settle.sweep + settle.span).toBeLessThanOrEqual(MOMENT.end)
    // Every plate, and a scene with rows like the hero's: the brand near the
    // field's foot, the burst kept off the copy above it.
    const top = 200
    const scenes: [number, Scene][] = [
      ...Object.values(PLATES).map((plate): [number, Scene] => [plate.mark[0], sceneOf(plate, box.height)]),
      [0, { seed: 5, loose: [top - 24, top + 160], burst: [top - 24, box.height] }],
    ]
    for (const [at, scene] of scenes) {
      const left = 16 + Math.round(at * (box.width - 32 - LOCKUP_SIZE.width * cell))
      const slots = LOCKUP.map((c) => ({ x: left + c.x * cell, y: top + c.y * cell }))
      const paths = choreograph(scene, box, slots, cell)
      expect(choreograph(scene, box, slots, cell)).toEqual(paths)
      const within = (y: number, [lo, hi]: readonly [number, number]) => {
        expect(y).toBeGreaterThanOrEqual(lo - cell)
        expect(y).toBeLessThanOrEqual(hi + cell)
      }
      paths.forEach((path, i) => {
        // In time order, on the cell's own grid, inside the plate, home at the end.
        path.forEach((p, k) => {
          if (k) expect(p.t).toBeGreaterThanOrEqual(path[k - 1].t)
          expect(Math.abs((p.x - slots[i].x) % cell)).toBe(0)
          expect(Math.abs((p.y - slots[i].y) % cell)).toBe(0)
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThan(box.width)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThan(box.height)
        })
        expect(path.at(-1)).toEqual({ ...slots[i], t: MOMENT.end })
        // Loose in the scene's rows; thrown inside its burst rows.
        within(path[0].y, scene.loose)
        within(path.find((p) => p.t === burst.at + burst.span)!.y, scene.burst)
        // Until the burst a wordmark cell shares a bone mark cell's square.
        if (i >= marks) {
          const before = path.filter((p) => p.t <= burst.at)
          const host = paths
            .slice(0, marks)
            .find((h, j) => !MARK_CELLS[j].core && h[0].x === path[0].x && h[0].y === path[0].y)
          expect(host).toBeDefined()
          expect(before).toEqual(host!.filter((p) => p.t <= burst.at))
        }
      })
    }
  })

  it("stands each plate's mark in its clear band, its tones thin", () => {
    for (const { sky, band, ground, mark } of Object.values(PLATES)) {
      expect(band[0]).toBeLessThan(band[1])
      expect(mark[1]).toBeGreaterThan(band[0])
      expect(mark[1]).toBeLessThan(band[1])
      expect(mark[0]).toBeGreaterThan(0.1)
      expect(mark[0]).toBeLessThan(0.7)
      for (const tone of [sky, ground]) {
        expect(tone).toBeGreaterThan(0)
        expect(tone).toBeLessThanOrEqual(0.4)
      }
    }
  })
})

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** CSS `color-mix(in oklab, a share, b)` of two sRGB hexes, back in sRGB 0-255. */
function mixOklab(a: string, b: string, share: number): number[] {
  const toLin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const toSrgb = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
  const lab = (hex: string) => {
    const [r, g, bl] = rgb(hex).map(toLin)
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl)
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ]
  }
  const [L, A, B] = lab(a).map((v, i) => v * share + lab(b)[i] * (1 - share))
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.round(toSrgb(c)))
}
