import { describe, expect, it } from "rstack/test"
import { ICONS, ICON_NAMES } from "../dither-kit/engine/icons"

describe("icon set data", () => {
  it("every glyph is a non-empty list of path strings", () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(50)
    for (const name of ICON_NAMES) {
      const glyph = ICONS[name]
      expect(glyph.length, name).toBeGreaterThan(0)
      for (const d of glyph) expect(d, name).toMatch(/^[Mm]/)
    }
  })
})
