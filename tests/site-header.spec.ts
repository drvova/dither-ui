// @rstest-environment jsdom
import { describe, expect, it } from "rstack/test"
import { MARK_CELLS as LANDING_MARK } from "@/pages/landing/brand"
import { MARK_CELLS } from "@/shared/ui/brand-mark"
import { SEAM_HEIGHT, SEAM_MASK } from "@/widgets/site-header/menu"

// One header for the pages that read: the same links and key on each, the
// page's own link current, a page's tools beside the key.
describe("site header", () => {
  it("seams the bands with the kit's dither: a mask exactly the seam's height", () => {
    expect(SEAM_MASK.image).toMatch(/^url\("data:image\/svg\+xml/)
    expect(SEAM_MASK.size).toMatch(new RegExp(` ${SEAM_HEIGHT}px$`))
  })

  it("draws the same diamond the landing's lockup leads with", () => {
    expect(MARK_CELLS).toEqual(LANDING_MARK)
  })
})
