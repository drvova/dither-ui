// The site's one sprite (`shared/ui/sprite-file.ts`): every kit glyph and
// every tool's mark as their sources draw them, and the brand mark and the
// mascot's parts printing exactly their tables' cells, the mascot in every
// pose put together the way its stylesheet stands the parts.
import { describe, expect, it } from "rstack/test"
import { ICON_NAMES, ICONS, iconSymbolId } from "@dither-ui/kit/engine/icons.ts"
import { MARK_CELLS } from "@/shared/ui/brand-mark"
import { type MarkId, MARKS } from "@/shared/ui/marks"
import { EYE, MASCOT_ROTOR_STEPS, type MascotPose, mascotCells } from "@/shared/ui/mascot"
import { BRAND_SYMBOL, MASCOT_SYMBOLS, markSymbol } from "@/shared/ui/sprite"
import { spriteFile, spriteSvg } from "@/shared/ui/sprite-file"

const svg = spriteSvg()
const symbol = (id: string) => {
  const m = svg.match(new RegExp(`<symbol id="${id}"([^>]*)>(.*?)</symbol>`))
  if (!m) throw new Error(`no symbol ${id}`)
  return { attrs: m[1], body: m[2] }
}
const paths = (id: string) => [...symbol(id).body.matchAll(/<path([^>]*?) d="([^"]+)"\/>/g)].map((m) => m[2])

/** A cell symbol's cells, `ember` for those in the signal ink. */
function cells(id: string, dy = 0) {
  const out: string[] = []
  for (const m of symbol(id).body.matchAll(/<path ([^>]*?)d="([^"]+)"\/>/g)) {
    const ink = m[1].includes("--signal") ? "ember" : "body"
    for (const r of m[2].matchAll(/M(\d+) (\d+)h(\d+)v1h-(\d+)z/g)) {
      expect(r[3]).toBe(r[4])
      for (let i = 0; i < Number(r[3]); i++) out.push(`${Number(r[1]) + i},${Number(r[2]) + dy},${ink}`)
    }
  }
  return out
}
const sorted = (a: string[]) => [...a].sort()

describe("the sprite", () => {
  it("carries every kit glyph as the kit writes it", () => {
    for (const name of ICON_NAMES) {
      expect(symbol(iconSymbolId(name)).attrs, name).toContain('viewBox="0 0 24 24"')
      expect(paths(iconSymbolId(name)), name).toEqual([...ICONS[name]])
    }
  })

  it("carries every tool's mark verbatim, in its own box and fill rule", () => {
    for (const id of Object.keys(MARKS) as MarkId[]) {
      const s = symbol(markSymbol(id))
      expect(s.attrs).toContain(`viewBox="${MARKS[id].viewBox}"`)
      expect(s.attrs.includes('fill-rule="evenodd"'), id).toBe("evenodd" in MARKS[id])
      expect(paths(markSymbol(id))).toEqual([...MARKS[id].d])
    }
  })

  it("prints the brand mark's cells, its core in the ember", () => {
    expect(sorted(cells(BRAND_SYMBOL))).toEqual(
      sorted(MARK_CELLS.map((c) => `${c.x},${c.y},${c.core ? "ember" : "body"}`)),
    )
  })

  it("stands the mascot in every pose from its parts as its stylesheet does", () => {
    const of = (pose: MascotPose, turn = 0) => sorted(mascotCells(pose, turn).map((c) => `${c.x},${c.y},${c.ink}`))
    // standing a row down; hopping up, its feet tucked; blinking, the lid on
    const stand = (top: string) => [
      ...cells(top, 1),
      ...cells(MASCOT_SYMBOLS.body, 1),
      ...cells(MASCOT_SYMBOLS.feet, 1),
    ]
    expect(sorted(stand(MASCOT_SYMBOLS.antennae))).toEqual(of("idle"))
    expect(sorted(stand(MASCOT_SYMBOLS.wave))).toEqual(of("wave"))
    expect(sorted([...stand(MASCOT_SYMBOLS.antennae), `${EYE[0]},${EYE[1] + 1},body`])).toEqual(of("blink"))
    expect(sorted([...cells(MASCOT_SYMBOLS.antennae), ...cells(MASCOT_SYMBOLS.body)])).toEqual(of("hop"))
    for (let turn = 0; turn < MASCOT_ROTOR_STEPS; turn++)
      expect(
        sorted([...cells(MASCOT_SYMBOLS.rotor(turn)), ...cells(MASCOT_SYMBOLS.body), ...cells(MASCOT_SYMBOLS.feet)]),
      ).toEqual(of("fly", turn))
  })

  it("is named by its content under the build's assets", () => {
    const file = spriteFile()
    expect(file.svg).toBe(svg)
    expect(file.path).toMatch(/^_build\/assets\/sprite-[0-9a-f]{8}\.svg$/)
  })
})
